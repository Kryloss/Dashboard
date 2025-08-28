"use client"

import { useEffect, useState } from 'react'
import { NavBar } from './nav-bar'
import { Footer } from './footer'
import { shouldUseSubdomainLayout } from '@/lib/subdomains'

interface SubdomainLayoutProps {
    children: React.ReactNode
}

export function SubdomainLayout({ children }: SubdomainLayoutProps) {
    const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null)

    useEffect(() => {
        // Check if we're on a subdomain
        const shouldUseSubdomain = shouldUseSubdomainLayout()
        setIsSubdomain(shouldUseSubdomain)
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

    // If we're on a subdomain, render without main nav/footer
    // The subdomain will have its own layout
    if (isSubdomain) {
        return <>{children}</>
    }

    // If we're on the main domain, render with main nav/footer
    return (
        <>
            <NavBar />
            <main>{children}</main>
            <Footer />
        </>
    )
}
