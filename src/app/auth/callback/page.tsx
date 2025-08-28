'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCurrentSubdomain } from '@/lib/subdomains'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const hasProcessed = useRef(false)

    useEffect(() => {
        // Prevent duplicate processing
        if (hasProcessed.current) {
            return
        }

        // Set aggressive timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (!hasProcessed.current) {
                console.log('Auth callback timed out after 2 seconds - redirecting to homepage')
                hasProcessed.current = true
                // Ensure we redirect to the correct subdomain
                const redirectTarget = getRedirectTarget()
                router.push(redirectTarget)
            }
        }, 2000)

        const getRedirectTarget = () => {
            const subdomain = getCurrentSubdomain()
            if (subdomain === 'healss') {
                return '/workout'
            }
            // For main domain or other subdomains
            return '/'
        }

        const handleAuthCallback = async () => {
            hasProcessed.current = true

            // Check if environment variables are set
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            if (!supabaseUrl || !supabaseAnonKey) {
                console.error('Missing Supabase environment variables')
                clearTimeout(timeoutId)
                setError('Configuration error: Missing Supabase credentials. Please check your environment variables.')
                setTimeout(() => router.push('/login?message=Configuration error: Please contact support.'), 3000)
                return
            }

            const supabase = createClient()

            try {
                console.log('Processing auth callback...')
                console.log('URL:', window.location.href)

                // Get the current URL and extract the hash fragment
                const url = new URL(window.location.href)
                const hashParams = new URLSearchParams(url.hash.substring(1))
                const searchParams = new URLSearchParams(url.search)

                // Check for OAuth errors first
                const error_param = searchParams.get('error') || hashParams.get('error')
                const error_description = searchParams.get('error_description') || hashParams.get('error_description')

                if (error_param) {
                    console.error('OAuth error:', error_param, error_description)
                    clearTimeout(timeoutId)

                    // Provide more specific error messages
                    let userFriendlyError = 'OAuth authentication failed'
                    if (error_param === 'access_denied') {
                        userFriendlyError = 'Access denied - please try signing in again'
                    } else if (error_param === 'invalid_request') {
                        userFriendlyError = 'Invalid request - please try again'
                    } else if (error_description) {
                        userFriendlyError = error_description
                    }

                    setError(`OAuth error: ${userFriendlyError}`)
                    setTimeout(() => router.push(`/login?message=${encodeURIComponent(userFriendlyError)}`), 1000)
                    return
                }

                // For OAuth flows, we need to handle the hash fragment
                if (url.hash) {
                    console.log('Processing OAuth hash fragment...')

                    try {
                        // Let Supabase handle the OAuth callback automatically
                        const { data, error } = await supabase.auth.getSession()

                        if (error) {
                            console.error('Session retrieval error:', error)
                            clearTimeout(timeoutId)
                            setError(`Session error: ${error.message}`)
                            setTimeout(() => router.push('/login?message=Authentication failed'), 1000)
                            return
                        }

                        if (data?.session?.user) {
                            console.log('OAuth session established for user:', data.session.user.email || 'unknown')
                            clearTimeout(timeoutId)

                            // Profile creation is now handled automatically by database trigger
                            // No need for manual profile creation here

                            // Redirect to correct subdomain
                            const redirectTarget = getRedirectTarget()
                            console.log('Redirecting to:', redirectTarget)
                            setTimeout(() => router.push(redirectTarget), 500)
                            return
                        } else {
                            console.log('No session found after OAuth callback')
                            // Wait a bit more for the session to be established
                            await new Promise(resolve => setTimeout(resolve, 1000))

                            // Try again
                            const { data: retryData, error: retryError } = await supabase.auth.getSession()

                            if (retryError || !retryData?.session?.user) {
                                console.error('Still no session after retry')
                                clearTimeout(timeoutId)
                                setError('Failed to establish session after OAuth callback')
                                setTimeout(() => router.push('/login?message=Authentication failed'), 1000)
                                return
                            }

                            // Profile creation is now handled automatically by database trigger
                            // No need for manual profile creation here

                            // Redirect to correct subdomain
                            clearTimeout(timeoutId)
                            const redirectTarget = getRedirectTarget()
                            setTimeout(() => router.push(redirectTarget), 500)
                            return
                        }
                    } catch (oauthError) {
                        console.error('OAuth processing error:', oauthError)
                        clearTimeout(timeoutId)
                        setError('OAuth processing failed')
                        setTimeout(() => router.push('/login?message=Authentication failed'), 1000)
                        return
                    }
                }

                // For other flows (password reset, email confirmation)
                const type = searchParams.get('type')

                if (type === 'recovery') {
                    console.log('Password recovery flow detected')
                    clearTimeout(timeoutId)
                    setTimeout(() => router.push('/auth/reset-password'), 500)
                    return
                }

                if (type === 'signup') {
                    console.log('Email confirmation flow detected')
                    clearTimeout(timeoutId)
                    const redirectTarget = getRedirectTarget()
                    setTimeout(() => router.push(`${redirectTarget}?message=Email confirmed! Welcome to Kryloss.`), 500)
                    return
                }

                // Default: check for existing session and redirect
                const { data: authData, error: authError } = await supabase.auth.getSession()

                if (authError) {
                    console.error('Auth session check error:', authError)
                    clearTimeout(timeoutId)
                    setError('Authentication check failed')
                    setTimeout(() => router.push('/login?message=Authentication failed'), 1000)
                    return
                }

                if (authData?.session?.user) {
                    const user = authData.session.user
                    console.log('Session found for user:', user.email || 'unknown')
                    clearTimeout(timeoutId)

                    // Profile creation is now handled automatically by database trigger
                    // No need for manual profile creation here

                    // Redirect to correct subdomain
                    const redirectTarget = getRedirectTarget()
                    console.log('Redirecting to:', redirectTarget)
                    setTimeout(() => router.push(redirectTarget), 500)
                } else {
                    // No session found, redirect to login
                    console.log('No session found in callback')
                    clearTimeout(timeoutId)
                    setError('Unable to establish session')
                    setTimeout(() => router.push('/login?message=Authentication failed. Please try again.'), 1000)
                }
            } catch (err) {
                console.error('Callback handling error:', err)
                clearTimeout(timeoutId)
                setError('Something went wrong during authentication')
                setTimeout(() => router.push('/login?message=Authentication failed'), 1000)
            }
        }

        handleAuthCallback()

        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId)
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

                    {error.includes('Configuration error') && (
                        <div className="mb-6 p-4 bg-[#1E293B] border border-[#334155] rounded-lg">
                            <h3 className="text-[#FBF7FA] font-medium mb-2">How to Fix This:</h3>
                            <ol className="text-[#9CA9B7] text-sm space-y-1 list-decimal list-inside">
                                <li>Create a <code className="bg-[#0F172A] px-1 rounded">.env.local</code> file in your project root</li>
                                <li>Add your Supabase credentials from the <code className="bg-[#0F172A] px-1 rounded">env.example</code> file</li>
                                <li>Restart your development server</li>
                            </ol>
                        </div>
                    )}

                    <p className="text-[#9CA9B7] text-sm">Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                <p className="text-[#9CA9B7] mt-4">Completing sign in...</p>
            </div>
        </div>
    )
}
