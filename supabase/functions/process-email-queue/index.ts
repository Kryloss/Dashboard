import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get pending welcome emails
        const { data: pendingEmails, error: fetchError } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'pending')
            .eq('email_type', 'welcome')
            .order('created_at', { ascending: true })
            .limit(10)

        if (fetchError) {
            throw new Error(`Failed to fetch pending emails: ${fetchError.message}`)
        }

        if (!pendingEmails || pendingEmails.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No pending emails to process' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const results = []

        for (const emailItem of pendingEmails) {
            try {
                // Update status to processing
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'processing',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', emailItem.id)

                // Send welcome email using your email service
                // For now, we'll simulate sending by updating the status
                // In production, you'd call your email service here

                // Update status to sent
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', emailItem.id)

                results.push({
                    id: emailItem.id,
                    email: emailItem.email,
                    status: 'sent',
                    success: true
                })

            } catch (error) {
                // Update status to failed
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'failed',
                        error_message: error.message,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', emailItem.id)

                results.push({
                    id: emailItem.id,
                    email: emailItem.email,
                    status: 'failed',
                    success: false,
                    error: error.message
                })
            }
        }

        return new Response(
            JSON.stringify({
                message: `Processed ${results.length} emails`,
                results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
