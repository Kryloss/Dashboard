'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import type { User, SupabaseClient } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
    isAuthenticated: boolean
    supabase: SupabaseClient
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const auth = useAuth()

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider')
    }
    return context
}
