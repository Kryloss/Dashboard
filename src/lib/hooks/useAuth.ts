import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { invalidateAuthCache } from '@/lib/actions/cache-invalidation'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                console.log('useAuth: Getting initial session...')
                const { data: { session: initialSession } } = await supabase.auth.getSession()
                console.log('useAuth: Initial session:', initialSession?.user?.email || 'No user')
                setSession(initialSession)
                setUser(initialSession?.user ?? null)
            } catch (error) {
                console.error('useAuth: Error getting initial session:', error)
                // If Supabase fails, still resolve loading to prevent infinite loading
                setSession(null)
                setUser(null)
            } finally {
                console.log('useAuth: Setting loading to false')
                setLoading(false)
            }
        }

        // Add timeout failsafe in case getSession hangs
        const timeoutId = setTimeout(() => {
            console.warn('useAuth: getSession timed out after 3 seconds, resolving loading state')
            setLoading(false)
        }, 3000)

        getInitialSession().finally(() => clearTimeout(timeoutId))

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, currentSession: Session | null) => {
                console.log('Auth state changed:', event, currentSession?.user?.email)

                setSession(currentSession)
                setUser(currentSession?.user ?? null)
                setLoading(false)

                // Handle specific auth events
                switch (event) {
                    case 'SIGNED_IN':
                        console.log('User signed in:', currentSession?.user?.email)
                        // Invalidate cache when new user signs in
                        try {
                            await invalidateAuthCache()
                            console.log('Cache invalidated after sign in')
                        } catch (cacheError) {
                            console.warn('Cache invalidation failed after sign in:', cacheError)
                        }
                        break
                    case 'SIGNED_OUT':
                        console.log('User signed out')
                        // Cache is already invalidated in signOut function
                        break
                    case 'TOKEN_REFRESHED':
                        console.log('Token refreshed')
                        break
                    case 'USER_UPDATED':
                        console.log('User updated:', currentSession?.user?.email)
                        // Invalidate cache when user data changes
                        try {
                            await invalidateAuthCache()
                            console.log('Cache invalidated after user update')
                        } catch (cacheError) {
                            console.warn('Cache invalidation failed after user update:', cacheError)
                        }
                        break
                    case 'PASSWORD_RECOVERY':
                        console.log('Password recovery initiated')
                        break
                    default:
                        console.log('Unknown auth event:', event)
                }
            }
        )

        // Cleanup subscription on unmount
        return () => {
            subscription.unsubscribe()
        }
    }, [supabase.auth])

    const signOut = async () => {
        try {
            console.log('useAuth: Signing out...')
            
            // Invalidate server cache first
            try {
                await invalidateAuthCache()
                console.log('useAuth: Server cache invalidated')
            } catch (cacheError) {
                console.warn('useAuth: Cache invalidation failed:', cacheError)
            }
            
            await supabase.auth.signOut()
            
            // Clear all auth state immediately 
            setSession(null)
            setUser(null)
            
            // Clear any cached auth data in localStorage/sessionStorage
            if (typeof window !== 'undefined') {
                try {
                    // Clear Supabase storage keys
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('supabase.auth.')) {
                            localStorage.removeItem(key)
                        }
                    })
                    Object.keys(sessionStorage).forEach(key => {
                        if (key.startsWith('supabase.auth.')) {
                            sessionStorage.removeItem(key)
                        }
                    })
                    console.log('useAuth: Cleared local storage auth data')
                } catch (storageError) {
                    console.warn('useAuth: Could not clear storage:', storageError)
                }

                // Force reload to clear all caches
                window.location.href = '/login?message=Signed out successfully'
            }
        } catch (error) {
            console.error('Error signing out:', error)
            // Even if sign out fails, clear local state and redirect
            setSession(null)
            setUser(null)
            if (typeof window !== 'undefined') {
                window.location.href = '/login?message=Sign out failed - please try again'
            }
        }
    }

    const refreshSession = async () => {
        try {
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
            setSession(refreshedSession)
            setUser(refreshedSession?.user ?? null)
            return refreshedSession
        } catch (error) {
            console.error('Error refreshing session:', error)
            return null
        }
    }

    return {
        user,
        session,
        loading,
        signOut,
        refreshSession,
        isAuthenticated: !!user,
        supabase
    }
}
