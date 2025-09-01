"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function HealssNav() {
    const pathname = usePathname()

    const navItems = [
        { href: "https://healss.kryloss.com/workout", label: "Workout", current: pathname === "/workout" },
        { href: "https://healss.kryloss.com/nutrition", label: "Nutrition", current: pathname === "/nutrition" },
        { href: "https://healss.kryloss.com/progress", label: "Progress", current: pathname === "/progress" },
    ]

    return (
        <nav className="bg-[#1A1D21] border-b border-[#2A3442] sticky top-0 z-50">
            <div className="container mx-auto max-w-7xl px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/workout" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">H</span>
                            </div>
                            <span className="text-xl font-bold text-[#FBF7FA]">Healss</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm font-medium transition-colors ${item.current
                                    ? "text-[#4AA7FF]"
                                    : "text-[#9CA9B7] hover:text-[#FBF7FA]"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            asChild
                            className="rounded-full border-[#2A3442] text-[#FBF7FA] hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-[#93C5FD]"
                        >
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button
                            asChild
                            className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#0B0C0D] active:brightness-95 transition-all"
                        >
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    )
}