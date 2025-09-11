'use client'

import { useEffect, useRef } from 'react'
import { useAuthContext } from '@/lib/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

export function AuthStateMonitor() {
    const { user, loading } = useAuthContext()
    const router = useRouter()
    const pathname = usePathname()
    const lastUserRef = useRef(user)

    useEffect(() => {
        // Only monitor for significant auth state changes
        const protectedRoutes = ['/dashboard', '/profile']
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

        // Only redirect if we had a user before and now we don't (session lost)
        if (!loading && isProtectedRoute && !user && lastUserRef.current) {
            console.log('AuthStateMonitor: User session lost on protected route, redirecting to login')
            router.push('/login?message=Session expired, please sign in again')
        }

        // Update ref to track previous user state
        lastUserRef.current = user
    }, [user, loading, pathname, router])

    return null // This component doesn't render anything
}