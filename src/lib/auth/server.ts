'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database.types'

export interface ServerAuthResult {
    user: User
    error?: never
}

export interface ServerAuthError {
    user?: never
    error: string
}

/**
 * Get current authenticated user from server-side
 * Returns user if authenticated, null if not
 */
export async function getServerAuth(): Promise<{ user: User | null; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
            console.error('Server auth check failed:', error)
            return { user: null, error: error.message }
        }
        
        return { user, error: undefined }
    } catch (err) {
        console.error('Server auth check unexpected error:', err)
        return { 
            user: null, 
            error: err instanceof Error ? err.message : 'Authentication check failed' 
        }
    }
}

/**
 * Require authentication on server-side
 * Redirects to login if not authenticated
 * Returns user if authenticated
 */
export async function requireAuth(): Promise<User> {
    const { user, error } = await getServerAuth()
    
    if (!user || error) {
        console.log('Server: Authentication required, redirecting to login')
        redirect('/login?message=Please sign in to access this page')
    }
    
    return user
}

/**
 * Get user profile along with auth check
 * Returns both user and profile data
 */
export async function getServerAuthWithProfile(): Promise<{
    user: User
    profile: Profile | null
}> {
    const user = await requireAuth()
    
    try {
        const supabase = await createClient()
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch error:', profileError)
        }
        
        return { user, profile }
    } catch (err) {
        console.error('Profile fetch unexpected error:', err)
        return { user, profile: null }
    }
}

/**
 * Check if user is authenticated without redirecting
 * Useful for optional auth checks
 */
export async function checkAuth(): Promise<boolean> {
    const { user } = await getServerAuth()
    return !!user
}