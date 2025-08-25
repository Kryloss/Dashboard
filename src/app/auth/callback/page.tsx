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
                console.log('Auth callback timed out - redirecting to homepage')
                hasProcessed.current = true
                setError('Authentication timed out')
                // Redirect to homepage instead of login to avoid loops
                router.push('/?message=Authentication completed but took longer than expected')
            }
        }, 10000) // 10 second timeout (reduced for faster fallback)

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
                    try {
                        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
                        
                        if (error) {
                            console.error('Code exchange error:', error)
                            clearTimeout(timeoutId)
                            setError('Failed to exchange authorization code')
                            setTimeout(() => router.push('/login?message=Authentication failed during code exchange'), 2000)
                            return
                        }

                        if (data?.session?.user) {
                            console.log('OAuth session established for user:', data.session.user.email || 'unknown')
                            clearTimeout(timeoutId)
                            
                            // Continue with profile creation/verification below
                            const user = data.session.user

                            // Check if profile exists and create if needed
                            try {
                                await handleProfileCreation(supabase, user)
                            } catch (profileError) {
                                console.error('Profile creation failed, continuing with redirect:', profileError)
                                // Continue even if profile creation fails
                            }
                            
                            // Redirect to homepage for OAuth flows
                            router.push('/')
                            return
                        } else {
                            console.error('No session or user found after code exchange')
                            clearTimeout(timeoutId)
                            setError('Failed to establish session after code exchange')
                            setTimeout(() => router.push('/login?message=Session establishment failed'), 2000)
                            return
                        }
                    } catch (codeExchangeError) {
                        console.error('Code exchange failed with exception:', codeExchangeError)
                        clearTimeout(timeoutId)
                        setError('Code exchange failed')
                        setTimeout(() => router.push('/login?message=Authentication process failed'), 2000)
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

                if (authData?.session?.user) {
                    const user = authData.session.user
                    console.log('Session established for user:', user.email || 'unknown')
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
                        router.push('/?message=Email confirmed! Welcome to Kryloss.')
                        return
                    }

                    // Default login flow - check if profile exists and create if needed
                    try {
                        await handleProfileCreation(supabase, user)
                    } catch (profileError) {
                        console.error('Profile handling failed, continuing with redirect:', profileError)
                        // Continue even if profile handling fails
                    }
                    
                    // Redirect to homepage for regular sign-in flows
                    router.push('/')
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
                // Redirect to homepage instead of login to avoid loops
                setTimeout(() => router.push('/?message=Authentication completed with some issues'), 2000)
            } finally {
                // Ensure we always mark as processed
                hasProcessed.current = true
            }
        }

        // Helper function for profile creation
        const handleProfileCreation = async (supabase: ReturnType<typeof createClient>, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
            if (!user?.id) {
                console.error('Cannot create profile: user ID is missing')
                return
            }

            try {
                // Check if profile exists
                const { data: existingProfile, error: selectError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (selectError && selectError.code !== 'PGRST116') {
                    // PGRST116 is "not found" error, which is expected for new users
                    console.error('Error checking existing profile:', selectError)
                    throw selectError
                }

                if (!existingProfile) {
                    console.log('Creating profile for new user:', user.email || 'unknown email')
                    
                    const profileData = {
                        id: user.id,
                        email: user.email || null,
                        username: null, // Will prompt user to set username
                        full_name: (user.user_metadata?.full_name as string) || null,
                    }

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([profileData])

                    if (profileError) {
                        console.error('Profile creation error:', {
                            message: profileError.message,
                            code: profileError.code,
                            details: profileError.details
                        })
                        
                        // Don't throw here - continue with auth flow
                        // The profile page can handle missing profiles
                        console.log('Continuing with auth flow despite profile creation failure')
                    } else {
                        console.log('Profile created successfully for:', user.email || user.id)
                    }
                } else {
                    console.log('Profile already exists for:', user.email || user.id)
                }
            } catch (profileErr) {
                console.error('Profile handling error:', profileErr)
                // Don't re-throw - continue with auth flow even if profile creation fails
                console.log('Continuing with auth flow despite profile handling error')
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
