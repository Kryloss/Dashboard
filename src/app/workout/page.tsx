"use client"

import { useEffect, useState } from "react"
import { isOnSubdomain } from "@/lib/subdomains"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function WorkoutPage() {
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)

    useEffect(() => {
        // Check if we're on the healss subdomain
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)
    }, [])

    // If we're on healss.kryloss.com, show healss content
    if (isHealssSubdomain) {
        return (
            <div className="min-h-screen bg-[#0B0C0D]">
                {/* Healss-specific Hero */}
                <section className="py-20 px-6">
                    <div className="container mx-auto max-w-7xl text-center">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-[#FBF7FA] mb-6 tracking-tight">
                            Welcome to Healss
                        </h1>
                        <p className="text-xl text-[#9CA9B7] max-w-3xl mx-auto mb-8">
                            Your comprehensive health and fitness tracking platform. Monitor progress, track nutrition, and achieve your wellness goals.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                className="rounded-full bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] text-white hover:from-[#3B82F6] hover:to-[#7C3AED] transition-all px-8 py-3"
                                asChild
                            >
                                <Link href="/progress">Track Progress</Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] transition-all px-8 py-3"
                                asChild
                            >
                                <Link href="/nutrition">Nutrition Tracker</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Healss Features */}
                <section className="py-16 px-6">
                    <div className="container mx-auto max-w-7xl">
                        <h2 className="text-4xl font-bold text-[#FBF7FA] text-center mb-12">
                            Health & Fitness Features
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center p-6 rounded-lg bg-[#1A1D21] border border-[#2A3442]">
                                <div className="w-16 h-16 bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <h3 className="text-xl font-semibold text-[#FBF7FA] mb-2">Progress Tracking</h3>
                                <p className="text-[#9CA9B7]">Monitor your fitness journey with detailed analytics and insights.</p>
                            </div>
                            <div className="text-center p-6 rounded-lg bg-[#1A1D21] border border-[#2A3442]">
                                <div className="w-16 h-16 bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">🥗</span>
                                </div>
                                <h3 className="text-xl font-semibold text-[#FBF7FA] mb-2">Nutrition Management</h3>
                                <p className="text-[#9CA9B7]">Track your daily nutrition and maintain a balanced diet.</p>
                            </div>
                            <div className="text-center p-6 rounded-lg bg-[#1A1D21] border border-[#2A3442]">
                                <div className="w-16 h-16 bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <h3 className="text-xl font-semibold text-[#FBF7FA] mb-2">Goal Setting</h3>
                                <p className="text-[#9CA9B7]">Set and achieve your health and fitness goals with smart tracking.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    // If not on healss subdomain, redirect to main site or show error
    return (
        <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-[#FBF7FA] mb-4">Page Not Found</h1>
                <p className="text-[#9CA9B7]">This page is only available on the healss subdomain.</p>
            </div>
        </div>
    )
}
