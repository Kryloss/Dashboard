import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession()
                setSession(initialSession)
                setUser(initialSession?.user ?? null)
            } catch (error) {
                console.error('Error getting initial session:', error)
            } finally {
                setLoading(false)
            }
        }

        getInitialSession()

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
                        break
                    case 'SIGNED_OUT':
                        console.log('User signed out')
                        break
                    case 'TOKEN_REFRESHED':
                        console.log('Token refreshed')
                        break
                    case 'USER_UPDATED':
                        console.log('User updated:', currentSession?.user?.email)
                        break
                    case 'USER_DELETED':
                        console.log('User deleted')
                        break
                    case 'MFA_CHALLENGE_VERIFIED':
                        console.log('MFA challenge verified')
                        break
                    case 'PASSWORD_RECOVERY':
                        console.log('Password recovery initiated')
                        break
                    case 'MFA_FACTOR_CREATED':
                        console.log('MFA factor created')
                        break
                    case 'MFA_FACTOR_DELETED':
                        console.log('MFA factor deleted')
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
            await supabase.auth.signOut()
        } catch (error) {
            console.error('Error signing out:', error)
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
