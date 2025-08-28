"use client"

import { useEffect, useState } from 'react'
import { NavBar } from './nav-bar'
import { Footer } from './footer'
import { shouldUseSubdomainLayout, getCurrentSubdomain } from '@/lib/subdomains'

interface SubdomainLayoutProps {
    children: React.ReactNode
}

export function SubdomainLayout({ children }: SubdomainLayoutProps) {
    const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null)
    const [currentSubdomain, setCurrentSubdomain] = useState<string | null>(null)

    useEffect(() => {
        // Check if we're on a subdomain
        const shouldUseSubdomain = shouldUseSubdomainLayout()
        const subdomain = getCurrentSubdomain()

        setIsSubdomain(shouldUseSubdomain)
        setCurrentSubdomain(subdomain)
    }, [])

    // Show loading state while determining layout
    if (isSubdomain === null) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#4AA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#9CA9B7]">Loading...</p>
                </div>
            </div>
        )
    }

    // For subdomains, show minimal layout to avoid duplicate navigation
    // The auth context will be shared from the main layout
    if (isSubdomain && currentSubdomain === 'healss') {
        return (
            <main className="min-h-screen bg-[#0B0C0D]">{children}</main>
        )
    }

    // Always show main navigation and footer for consistent authentication experience
    // This ensures users stay signed in across both kryloss.com and healss.kryloss.com
    return (
        <>
            <NavBar />
            <main className="min-h-screen bg-[#0B0C0D]">{children}</main>
            <Footer />
        </>
    )
}
