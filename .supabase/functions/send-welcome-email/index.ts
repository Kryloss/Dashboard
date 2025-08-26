import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
    try {
        // Parse the request body
        const { user, email } = await req.json();

        if (!user || !email) {
            return new Response(
                JSON.stringify({ error: "Missing user or email data" }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Here you would integrate with your email service
        // For now, we'll log the welcome email attempt
        console.log(`Welcome email sent to: ${email} for user: ${user.id}`);

        // You can integrate with services like:
        // - Resend (resend.com)
        // - SendGrid
        // - AWS SES
        // - Or use Supabase's built-in email service

        return new Response(
            JSON.stringify({
                success: true,
                message: `Welcome email sent to ${email}`,
                userId: user.id
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
