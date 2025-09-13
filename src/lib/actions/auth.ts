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

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    // Profile creation is now handled automatically by database trigger
    // Welcome email will be sent automatically when profile is created

    revalidatePath('/')
    redirect('/login?message=Account created successfully! Welcome email sent.')
}

export async function signIn(formData: FormData) {
    console.log('🔐 AUTH: Starting built-in sign-in process')
    const supabase = await createClient()

    const emailOrUsername = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('🔐 AUTH: Input received:', { emailOrUsername: emailOrUsername.substring(0, 3) + '***' })

    let email = emailOrUsername

    // Check if input is a username (not an email)
    if (!emailOrUsername.includes('@')) {
        console.log('🔐 AUTH: Username detected, looking up email')
        // Look up email by username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', emailOrUsername)
            .single()

        if (profileError || !profile) {
            console.log('🔐 AUTH: Username lookup failed:', profileError?.message)
            return { error: 'Invalid username or password' }
        }

        email = profile.email
        console.log('🔐 AUTH: Username resolved to email:', email.substring(0, 3) + '***')
    }

    console.log('🔐 AUTH: Attempting authentication with Supabase')
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })

    if (error) {
        console.log('🔐 AUTH: Authentication failed:', error.message)
        return { error: error.message }
    }

    if (!session) {
        console.log('🔐 AUTH: No session returned from Supabase')
        return { error: 'Failed to establish session. Please try again.' }
    }

    console.log('🔐 AUTH: Session established successfully for:', session.user.email)
    console.log('🔐 AUTH: Session details:', {
        userId: session.user.id,
        provider: session.user.app_metadata?.provider || 'email',
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    })

    // Set a session bridge flag that client will detect
    const sessionBridge = {
        userId: session.user.id,
        email: session.user.email,
        timestamp: Date.now(),
        type: 'built_in_signin'
    }

    console.log('🔐 AUTH: Creating session bridge for client:', sessionBridge)

    // Wait for cookies to be written
    console.log('🔐 AUTH: Waiting for cookies to propagate...')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    console.log('🔐 AUTH: Revalidating paths...')
    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/profile')

    console.log('🔐 AUTH: Server-side authentication completed successfully')
    // Return session bridge data for client handling
    return { 
        success: true,
        sessionBridge,
        message: 'Authentication successful' 
    }
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

    // Welcome emails are now sent automatically via database trigger
    // This function is kept for backward compatibility but no longer sends emails
    revalidatePath('/dashboard')
    redirect('/dashboard?message=Welcome emails are now sent automatically when profiles are created.')
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

export async function uploadProfileImage(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const file = formData.get('image') as File

    if (!file) {
        return { error: 'No image file provided' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return { error: 'File must be an image' }
    }

    // Validate file size (1MB limit - images should be resized client-side to 256x256)
    if (file.size > 1 * 1024 * 1024) {
        return { error: 'Image size must be less than 1MB. Please resize your image to 256x256 pixels.' }
    }

    try {
        // Get current profile to check if there's an existing avatar
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { error: 'Failed to upload image' }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                avatar_url: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Profile update error:', updateError)
            return { error: 'Failed to update profile with new image' }
        }

        // Delete old avatar file if it exists
        if (currentProfile?.avatar_url) {
            try {
                const oldFileName = currentProfile.avatar_url.split('/').pop()
                if (oldFileName) {
                    await supabase.storage
                        .from('avatars')
                        .remove([oldFileName])
                }
            } catch (deleteError) {
                console.warn('Failed to delete old avatar:', deleteError)
                // Don't fail the upload if deletion fails
            }
        }

        revalidatePath('/profile')
        return {
            message: 'Profile image updated successfully',
            avatar_url: publicUrl
        }

    } catch (error) {
        console.error('Image upload error:', error)
        return { error: 'Failed to upload image' }
    }
}

export async function removeProfileImage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    try {
        // Get current profile to get the avatar URL
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()

        if (!currentProfile?.avatar_url) {
            return { error: 'No profile image to remove' }
        }

        // Delete the file from storage
        const fileName = currentProfile.avatar_url.split('/').pop()
        if (fileName) {
            const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove([fileName])

            if (deleteError) {
                console.error('File deletion error:', deleteError)
                return { error: 'Failed to delete image file' }
            }
        }

        // Update profile to remove avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                avatar_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Profile update error:', updateError)
            return { error: 'Failed to update profile' }
        }

        revalidatePath('/profile')
        return { message: 'Profile image removed successfully' }

    } catch (error) {
        console.error('Image removal error:', error)
        return { error: 'Failed to remove image' }
    }
}


