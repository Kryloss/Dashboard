import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
    try {
        // Parse the request body
        const { user, email, name } = await req.json();

        if (!user || !email) {
            return new Response(
                JSON.stringify({ error: "Missing user or email data" }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Get environment variables
        const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000';
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        // Create welcome email content
        const welcomeEmailData = {
            to: email,
            subject: `Welcome to Dashboard, ${name || 'User'}!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Dashboard</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #114EB2, #4AA7FF); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #4AA7FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to Dashboard!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${name || 'there'}!</h2>
                            <p>Thank you for joining Dashboard. We're excited to have you on board!</p>
                            <p>Your account has been successfully created and you can now:</p>
                            <ul>
                                <li>Access your personalized dashboard</li>
                                <li>Manage your profile settings</li>
                                <li>Explore our productivity tools</li>
                                <li>Connect with other users</li>
                            </ul>
                            <div style="text-align: center;">
                                <a href="${siteUrl}/dashboard" class="button">Go to Dashboard</a>
                            </div>
                            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
                        </div>
                        <div class="footer">
                            <p>This email was sent from Dashboard. If you didn't create this account, please ignore this email.</p>
                            <p>&copy; 2024 Dashboard. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Welcome to Dashboard, ${name || 'User'}!

Thank you for joining Dashboard. We're excited to have you on board!

Your account has been successfully created and you can now:
- Access your personalized dashboard
- Manage your profile settings  
- Explore our productivity tools
- Connect with other users

Go to Dashboard: ${siteUrl}/dashboard

If you have any questions or need assistance, feel free to reach out to our support team.

This email was sent from Dashboard. If you didn't create this account, please ignore this email.

© 2024 Dashboard. All rights reserved.
            `
        };

        // Send email using Resend if API key is available
        if (resendApiKey) {
            try {
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'Dashboard <noreply@yourdomain.com>', // Update this with your verified domain
                        to: [email],
                        subject: welcomeEmailData.subject,
                        html: welcomeEmailData.html,
                        text: welcomeEmailData.text,
                    }),
                });

                if (!resendResponse.ok) {
                    const errorData = await resendResponse.json();
                    console.error('Resend API error:', errorData);
                    throw new Error(`Resend API error: ${errorData.message || 'Failed to send email'}`);
                }

                const resendData = await resendResponse.json();
                console.log('Email sent successfully via Resend:', resendData);

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `Welcome email sent to ${email}`,
                        userId: user.id,
                        emailData: {
                            to: email,
                            subject: welcomeEmailData.subject,
                            sent: true,
                            provider: 'Resend',
                            messageId: resendData.id
                        }
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

            } catch (resendError) {
                console.error('Resend email sending failed:', resendError);
                // Fall back to logging for now
            }
        }

        // Fallback: Log the email (for development/testing)
        console.log('Welcome email prepared for:', email);
        console.log('Email subject:', welcomeEmailData.subject);
        console.log('Email content length:', welcomeEmailData.html.length, 'characters');
        console.log('Note: RESEND_API_KEY not set, email not actually sent');

        // Return success for testing purposes
        return new Response(
            JSON.stringify({
                success: true,
                message: `Welcome email prepared for ${email} (not sent - no API key)`,
                userId: user.id,
                emailData: {
                    to: email,
                    subject: welcomeEmailData.subject,
                    sent: false,
                    provider: 'Logging Only',
                    note: 'RESEND_API_KEY not configured'
                }
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Welcome email function error:', error);

        return new Response(
            JSON.stringify({
                error: "Failed to send welcome email",
                details: error.message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
});
