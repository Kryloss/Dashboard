'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                full_name: formData.get('full_name') as string,
            }
        }
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
                    full_name: data.options.data.full_name,
                }
            ])

        if (profileError) {
            console.error('Profile creation error:', profileError)
        }

        // Send welcome email after successful signup
        try {
            await sendWelcomeEmail(authData.user.email!, data.options.data.full_name)
        } catch (emailError) {
            console.error('Welcome email error:', emailError)
            // Don't fail the signup if email fails
        }
    }

    revalidatePath('/')
    redirect('/login?message=Check your email to verify your account')
}

export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

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

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const updates = {
        full_name: formData.get('full_name') as string,
        updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { message: 'Profile updated successfully' }
}

// Server-only email utility
async function sendWelcomeEmail(email: string, fullName: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not found, skipping welcome email')
        return
    }

    const { Resend } = await import('resend')
    const { WelcomeEmail } = await import('@/emails/welcome-email')

    const resend = new Resend(process.env.RESEND_API_KEY)

    const fromEmail = process.env.RESEND_FROM || 'Kryloss <no-reply@kryloss.com>'

    try {
        await resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: 'Welcome to Kryloss - Your Account is Ready!',
            react: WelcomeEmail({ fullName }),
        })
    } catch (error) {
        console.error('Failed to send welcome email:', error)
        throw error
    }
}
