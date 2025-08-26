'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
    const supabase = await createClient()

    const username = formData.get('username') as string
    const email = formData.get('email') as string

    // Check if username is already taken
    if (username) {
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single()

        if (existingProfile) {
            return { error: 'Username is already taken' }
        }
    }

    const data = {
        email: email,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    // Create profile
    if (authData.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    email: authData.user.email!,
                    username: username ? username.toLowerCase() : null,
                    full_name: null,
                }
            ])

        if (profileError) {
            console.error('Profile creation error:', profileError.message, profileError.code, profileError.details)
            // Don't fail signup completely if profile creation fails
            // The profile page will handle creating it if missing
        }

        // Send welcome email immediately after successful signup
        try {
            await sendWelcomeEmail(authData.user.email!, username)
        } catch (emailError) {
            console.error('Welcome email error:', emailError)
            // Don't fail the signup if email fails
        }
    }

    revalidatePath('/')
    redirect('/login?message=Account created successfully! Welcome email sent.')
}

export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const emailOrUsername = formData.get('email') as string
    const password = formData.get('password') as string

    let email = emailOrUsername

    // Check if input is a username (not an email)
    if (!emailOrUsername.includes('@')) {
        // Look up email by username
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', emailOrUsername)
            .single()

        if (!profile) {
            return { error: 'Invalid username or password' }
        }

        email = profile.email
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    redirect('/dashboard')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
    redirect('/')
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { message: 'Check your email for the password reset link' }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    redirect('/dashboard?message=Password updated successfully')
}

export async function triggerWelcomeEmail() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?error=Not authenticated')
    }

    // Get user profile for name
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single()

    const name = profile?.username || profile?.full_name || user.email?.split('@')[0] || 'User'

    try {
        await sendWelcomeEmail(user.email!, name)
        revalidatePath('/dashboard')
        redirect('/dashboard?message=Welcome email sent successfully!')
    } catch (error) {
        console.error('Welcome email trigger error:', error)
        revalidatePath('/dashboard')
        redirect('/dashboard?error=Failed to send welcome email. Check logs for details.')
    }
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const username = formData.get('username') as string
    const fullName = formData.get('full_name') as string

    // Normalize username to lowercase if provided
    const normalizedUsername = username ? username.toLowerCase() : null

    // Check if username is already taken by another user
    if (normalizedUsername) {
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('username, id')
            .eq('username', normalizedUsername)
            .single()

        if (existingProfile && existingProfile.id !== user.id) {
            return { error: 'Username is already taken' }
        }
    }

    const updates: {
        updated_at: string
        username?: string | null
        full_name?: string | null
    } = {
        updated_at: new Date().toISOString(),
    }

    if (normalizedUsername !== null) {
        updates.username = normalizedUsername
    }

    if (fullName !== null) {
        updates.full_name = fullName
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        console.error('Profile update error:', error.message, error.code, error.details)

        // Provide more specific error messages
        if (error.code === '42501') {
            return { error: 'Permission denied. Please check your database policies.' }
        } else if (error.code === '23505') {
            return { error: 'Username is already taken' }
        } else {
            return { error: `Update failed: ${error.message}` }
        }
    }

    revalidatePath('/profile')
    return { message: 'Profile updated successfully' }
}

// Note: Google OAuth is now handled client-side only
// This function is kept for backward compatibility but should not be used

export async function handleGoogleCallback() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No user found' }
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!existingProfile) {
        // Create profile for Google user
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: user.email!,
                    username: null, // Will prompt user to set username
                }
            ])

        if (profileError) {
            console.error('Profile creation error:', profileError)
        }

        // Welcome email will be sent automatically by Supabase when user confirms their account
        // No need to manually send it here
    }

    // Check if username is missing and redirect to set it
    if (!existingProfile?.username) {
        redirect('/profile?message=Please set your username to complete your profile')
    }

    redirect('/dashboard')
}

// Server-only email utility using proper email service
async function sendWelcomeEmail(email: string, name: string) {
    try {
        // Use the Edge Function to send welcome emails
        const supabase = await createClient()

        // Call the Edge Function to send the welcome email
        const { data, error } = await supabase.functions.invoke('send-welcome-email', {
            body: {
                user: { id: 'welcome-user', email: email },
                email: email,
                name: name
            }
        })

        if (error) {
            console.error('Edge Function error:', error.message)
            throw new Error(`Failed to send welcome email: ${error.message}`)
        }

        if (!data || !data.success) {
            console.error('Edge Function returned error:', data)
            throw new Error('Edge Function failed to send welcome email')
        }

        console.log(`Welcome email sent successfully to ${email} for user ${name}`)
    } catch (error) {
        console.error('Failed to send welcome email:', error)
        throw error
    }
}
