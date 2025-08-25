'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'

interface UseAuthRedirectOptions {
    requireAuth?: boolean
    redirectTo?: string
    redirectIfAuthenticated?: boolean
    redirectToIfAuthenticated?: string
}

export function useAuthRedirect({
    requireAuth = false,
    redirectTo = '/login',
    redirectIfAuthenticated = false,
    redirectToIfAuthenticated = '/dashboard'
}: UseAuthRedirectOptions = {}) {
    const { user, profile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return // Don't redirect while loading

        if (requireAuth && !user) {
            // User must be authenticated but isn't
            router.push(redirectTo)
        } else if (redirectIfAuthenticated && user) {
            // User is authenticated but shouldn't be on this page
            router.push(redirectToIfAuthenticated)
        }
    }, [user, loading, requireAuth, redirectIfAuthenticated, redirectTo, redirectToIfAuthenticated, router])

    return { user, profile, loading }
}
