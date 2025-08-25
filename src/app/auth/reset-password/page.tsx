'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

    useEffect(() => {
        const handlePasswordReset = async () => {
            const supabase = createClient()

            try {
                console.log('Handling password reset flow...')

                // Check for Supabase error parameters (fallback for old links)
                const urlError = searchParams.get('error')
                const errorCode = searchParams.get('error_code')
                const errorDescription = searchParams.get('error_description')

                if (urlError || errorCode) {
                    console.log('Supabase error detected (old flow):', { urlError, errorCode, errorDescription })

                    let errorMessage = 'Invalid or expired reset link.'

                    if (errorCode === 'otp_expired') {
                        errorMessage = 'This reset link has expired. Please request a new password reset.'
                    } else if (errorCode === 'invalid_token') {
                        errorMessage = 'This reset link is invalid or has already been used.'
                    } else if (urlError === 'access_denied') {
                        errorMessage = 'Access denied. This reset link may have expired or been used already.'
                    } else if (errorDescription) {
                        errorMessage = decodeURIComponent(errorDescription)
                    }

                    setIsValidSession(false)
                    setError(errorMessage)
                    return
                }

                // Get the code from URL parameters (direct flow)
                let code = searchParams.get('code')

                // Fallback: check URL hash for tokens (old flow)
                if (!code && typeof window !== 'undefined') {
                    const hashParams = new URLSearchParams(window.location.hash.substring(1))
                    code = hashParams.get('access_token') || hashParams.get('token_hash')
                }

                console.log('Reset code from URL:', code ? 'Present' : 'Missing')
                console.log('Full URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')

                if (!code) {
                    console.log('No code parameter found in URL search params or hash')
                    setIsValidSession(false)
                    setError('Invalid reset link. Missing verification code. Please request a new reset link.')
                    return
                }

                console.log('Processing reset code directly:', code.substring(0, 8) + '...')

                // Verify the OTP code for password recovery
                console.log('Verifying recovery code...')
                const { data, error } = await supabase.auth.verifyOtp({
                    token_hash: code,
                    type: 'recovery'
                })

                if (error) {
                    console.error('Recovery code verification error:', error)
                    setIsValidSession(false)

                    // Provide more specific error messages
                    let errorMessage = 'Invalid or expired reset link.'

                    if (error.message.includes('expired')) {
                        errorMessage = 'This reset link has expired. Please request a new password reset.'
                    } else if (error.message.includes('invalid')) {
                        errorMessage = 'This reset link is invalid or has already been used. Please request a new password reset.'
                    } else if (error.message.includes('not found')) {
                        errorMessage = 'This reset link was not found. It may have expired or been used already.'
                    } else {
                        errorMessage = `Reset link error: ${error.message}`
                    }

                    setError(errorMessage)
                    return
                }

                if (!data.session) {
                    console.log('No session established from recovery code')
                    setIsValidSession(false)
                    setError('Failed to establish session from reset link.')
                    return
                }

                console.log('Session successfully established for user:', data.session.user.email)
                setIsValidSession(true)

            } catch (err) {
                console.error('Password reset handling failed:', err)

                // As a fallback, check if there's already a session (e.g., from auth callback)
                try {
                    console.log('Checking for existing session as fallback...')
                    const { data: sessionData } = await supabase.auth.getSession()

                    if (sessionData.session) {
                        console.log('Found existing session, using it')
                        setIsValidSession(true)
                        return
                    }
                } catch (fallbackErr) {
                    console.error('Fallback session check failed:', fallbackErr)
                }

                setIsValidSession(false)
                setError('Failed to process reset link. This may be due to email client prefetching. Please request a new reset link.')
            }
        }

        handlePasswordReset()
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validate passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long')
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                setError(error.message)
                setLoading(false)
                return
            }

            // Success - redirect to login with success message
            router.push('/login?message=Password updated successfully! Please sign in with your new password.')
        } catch {
            setError('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    // Show loading state while checking session
    if (isValidSession === null) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                    <p className="text-[#9CA9B7] mt-4">Verifying reset link...</p>
                </div>
            </div>
        )
    }

    // Show error if session is invalid
    if (isValidSession === false) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6">
                <div className="relative z-10 w-full max-w-md">
                    <Card className="bg-[#121922] border-[#2A3442] shadow-[0_14px_40px_rgba(0,0,0,0.55)] rounded-2xl">
                        <CardHeader className="text-center pb-6">
                            <CardTitle className="text-2xl font-bold text-[#FBF7FA]">
                                Invalid Reset Link
                            </CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                This password reset link is invalid or has expired.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                                {error}
                            </div>

                            {/* Help information */}
                            <div className="p-3 rounded-lg bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] text-[#9CA9B7] text-xs">
                                <div className="text-[#4AA7FF] mb-2 font-medium">Why did this happen?</div>
                                <ul className="space-y-1 text-xs">
                                    <li>• The reset link may have expired (usually valid for 1 hour)</li>
                                    <li>• The link may have already been used</li>
                                    <li>• Your email client may have &quot;prefetched&quot; the link for security scanning</li>
                                    <li>• The link may have been modified by email tracking systems</li>
                                    <li>• The link was clicked too late after the email was sent</li>
                                </ul>

                                <div className="mt-3 p-2 bg-[rgba(0,0,0,0.20)] rounded text-xs">
                                    <div className="text-[#4AA7FF] font-medium mb-1">Technical Details:</div>
                                    <div className="text-[#556274]">
                                        {searchParams.get('error') || searchParams.get('error_code') ? (
                                            <>
                                                Supabase processed your reset link and found it expired/invalid.
                                                The error was: <code className="text-[#9CA9B7]">{searchParams.get('error_code') || 'unknown'}</code>
                                            </>
                                        ) : (
                                            <>
                                                This appears to be an old-style reset link that went through Supabase verification.
                                                New reset links will go directly to your site for better reliability.
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <Link
                                    href="/reset-password"
                                    className="text-[#257ADA] hover:text-[#4AA7FF] underline-offset-4 hover:underline"
                                >
                                    Request a new reset link
                                </Link>
                            </div>
                            <div className="text-center">
                                <Link
                                    href="/login"
                                    className="text-[#9CA9B7] hover:text-[#FBF7FA] text-sm"
                                >
                                    ← Back to sign in
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6">
            {/* Background gradient orb effect */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: "radial-gradient(circle at 50% 30%, rgba(74,167,255,0.35) 0%, rgba(17,78,178,0.20) 45%, rgba(15,9,45,0.0) 80%)"
                }}
            />

            <div className="relative z-10 w-full max-w-md">
                <Card className="bg-[#121922] border-[#2A3442] shadow-[0_14px_40px_rgba(0,0,0,0.55)] rounded-2xl">
                    {/* Accent edge glow */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                        style={{
                            background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                        }}
                    />

                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-2xl font-bold text-[#FBF7FA]">
                            Set New Password
                        </CardTitle>
                        <CardDescription className="text-[#9CA9B7]">
                            Enter your new password below
                        </CardDescription>

                        {/* Debug info - remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-2 p-2 bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] rounded text-xs">
                                <div className="text-[#4AA7FF] mb-1">Debug Info:</div>
                                <div className="text-[#9CA9B7] space-y-1">
                                    <div>Session Valid: {isValidSession === null ? 'Checking...' : isValidSession ? 'Yes' : 'No'}</div>
                                    <div>Reset Code: {searchParams.get('code') ? 'Present' : 'Missing'}</div>
                                    <div>Error: {searchParams.get('error') || 'None'}</div>
                                    <div>Error Code: {searchParams.get('error_code') || 'None'}</div>
                                    <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                                </div>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Error message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[#FBF7FA]">
                                    New Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your new password"
                                    className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={loading}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[#FBF7FA]">
                                    Confirm New Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your new password"
                                    className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={loading}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
                            >
                                {loading ? "Updating Password..." : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Back to login */}
                <div className="text-center mt-6">
                    <Link
                        href="/login"
                        className="text-[#9CA9B7] hover:text-[#FBF7FA] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#000000] rounded"
                    >
                        ← Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                    <p className="text-[#9CA9B7] mt-4">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
