"use client"

import { useEffect, useState } from "react"
import { isOnSubdomain } from "@/lib/subdomains"
import { HealssNav } from "@/app/healss/components/healss-nav"

export default function ProgressPage() {
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
                <HealssNav />
                <div className="container mx-auto max-w-7xl px-6 py-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-6 tracking-tight">
                            Progress Tracking
                        </h1>
                        <p className="text-xl text-[#9CA9B7] max-w-3xl mx-auto">
                            Monitor your fitness journey with detailed analytics and insights. Track your workouts, measurements, and achievements over time.
                        </p>
                    </div>

                    {/* Progress Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#FBF7FA]">Current Weight</h3>
                                <span className="text-2xl text-[#4AA7FF]">75.2 kg</span>
                            </div>
                            <div className="text-sm text-[#9CA9B7]">Down 2.1 kg this month</div>
                        </div>

                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#FBF7FA]">Workouts This Week</h3>
                                <span className="text-2xl text-[#4AA7FF]">4</span>
                            </div>
                            <div className="text-sm text-[#9CA9B7]">Goal: 5 workouts</div>
                        </div>

                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#FBF7FA]">Calories Burned</h3>
                                <span className="text-2xl text-[#4AA7FF]">2,450</span>
                            </div>
                            <div className="text-sm text-[#9CA9B7]">This week</div>
                        </div>
                    </div>

                    {/* Progress Chart Placeholder */}
                    <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-2">Progress Charts</h3>
                        <p className="text-[#9CA9B7]">Visual progress tracking and analytics coming soon!</p>
                    </div>
                </div>
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
