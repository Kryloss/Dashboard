import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                console.log('Initial session:', session?.user?.email || 'No session')
                setUser(session?.user ?? null)
            } catch (error) {
                console.error('Error getting initial session:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getInitialSession()

        // Also refresh session when component mounts (in case of redirects)
        const refreshSession = async () => {
            try {
                await supabase.auth.refreshSession()
                console.log('Session refreshed')
            } catch (error) {
                console.error('Error refreshing session:', error)
            }
        }

        refreshSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                console.log('Auth state change:', event, session?.user?.email)

                setUser(session?.user ?? null)
                setLoading(false) // Ensure loading is false when auth state changes

                if (event === 'SIGNED_IN' && session?.user) {
                    console.log('User signed in:', session.user.email)
                    // User is now authenticated - the UI will update automatically
                }

                if (event === 'SIGNED_OUT') {
                    console.log('User signed out')
                    router.replace('/login')
                }
            }
        )

        // Refresh auth state when window regains focus (helps with server redirects)
        const handleFocus = async () => {
            console.log('Window focused, refreshing auth state')
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user && !user) {
                    console.log('Found session on focus, updating user:', session.user.email)
                    setUser(session.user)
                }
            } catch (error) {
                console.error('Error refreshing auth on focus:', error)
            }
        }

        window.addEventListener('focus', handleFocus)

        return () => {
            subscription.unsubscribe()
            window.removeEventListener('focus', handleFocus)
        }
    }, [supabase, router, user])

    const signOut = useCallback(async () => {
        try {
            setLoading(true)
            await supabase.auth.signOut()
            router.replace('/login')
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, router])

    return {
        user,
        loading,
        signOut,
        isAuthenticated: !!user,
        supabase
    }
}
