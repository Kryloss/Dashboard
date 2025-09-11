'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCurrentSubdomain } from '@/lib/subdomains'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [processing, setProcessing] = useState(true)

    useEffect(() => {
        async function handleAuthCallback() {
            try {
                console.log('AuthCallback: Processing OAuth callback...')
                setProcessing(true)

                const supabase = createClient()

                // Get the current URL to check for OAuth errors
                const url = new URL(window.location.href)
                const searchParams = new URLSearchParams(url.search)
                const hashParams = new URLSearchParams(url.hash.substring(1))

                // Check for OAuth errors first
                const error_param = searchParams.get('error') || hashParams.get('error')
                const error_description = searchParams.get('error_description') || hashParams.get('error_description')

                if (error_param) {
                    console.error('AuthCallback: OAuth error:', error_param, error_description)
                    setError(error_description || 'OAuth authentication failed')
                    setTimeout(() => router.push('/login?message=Authentication failed'), 2000)
                    return
                }

                // Handle different callback types
                const type = searchParams.get('type')
                
                if (type === 'recovery') {
                    console.log('AuthCallback: Password recovery flow')
                    router.push('/auth/reset-password')
                    return
                }

                if (type === 'signup') {
                    console.log('AuthCallback: Email confirmation flow')
                    const redirectTarget = getRedirectTarget()
                    router.push(`${redirectTarget}?message=Email confirmed! Welcome to Kryloss.`)
                    return
                }

                // For OAuth and default flows, let Supabase handle the session
                console.log('AuthCallback: Checking session...')
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    console.error('AuthCallback: Session error:', sessionError)
                    setError('Failed to establish session')
                    setTimeout(() => router.push('/login?message=Authentication failed'), 2000)
                    return
                }

                if (session?.user) {
                    console.log('AuthCallback: Session established for:', session.user.email)
                    
                    // Redirect to appropriate page
                    const redirectTarget = getRedirectTarget()
                    console.log('AuthCallback: Redirecting to:', redirectTarget)
                    router.push(redirectTarget)
                } else {
                    console.log('AuthCallback: No session found')
                    setError('Unable to establish session')
                    setTimeout(() => router.push('/login?message=Authentication failed'), 2000)
                }

            } catch (err) {
                console.error('AuthCallback: Unexpected error:', err)
                setError('Something went wrong during authentication')
                setTimeout(() => router.push('/login?message=Authentication failed'), 2000)
            } finally {
                setProcessing(false)
            }
        }

        // Helper function to determine redirect target
        function getRedirectTarget() {
            const subdomain = getCurrentSubdomain()
            if (subdomain === 'healss') {
                return '/workout'
            }
            return '/dashboard'
        }

        handleAuthCallback()
    }, [router])

    if (error) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="mb-6">
                        <div className="inline-block w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-[#FBF7FA] mb-2">Authentication Error</h2>
                        <p className="text-red-400 text-sm leading-relaxed">{error}</p>
                    </div>
                    <p className="text-[#9CA9B7] text-sm">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                <p className="text-[#9CA9B7] mt-4">
                    {processing ? 'Completing sign in...' : 'Redirecting...'}
                </p>
            </div>
        </div>
    )
}
