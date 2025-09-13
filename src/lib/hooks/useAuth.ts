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
                console.log('🌀 AUTH_HOOK: Initializing authentication system...')
                
                // Check for session bridge data
                let sessionBridge = null
                if (typeof window !== 'undefined') {
                    const bridgeData = sessionStorage.getItem('auth_bridge')
                    console.log('🌀 AUTH_HOOK: Checking for session bridge...', !!bridgeData)
                    if (bridgeData) {
                        try {
                            sessionBridge = JSON.parse(bridgeData)
                            console.log('🌀 AUTH_HOOK: Found session bridge for user:', sessionBridge.email)
                            console.log('🌀 AUTH_HOOK: Bridge timestamp:', new Date(sessionBridge.timestamp).toISOString())
                            sessionStorage.removeItem('auth_bridge') // Clean up
                        } catch (e) {
                            console.warn('🌀 AUTH_HOOK: Invalid session bridge data:', e)
                        }
                    } else {
                        console.log('🌀 AUTH_HOOK: No session bridge found - normal startup')
                    }
                }
                
                // Get initial session with retry logic if we have bridge data
                let session = null
                let error = null
                
                const maxAttempts = sessionBridge ? 5 : 1
                console.log(`🌀 AUTH_HOOK: Will attempt session detection ${maxAttempts} times`)
                
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    console.log(`🌀 AUTH_HOOK: Session detection attempt ${attempt + 1}/${maxAttempts}`)
                    const result = await supabase.auth.getSession()
                    session = result.data?.session
                    error = result.error
                    
                    if (error) {
                        console.error(`🌀 AUTH_HOOK: Session error (attempt ${attempt + 1}):`, error)
                        break
                    }
                    
                    if (session?.user) {
                        console.log(`🌀 AUTH_HOOK: ✅ Session found on attempt ${attempt + 1}!`)
                        console.log(`🌀 AUTH_HOOK: User: ${session.user.email}, Provider: ${session.user.app_metadata?.provider || 'email'}`)
                        break
                    }
                    
                    if (sessionBridge && attempt < maxAttempts - 1) {
                        console.log(`🌀 AUTH_HOOK: No session yet (attempt ${attempt + 1}), will retry in 300ms...`)
                        await new Promise(resolve => setTimeout(resolve, 300))
                    } else if (!sessionBridge) {
                        console.log(`🌀 AUTH_HOOK: No session found (no bridge data - normal startup)`)
                    }
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
                    
                    if (session?.user) {
                        console.log('🌀 AUTH_HOOK: ✅ Authentication successful! State updated.')
                    } else {
                        console.log('🌀 AUTH_HOOK: No session detected - user not authenticated')
                        if (sessionBridge) {
                            console.log('🌀 AUTH_HOOK: ⚠️ Session bridge was provided but no session found!')
                        }
                    }
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
                console.error('🌀 AUTH_HOOK: 🛑 Initialization failed:', error)
                
                // Try to recover from initialization failure
                if (sessionBridge && typeof window !== 'undefined') {
                    console.log('🌀 AUTH_HOOK: 🔄 Attempting session recovery...')
                    try {
                        // Force a session refresh
                        await supabase.auth.refreshSession()
                        const { data: { session: recoveredSession } } = await supabase.auth.getSession()
                        
                        if (recoveredSession?.user && mountedRef.current) {
                            console.log('🌀 AUTH_HOOK: ✅ Session recovered successfully!')
                            setUser(recoveredSession.user)
                            setLoading(false)
                            setInitialized(true)
                            return
                        }
                    } catch (recoveryError) {
                        console.error('🌀 AUTH_HOOK: Session recovery failed:', recoveryError)
                    }
                }
                
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
