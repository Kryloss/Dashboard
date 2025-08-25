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
import { resetPassword } from "@/lib/actions/auth"
import { useState, useTransition } from "react"

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (formData: FormData) => {
        setError(null)
        setMessage(null)

        startTransition(async () => {
            const result = await resetPassword(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.message) {
                setMessage(result.message)
            }
        })
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
                            Reset your password
                        </CardTitle>
                        <CardDescription className="text-[#9CA9B7]">
                            Enter your email address and we&apos;ll send you a link to reset your password
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
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={isPending}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending || !!message}
                                className="w-full rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
                            >
                                {isPending ? "Sending..." : message ? "Email Sent" : "Send Reset Link"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">

                        <div className="text-center text-sm text-[#9CA9B7]">
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="text-[#257ADA] hover:text-[#4AA7FF] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                            >
                                Sign in
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
