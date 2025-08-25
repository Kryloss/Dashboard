'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface Profile {
    id: string
    email: string
    username: string | null
    full_name: string | null
    updated_at: string
}

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    // Fetch profile data - memoized with useCallback
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                return null
            }

            return data
        } catch (error) {
            console.error('Error fetching profile:', error)
            return null
        }
    }, [supabase])

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (user) {
            const updatedProfile = await fetchProfile(user.id)
            setProfile(updatedProfile)
        }
    }, [user, fetchProfile])

    // Update profile optimistically
    const updateProfile = useCallback(async (updates: Partial<Profile>) => {
        if (profile) {
            setProfile({ ...profile, ...updates })
        }
    }, [profile])

    // Sign out function
    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)
            setSession(null)
            router.push('/')
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }, [supabase.auth, router])

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    const userProfile = await fetchProfile(session.user.id)
                    setProfile(userProfile)
                }
            } catch (error) {
                console.error('Error getting initial session:', error)
            } finally {
                setLoading(false)
            }
        }

        getInitialSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email)

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    const userProfile = await fetchProfile(session.user.id)
                    setProfile(userProfile)
                } else {
                    setProfile(null)
                }

                setLoading(false)

                // Handle specific auth events
                if (event === 'SIGNED_IN') {
                    // Refresh the current page to update server-side data
                    router.refresh()
                } else if (event === 'SIGNED_OUT') {
                    // Clear any cached data
                    setProfile(null)
                    setUser(null)
                    setSession(null)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [router, supabase.auth, fetchProfile])

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        signOut,
        refreshProfile,
        updateProfile,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
