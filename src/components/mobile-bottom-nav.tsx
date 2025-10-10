"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, Apple, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            href: "/workout",
            label: "Workout",
            icon: Dumbbell,
            active: pathname.startsWith("/workout"),
        },
        {
            href: "/nutrition",
            label: "Nutrition",
            icon: Apple,
            active: pathname.startsWith("/nutrition"),
        },
        {
            href: "/progress",
            label: "Progress",
            icon: TrendingUp,
            active: pathname.startsWith("/progress"),
        },
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F101A] border-t border-[#2A3442] safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[72px] min-h-[56px]",
                                item.active
                                    ? "bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_20px_rgba(37,122,218,0.35)]"
                                    : "text-[#9CA9B7] active:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", item.active && "animate-in zoom-in-50 duration-200")} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
