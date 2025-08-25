'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
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
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

    useEffect(() => {
        const verifySession = async () => {
            const supabase = createClient()

            // Check if there's a valid session from the reset link
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error || !session) {
                setIsValidSession(false)
                setError('Invalid or expired reset link. Please request a new one.')
                return
            }

            setIsValidSession(true)
        }

        verifySession()
    }, [])

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
