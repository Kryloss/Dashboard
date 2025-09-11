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

    useEffect(() => {
        mountedRef.current = true
        let authStateListener: { unsubscribe: () => void } | null = null

        async function initializeAuth() {
            try {
                console.log('useAuth: Initializing authentication...')
                
                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession()
                
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

                        // Update state immediately
                        setUser(currentSession?.user ?? null)
                        setLoading(false)

                        // Handle specific events
                        switch (event) {
                            case 'SIGNED_IN':
                                console.log('useAuth: User signed in successfully')
                                break
                            case 'SIGNED_OUT':
                                console.log('useAuth: User signed out - redirecting to login')
                                // Clear cache and redirect
                                try {
                                    await invalidateAuthCache()
                                } catch (cacheError) {
                                    console.warn('useAuth: Cache invalidation failed:', cacheError)
                                }
                                router.replace('/login?message=Signed out successfully')
                                break
                            case 'TOKEN_REFRESHED':
                                console.log('useAuth: Token refreshed')
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
            
            // Supabase sign out - this will trigger the SIGNED_OUT event
            await supabase.auth.signOut()
            
            console.log('useAuth: Sign out completed')
        } catch (error) {
            console.error('useAuth: Sign out error:', error)
            // Even if sign out fails, clear local state
            setUser(null)
            setLoading(false)
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
        loading: loading && !initialized,
        signOut,
        refreshSession,
        isAuthenticated: !!user && initialized,
        initialized,
        supabase
    }
}
