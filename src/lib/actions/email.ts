import { createClient } from '@/lib/supabase/server'
import { WelcomeEmail } from '@/emails/welcome-email'
import { renderAsync } from '@react-email/components'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(userId: string, userEmail: string, fullName: string) {
    try {
        // Render the email template
        const emailHtml = await renderAsync(WelcomeEmail({ fullName }))

        // Send the email using Resend
        const { data, error } = await resend.emails.send({
            from: 'Kryloss <noreply@kryloss.com>',
            to: [userEmail],
            subject: 'Welcome to Kryloss - Your productivity platform is ready!',
            html: emailHtml,
        })

        if (error) {
            console.error('Failed to send welcome email:', error)
            throw new Error('Failed to send welcome email')
        }

        // Log successful email send
        console.log('Welcome email sent successfully:', data)

        return { success: true, data }
    } catch (error) {
        console.error('Error sending welcome email:', error)
        throw new Error('Failed to send welcome email')
    }
}

export async function sendWelcomeEmailWithSupabase(userId: string, userEmail: string, fullName: string) {
    try {
        const supabase = await createClient()

        // Send email using Supabase's built-in email service
        const { data, error } = await supabase.auth.admin.sendRawEmail({
            to: userEmail,
            subject: 'Welcome to Kryloss - Your productivity platform is ready!',
            html: await renderAsync(WelcomeEmail({ fullName })),
        })

        if (error) {
            console.error('Failed to send welcome email via Supabase:', error)
            throw new Error('Failed to send welcome email')
        }

        console.log('Welcome email sent successfully via Supabase:', data)
        return { success: true, data }
    } catch (error) {
        console.error('Error sending welcome email via Supabase:', error)
        throw new Error('Failed to send welcome email')
    }
}
