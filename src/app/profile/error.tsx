'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfileError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Profile page error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center p-6">
            <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl max-w-md w-full">
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                    style={{
                        background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                    }}
                />

                <CardHeader className="text-center">
                    <CardTitle className="text-[#FBF7FA] text-xl font-bold">
                        Something went wrong
                    </CardTitle>
                    <CardDescription className="text-[#9CA9B7]">
                        We couldn&apos;t load your profile. This might be a temporary issue.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                        {error.message || 'An unexpected error occurred'}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => reset()}
                            className="flex-1 rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all"
                        >
                            Try Again
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1 rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] transition-all"
                        >
                            <a href="/dashboard">Back to Dashboard</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
