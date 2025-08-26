import { createClient } from './server'
import { sendWelcomeEmail } from '@/lib/actions/email'

// This function will be called by Supabase database triggers
export async function handleNewUserSignup(userId: string, userEmail: string, userMetadata: any) {
    try {
        // Extract full name from user metadata
        const fullName = userMetadata?.full_name || userMetadata?.name || 'User'

        // Send welcome email
        await sendWelcomeEmail(userId, userEmail, fullName)

        console.log(`Welcome email sent to new user: ${userEmail}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to handle new user signup:', error)
        return { success: false, error: error.message }
    }
}

// Alternative function using Supabase's built-in email service
export async function handleNewUserSignupWithSupabase(userId: string, userEmail: string, userMetadata: any) {
    try {
        const supabase = await createClient()

        // Extract full name from user metadata
        const fullName = userMetadata?.full_name || userMetadata?.name || 'User'

        // Send welcome email using Supabase
        await sendWelcomeEmailWithSupabase(userId, userEmail, fullName)

        console.log(`Welcome email sent to new user via Supabase: ${userEmail}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to handle new user signup via Supabase:', error)
        return { success: false, error: error.message }
    }
}
