"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function HealssNav() {
    const pathname = usePathname()

    const navItems = [
        { href: "/", label: "Home", current: pathname === "/" },
        { href: "/healss/progress", label: "Progress", current: pathname === "/healss/progress" },
        { href: "/healss/nutrition", label: "Nutrition", current: pathname === "/healss/nutrition" },
    ]

    return (
        <nav className="bg-[#1A1D21] border-b border-[#2A3442] sticky top-0 z-50">
            <div className="container mx-auto max-w-7xl px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
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

                    {/* CTA Button */}
                    <div className="flex items-center space-x-4">
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] text-white hover:from-[#3B82F6] hover:to-[#7C3AED] transition-all"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    )
}