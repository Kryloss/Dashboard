'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const hasProcessed = useRef(false)

    useEffect(() => {
        // Prevent duplicate processing
        if (hasProcessed.current) {
            return
        }

        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (!hasProcessed.current) {
                console.log('Auth callback timed out')
                setError('Authentication timed out')
                router.push('/login?message=Authentication timed out. Please try again.')
            }
        }, 15000) // 15 second timeout

        const handleAuthCallback = async () => {
            hasProcessed.current = true
            const supabase = createClient()

            try {
                console.log('Processing auth callback...')
                console.log('URL:', window.location.href)

                const urlSearchParams = new URLSearchParams(window.location.search)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                
                // Get parameters from both URL search and hash
                const code = urlSearchParams.get('code')
                const type = hashParams.get('type') || urlSearchParams.get('type')
                const error_param = urlSearchParams.get('error')
                const error_description = urlSearchParams.get('error_description')

                console.log('Callback parameters:', { code: code ? 'present' : 'missing', type, error_param })

                // Handle OAuth errors
                if (error_param) {
                    console.error('OAuth error:', error_param, error_description)
                    clearTimeout(timeoutId)
                    setError(`OAuth error: ${error_description || error_param}`)
                    setTimeout(() => router.push('/login?message=OAuth authentication failed'), 2000)
                    return
                }

                // For OAuth flows (Google, etc.) - exchange code for session
                if (code) {
                    console.log('Exchanging OAuth code for session...')
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
                    
                    if (error) {
                        console.error('Code exchange error:', error)
                        clearTimeout(timeoutId)
                        setError('Failed to exchange authorization code')
                        setTimeout(() => router.push('/login?message=Authentication failed during code exchange'), 2000)
                        return
                    }

                    if (data.session) {
                        console.log('OAuth session established for user:', data.session.user.email)
                        clearTimeout(timeoutId)
                        
                        // Continue with profile creation/verification below
                        const authData = data
                        const user = authData.session.user

                        // Check if profile exists and create if needed
                        await handleProfileCreation(supabase, user)
                        
                        // Redirect to dashboard for OAuth flows
                        router.push('/dashboard')
                        return
                    }
                }

                // For hash-based flows (password reset, email confirmation)
                if (window.location.hash && !code) {
                    console.log('Processing hash-based auth flow...')
                    // Wait a moment for Supabase to automatically process the tokens
                    await new Promise(resolve => setTimeout(resolve, 500))
                }

                // Check for existing session
                const { data: authData, error: authError } = await supabase.auth.getSession()

                if (authError) {
                    console.error('Auth callback error:', authError)
                    clearTimeout(timeoutId)
                    setError('Authentication failed')
                    setTimeout(() => router.push('/login?message=Authentication failed'), 2000)
                    return
                }

                if (authData.session) {
                    const user = authData.session.user
                    console.log('Session established for user:', user.email)
                    clearTimeout(timeoutId)

                    // Handle password recovery flow
                    if (type === 'recovery') {
                        console.log('Password recovery flow detected - redirecting to reset password page')
                        router.push('/auth/reset-password')
                        return
                    }

                    // Handle email confirmation
                    if (type === 'signup') {
                        console.log('Email confirmation flow detected')
                        router.push('/dashboard?message=Email confirmed! Welcome to Kryloss.')
                        return
                    }

                    // Default login flow - check if profile exists and create if needed
                    await handleProfileCreation(supabase, user)
                    
                    // Redirect to dashboard for regular sign-in flows
                    router.push('/dashboard')
                } else {
                    // No session found, redirect to login
                    console.log('No session found in callback')
                    clearTimeout(timeoutId)
                    setError('Unable to establish session')
                    setTimeout(() => router.push('/login?message=Authentication failed. Please try again.'), 3000)
                }
            } catch (err) {
                console.error('Callback handling error:', err)
                clearTimeout(timeoutId)
                setError('Something went wrong during authentication')
                setTimeout(() => router.push('/login?message=Authentication error occurred'), 2000)
            }
        }

        // Helper function for profile creation
        const handleProfileCreation = async (supabase: ReturnType<typeof createClient>, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
            try {
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (!existingProfile) {
                    console.log('Creating profile for new user:', user.email)
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: user.id,
                                email: user.email!,
                                username: null, // Will prompt user to set username
                                full_name: user.user_metadata?.full_name || null,
                            }
                        ])

                    if (profileError) {
                        console.error('Profile creation error:', profileError.message, profileError.code, profileError.details)
                        // Continue anyway, profile might already exist or the profile page will handle it
                    } else {
                        console.log('Profile created successfully for:', user.email)
                    }
                } else {
                    console.log('Profile already exists for:', user.email)
                }
            } catch (profileErr) {
                console.error('Profile handling error:', profileErr)
                // Continue with auth flow even if profile creation fails
            }
        }

        handleAuthCallback()

        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId)
    }, [router])

    if (error) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
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
