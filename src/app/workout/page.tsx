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
            <div className="min-h-screen bg-[#0B0C0D] text-[#FBF7FA]">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <p className="text-2xl text-[#9CA9B7]">In development</p>
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
