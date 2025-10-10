"use client"

import { cn } from "@/lib/utils"

interface QuickActionProps {
    icon: React.ReactNode
    label: string
    onClick: () => void
    className?: string
}

export function QuickActionCard({
    icon,
    label,
    onClick,
    className
}: QuickActionProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                // Mobile: compact horizontal scrollable style
                "flex-shrink-0 flex flex-col items-center justify-center text-center gap-3 min-w-[90px] snap-start",
                // Desktop: card-based layout with hover effects
                "md:min-w-0 md:bg-[#121318] md:border md:border-[#212227] md:rounded-[20px] md:p-6",
                "md:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]",
                "md:hover:border-[#2A2B31] md:hover:-translate-y-[1px] md:hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)]",
                "md:active:translate-y-0 md:active:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                "transition-all duration-200 ease-out",
                "md:w-full md:aspect-square md:space-y-4",
                "focus:outline-none focus:ring-2 focus:ring-[#2A8CEA] focus:ring-offset-2 focus:ring-offset-[#0B0B0F]",
                "group",
                className
            )}
        >
            <div className="w-[72px] h-[72px] md:w-14 md:h-14 bg-[#1A1D21] md:bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[20px] md:rounded-[16px] flex items-center justify-center text-[#F3F4F6] group-hover:bg-[#242830] md:group-hover:bg-[rgba(255,255,255,0.06)] group-active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:shadow-none">
                {icon}
            </div>
            <span className="text-sm md:text-base font-medium text-[#9CA9B7] md:text-[#F3F4F6] group-hover:text-[#F3F4F6] md:group-hover:text-white transition-colors">
                {label}
            </span>
        </button>
    )
}