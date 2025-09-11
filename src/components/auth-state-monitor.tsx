'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

export function AuthStateMonitor() {
    const { user, loading } = useAuthContext()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Monitor auth state changes on protected routes
        const protectedRoutes = ['/dashboard', '/profile']
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

        if (!loading && isProtectedRoute && !user) {
            console.log('AuthStateMonitor: User lost auth on protected route, redirecting to login')
            router.push('/login?message=Session expired, please sign in again')
        }
    }, [user, loading, pathname, router])

    // Add a listener for storage events to detect sign-outs in other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // If auth token was removed from storage, refresh the page
            if (e.key?.startsWith('supabase.auth.') && e.newValue === null) {
                console.log('AuthStateMonitor: Auth token removed in another tab, refreshing')
                window.location.reload()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return null // This component doesn't render anything
}