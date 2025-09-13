"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signIn } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/client"
import { AuthHealthCheck } from "@/components/database-health-check"
import { useState, useTransition, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getCurrentSubdomain } from "@/lib/subdomains"

function LoginForm() {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    const handleSubmit = async (formData: FormData) => {
        setError(null)

        startTransition(async () => {
            const result = await signIn(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.success && result?.redirectTo) {
                // Client-side redirect with delay to ensure cookies are set
                setTimeout(() => {
                    window.location.href = result.redirectTo
                }, 500)
            }
        })
    }

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true)
        setError(null)

        try {
            // Check if environment variables are set
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            if (!supabaseUrl || !supabaseAnonKey) {
                setError('Configuration error: Missing Supabase credentials. Please check your environment variables.')
                setIsGoogleLoading(false)
                return
            }

            const supabase = createClient()

            // Determine the correct redirect URL based on environment
            let redirectUrl: string

            if (typeof window !== 'undefined') {
                // We're in the browser
                const currentOrigin = window.location.origin
                const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')

                if (isLocalhost) {
                    // Always use localhost for local development - use current origin to get correct port
                    redirectUrl = currentOrigin
                    console.log('Local development detected, using:', currentOrigin)
                } else {
                    // Production environment - ensure we use the configured site URL
                    redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || currentOrigin
                    console.log('Production environment detected, using:', redirectUrl)
                }
            } else {
                // Fallback for SSR
                redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
            }

            const callbackUrl = `${redirectUrl}/auth/callback`
            console.log('OAuth redirect URL:', callbackUrl)

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: callbackUrl,
                    scopes: 'openid email profile',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                        include_granted_scopes: 'true'
                    }
                },
            })

            if (error) {
                console.error('OAuth initiation error:', error)
                setError(`OAuth error: ${error.message}`)
                setIsGoogleLoading(false)
                return
            }

            if (data?.url) {
                console.log('Redirecting to:', data.url)
                window.location.href = data.url
                return
            }

            // Fallback if no URL returned
            setError('Failed to initiate Google sign-in - no redirect URL')
            setIsGoogleLoading(false)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to sign in with Google'
            console.error(message)
            setError(message)
            setIsGoogleLoading(false)
        }
    }

    // Get the appropriate signup link based on current subdomain
    const getSignupLink = () => {
        const subdomain = getCurrentSubdomain()
        if (subdomain === 'healss') {
            return '/signup'
        }
        return '/signup'
    }

    return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6">
            {/* Background gradient orb effect */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: "radial-gradient(circle at 30% 70%, rgba(74,167,255,0.35) 0%, rgba(17,78,178,0.20) 45%, rgba(15,9,45,0.0) 80%)"
                }}
            />

            <div className="relative z-10 w-full max-w-md space-y-6">
                {/* Health Check Component */}
                <AuthHealthCheck />

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
                            Welcome back
                        </CardTitle>
                        <CardDescription className="text-[#9CA9B7]">
                            Sign in to your Kryloss account to access your dashboard
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Success message */}
                        {message && (
                            <div className="p-3 rounded-lg bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] text-[#4AA7FF] text-sm">
                                {message}
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#FBF7FA]">
                                    Email or Username
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="text"
                                    placeholder="Enter your email or username"
                                    className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={isPending}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-[#FBF7FA]">
                                        Password
                                    </Label>
                                    <Link
                                        href="/reset-password"
                                        className="text-sm text-[#257ADA] hover:text-[#4AA7FF] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={isPending}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
                            >
                                {isPending ? "Signing In..." : "Sign In"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading || isPending}
                            variant="outline"
                            className="w-full rounded-full bg-white text-[#0B0C0D] border-0 shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:bg-[#F2F4F7] hover:shadow-[0_10px_26px_rgba(0,0,0,0.30)] active:bg-[#E6E9EF] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
                        </Button>

                        <div className="text-center text-sm text-[#9CA9B7]">
                            Don&apos;t have an account?{" "}
                            <Link
                                href={getSignupLink()}
                                className="text-[#257ADA] hover:text-[#4AA7FF] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                            >
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </Card>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-[#9CA9B7] hover:text-[#FBF7FA] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#000000] rounded"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}
