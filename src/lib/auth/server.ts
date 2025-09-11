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
        let user: User | null = null
        let authMethod = 'none'

        // Method 1: Try to get session first (better for OAuth)
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (session?.user && !sessionError) {
                user = session.user
                authMethod = 'session'
                console.log(`Server auth: Found user via session - ${user.email}`)
            }
        } catch {
            console.log('Server auth: Session check failed, trying getUser')
        }

        // Method 2: Fallback to getUser if session failed
        if (!user) {
            try {
                const { data: { user: tokenUser }, error: userError } = await supabase.auth.getUser()
                if (tokenUser && !userError) {
                    user = tokenUser
                    authMethod = 'token'
                    console.log(`Server auth: Found user via token - ${user.email}`)
                }
            } catch {
                console.log('Server auth: Token check also failed')
            }
        }

        if (!user) {
            console.log('Server auth: No user found via any method')
            return { user: null, error: 'Not authenticated' }
        }

        console.log(`Server auth successful: ${authMethod} for ${user.email}`)
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