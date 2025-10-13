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
                "flex-shrink-0 flex flex-col items-center justify-center text-center gap-3 min-w-[90px] snap-start",
                "focus:outline-none focus:ring-2 focus:ring-[#2A8CEA] focus:ring-offset-2 focus:ring-offset-[#0B0B0F]",
                "md:p-6 md:bg-[#121318] md:border md:border-[#212227] md:rounded-[20px] md:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] md:hover:border-[#2A2B31] md:transition-all",
                "group",
                className
            )}
        >
            <div className="w-[72px] h-[72px] bg-[#1A1D21] border border-[#2A2B31] rounded-[20px] flex items-center justify-center text-[#F3F4F6] group-hover:bg-[#242830] group-active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                {icon}
            </div>
            <span className="text-sm font-medium text-[#9CA9B7] group-hover:text-[#F3F4F6] transition-colors">
                {label}
            </span>
        </button>
    )
}