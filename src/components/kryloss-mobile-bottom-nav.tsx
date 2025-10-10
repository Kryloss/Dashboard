"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Heart, Bell, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export function KrylossMobileBottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            href: "/",
            label: "Home",
            icon: Home,
            active: pathname === "/",
        },
        {
            href: "https://healss.kryloss.com",
            label: "Healss",
            icon: Heart,
            active: false,
            external: true,
        },
        {
            href: "https://notify.kryloss.com",
            label: "Notify",
            icon: Bell,
            active: false,
            external: true,
        },
        {
            href: "/docs",
            label: "Docs",
            icon: BookOpen,
            active: pathname.startsWith("/docs"),
        },
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F101A] border-t border-[#2A3442] safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const LinkComponent = item.external ? "a" : Link
                    const linkProps = item.external
                        ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                        : { href: item.href }

                    return (
                        <LinkComponent
                            key={item.href}
                            {...linkProps}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[68px] min-h-[56px]",
                                item.active
                                    ? "bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_20px_rgba(37,122,218,0.35)]"
                                    : "text-[#9CA9B7] active:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", item.active && "animate-in zoom-in-50 duration-200")} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </LinkComponent>
                    )
                })}
            </div>
        </nav>
    )
}
