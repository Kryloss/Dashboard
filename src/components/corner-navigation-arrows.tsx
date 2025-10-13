"use client"

import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CornerNavigationArrowsProps {
    isVisible: boolean
}

export function CornerNavigationArrows({ isVisible }: CornerNavigationArrowsProps) {
    const pathname = usePathname()
    const router = useRouter()

    // Define the page order for navigation
    const pages = [
        { path: '/workout', name: 'Workout' },
        { path: '/nutrition', name: 'Nutrition' },
        { path: '/progress', name: 'Progress' }
    ]

    // Get current page index
    const getCurrentPageIndex = () => {
        return pages.findIndex(page => pathname.startsWith(page.path))
    }

    const currentIndex = getCurrentPageIndex()

    // Calculate previous and next pages
    const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : null
    const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null

    if (currentIndex === -1) {
        return null
    }

    return (
        <>
            {/* Left Arrow - Previous Page */}
            {previousPage && (
                <div className={cn(
                    "hidden md:block fixed bottom-8 left-8 z-40 transition-all duration-500 ease-out",
                    isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8 pointer-events-none"
                )}>
                    <div className="relative group">
                        <Button
                            onClick={() => router.push(previousPage.path)}
                            className="w-12 h-12 rounded-full bg-[#121318] border border-[#212227] hover:border-[#2A8CEA] text-[#F3F4F6] hover:bg-[#1A1D21] shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(42,140,234,0.3)] hover:scale-110 active:scale-95 transition-all duration-200"
                            size="icon"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0F101A] border border-[#2A3442] rounded-lg text-sm text-[#F3F4F6] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                            {previousPage.name}
                        </div>
                    </div>
                </div>
            )}

            {/* Right Arrow - Next Page */}
            {nextPage && (
                <div className={cn(
                    "hidden md:block fixed bottom-8 right-8 z-40 transition-all duration-500 ease-out",
                    isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8 pointer-events-none"
                )}>
                    <div className="relative group">
                        <Button
                            onClick={() => router.push(nextPage.path)}
                            className="w-12 h-12 rounded-full bg-[#121318] border border-[#212227] hover:border-[#2A8CEA] text-[#F3F4F6] hover:bg-[#1A1D21] shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_24px_rgba(42,140,234,0.3)] hover:scale-110 active:scale-95 transition-all duration-200"
                            size="icon"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                        {/* Tooltip */}
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0F101A] border border-[#2A3442] rounded-lg text-sm text-[#F3F4F6] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                            {nextPage.name}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
