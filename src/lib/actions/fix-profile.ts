'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMissingProfile() {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
        return { error: 'Not authenticated' }
    }

    try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (existingProfile) {
            return { message: 'Profile already exists', profile: existingProfile }
        }

        // Create the missing profile
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: user.email!,
                    username: null,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
                }
            ])
            .select()
            .single()

        if (createError) {
            console.error('Profile creation error:', createError)
            return { 
                error: `Failed to create profile: ${createError.message}`,
                details: createError
            }
        }

        revalidatePath('/dashboard')
        revalidatePath('/profile')
        
        return { 
            message: 'Profile created successfully', 
            profile: newProfile 
        }

    } catch (error) {
        console.error('Unexpected error creating profile:', error)
        return { 
            error: 'An unexpected error occurred while creating profile'
        }
    }
}