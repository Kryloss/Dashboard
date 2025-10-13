"use client"

import { useEffect, useState } from "react"
import { isOnSubdomain } from "@/lib/subdomains"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { CornerNavigationArrows } from "@/components/corner-navigation-arrows"

export default function ProgressPage() {
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)
    const [isNavHidden, setIsNavHidden] = useState(false)
    const [lastScrollY, setLastScrollY] = useState(0)

    useEffect(() => {
        // Check if we're on the healss subdomain
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)
    }, [])

    // Handle scroll behavior for nav visibility
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            if (currentScrollY < 10) {
                setIsNavHidden(false)
            } else if (currentScrollY > lastScrollY) {
                // Scrolling down - nav is hidden
                setIsNavHidden(true)
            } else {
                // Scrolling up - nav is visible
                setIsNavHidden(false)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    // If we're on healss.kryloss.com, show healss content
    if (isHealssSubdomain) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] text-[#FBF7FA] pt-16">
                <div className="container mx-auto px-4 md:px-6 py-8 pb-20 md:pb-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <p className="text-2xl text-[#9CA9B7]">In development</p>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav />

                {/* Corner Navigation Arrows */}
                <CornerNavigationArrows isVisible={isNavHidden} />
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
