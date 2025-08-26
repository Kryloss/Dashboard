import { Resend } from 'resend';
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/WelcomeEmail';

let resend: Resend | null = null;

// Initialize Resend client
function getResendClient(): Resend | null {
    if (resend) return resend;

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM;

    if (!apiKey || !fromEmail) {
        console.warn('Resend configuration missing: RESEND_API_KEY or RESEND_FROM not set');
        return null;
    }

    try {
        resend = new Resend(apiKey);
        return resend;
    } catch (error) {
        console.error('Failed to initialize Resend client:', error);
        return null;
    }
}

/**
 * Send a welcome email to a new user
 * @param to - Recipient email address
 * @param username - Optional username for personalization
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendWelcome(to: string, username?: string): Promise<boolean> {
    const client = getResendClient();
    if (!client) {
        console.warn('Cannot send welcome email: Resend not configured');
        return false;
    }

    const fromEmail = process.env.RESEND_FROM;
    if (!fromEmail) {
        console.warn('Cannot send welcome email: RESEND_FROM not configured');
        return false;
    }

    try {
        // Render the email component to HTML
        const emailHtml = await render(WelcomeEmail({ username }));

        // Send the email via Resend
        const result = await client.emails.send({
            from: fromEmail,
            to: [to],
            subject: username ? `Welcome to Kryloss, ${username}!` : 'Welcome to Kryloss!',
            html: emailHtml,
        });

        if (result.error) {
            console.error('Failed to send welcome email:', result.error);
            return false;
        }

        console.log('Welcome email sent successfully:', {
            to,
            messageId: result.data?.id,
            timestamp: new Date().toISOString(),
        });

        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
}

/**
 * Test function to verify Resend configuration
 * @returns Promise<boolean> - true if configuration is valid
 */
export async function testResendConfig(): Promise<boolean> {
    const client = getResendClient();
    if (!client) return false;

    try {
        // Try to get account info to verify API key
        await client.apiKeys.list();
        return true;
    } catch (error) {
        console.error('Resend configuration test failed:', error);
        return false;
    }
}
