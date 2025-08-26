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
