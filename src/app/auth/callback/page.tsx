'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const { user, profile } = useAuth()

    useEffect(() => {
        const handleAuthCallback = async () => {
            const supabase = createClient()

            try {
                // First, let Supabase process any auth tokens from the URL hash
                console.log('Processing auth callback...')

                // Get the URL hash which contains the auth tokens for password reset
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const urlSearchParams = new URLSearchParams(window.location.search)
                const type = hashParams.get('type') || urlSearchParams.get('type')

                console.log('Auth callback type:', type)
                console.log('URL hash:', window.location.hash)
                console.log('URL search:', window.location.search)

                // Wait a moment for Supabase to process the tokens
                await new Promise(resolve => setTimeout(resolve, 100))

                // Now check for the session
                const { data: authData, error: authError } = await supabase.auth.getSession()

                if (authError) {
                    console.error('Auth callback error:', authError)
                    setError('Authentication failed')
                    setTimeout(() => router.push('/login?message=Authentication failed'), 2000)
                    return
                }

                if (authData.session) {
                    const user = authData.session.user
                    console.log('Session established for user:', user.email)

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

                    // Default OAuth/login flow - check if profile exists
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (!existingProfile) {
                        // Create profile for OAuth users (Google, etc.)
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
                        }
                    }

                    // Redirect to dashboard for regular sign-in flows
                    router.push('/dashboard')
                } else {
                    // No session found, redirect to login
                    console.log('No session found in callback')
                    setError('Unable to establish session from the link')
                    setTimeout(() => router.push('/login?message=Please try requesting a new reset link'), 3000)
                }
            } catch (err) {
                console.error('Callback handling error:', err)
                setError('Something went wrong during authentication')
                setTimeout(() => router.push('/login?message=Authentication error occurred'), 2000)
            }
        }

        handleAuthCallback()
    }, [router])

    // If we already have a user from the auth context, redirect appropriately
    useEffect(() => {
        if (user) {
            if (profile && !profile.username) {
                // User needs to set username
                router.push('/profile?message=Please set your username to complete your profile')
            } else {
                // User is fully set up
                router.push('/dashboard')
            }
        }
    }, [user, profile, router])

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
