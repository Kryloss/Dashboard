import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { invalidateAuthCache } from '@/lib/actions/cache-invalidation'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const supabase = createClient()
    const router = useRouter()
    const mountedRef = useRef(true)
    const signOutPendingRef = useRef(false)

    useEffect(() => {
        mountedRef.current = true
        let authStateListener: { unsubscribe: () => void } | null = null

        async function initializeAuth() {
            try {
                console.log('useAuth: Initializing authentication...')
                
                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession()
                
                // Debug: Check what cookies are available
                if (typeof window !== 'undefined') {
                    const cookies = document.cookie.split(';').map(c => c.trim()).filter(c => c.includes('sb-'))
                    console.log('useAuth: Available cookies:', cookies)
                    console.log('useAuth: Current domain:', window.location.hostname)
                }
                
                if (error) {
                    console.error('useAuth: Session fetch error:', error)
                    if (mountedRef.current) {
                        setUser(null)
                        setLoading(false)
                        setInitialized(true)
                    }
                    return
                }

                if (mountedRef.current) {
                    setUser(session?.user ?? null)
                    setLoading(false)
                    setInitialized(true)
                    console.log('useAuth: Initial auth state set:', session?.user?.email || 'No user')
                }

                // Set up auth state change listener
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event: AuthChangeEvent, currentSession: Session | null) => {
                        if (!mountedRef.current) return

                        console.log('useAuth: Auth state change:', event, currentSession?.user?.email || 'No user')

                        // Handle specific events with more careful state management
                        switch (event) {
                            case 'INITIAL_SESSION':
                                // Set initial state but don't redirect
                                setUser(currentSession?.user ?? null)
                                setLoading(false)
                                break
                            case 'SIGNED_IN':
                                console.log('useAuth: User signed in successfully')
                                setUser(currentSession?.user ?? null)
                                setLoading(false)
                                signOutPendingRef.current = false // Reset sign out flag
                                break
                            case 'SIGNED_OUT':
                                // Only redirect if this wasn't part of our own sign out process
                                if (!signOutPendingRef.current) {
                                    console.log('useAuth: Unexpected sign out - redirecting to login')
                                    setUser(null)
                                    setLoading(false)
                                    // Clear cache and redirect
                                    try {
                                        await invalidateAuthCache()
                                    } catch (cacheError) {
                                        console.warn('useAuth: Cache invalidation failed:', cacheError)
                                    }
                                    router.replace('/login?message=Session expired. Please sign in again.')
                                } else {
                                    console.log('useAuth: Initiated sign out completed')
                                    setUser(null)
                                    setLoading(false)
                                    signOutPendingRef.current = false // Reset flag
                                }
                                break
                            case 'TOKEN_REFRESHED':
                                console.log('useAuth: Token refreshed')
                                setUser(currentSession?.user ?? null)
                                setLoading(false)
                                break
                            default:
                                // For any other event, update user state
                                setUser(currentSession?.user ?? null)
                                setLoading(false)
                                break
                        }
                    }
                )

                authStateListener = subscription
            } catch (error) {
                console.error('useAuth: Initialization failed:', error)
                if (mountedRef.current) {
                    setUser(null)
                    setLoading(false)
                    setInitialized(true)
                }
            }
        }

        initializeAuth()

        // Cleanup on unmount
        return () => {
            mountedRef.current = false
            if (authStateListener) {
                authStateListener.unsubscribe()
            }
        }
    }, [supabase, router])

    const signOut = useCallback(async () => {
        if (!initialized) return
        
        try {
            console.log('useAuth: Starting sign out process...')
            setLoading(true)
            
            // Set flag to indicate this is an intentional sign out
            signOutPendingRef.current = true
            
            // Supabase sign out - this will trigger the SIGNED_OUT event
            await supabase.auth.signOut()
            
            // Clear cache and redirect
            try {
                await invalidateAuthCache()
            } catch (cacheError) {
                console.warn('useAuth: Cache invalidation failed:', cacheError)
            }
            
            console.log('useAuth: Sign out completed - redirecting to login')
            router.replace('/login?message=Signed out successfully')
        } catch (error) {
            console.error('useAuth: Sign out error:', error)
            // Even if sign out fails, clear local state
            setUser(null)
            setLoading(false)
            signOutPendingRef.current = false
            router.replace('/login?message=Sign out failed - please try again')
        }
    }, [supabase, router, initialized])

    const refreshSession = useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.refreshSession()
            if (error) throw error
            
            if (mountedRef.current) {
                setUser(session?.user ?? null)
            }
            return session
        } catch (error) {
            console.error('useAuth: Session refresh failed:', error)
            return null
        }
    }, [supabase])

    return {
        user,
        loading: loading || !initialized,
        signOut,
        refreshSession,
        isAuthenticated: !!user && initialized,
        initialized,
        supabase
    }
}
