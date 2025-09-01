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
                "bg-[#121318] border border-[#212227] rounded-[20px] p-5",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]",
                "hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)]",
                "active:translate-y-0 active:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                "transition-all duration-200 ease-out",
                "flex flex-col items-center justify-center text-center space-y-3",
                "focus:outline-none focus:ring-[0_0_0_2px_#0B0B0F,_0_0_0_4px_#2A8CEA]",
                "group w-full aspect-square",
                className
            )}
        >
            <div className="w-12 h-12 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[14px] flex items-center justify-center text-[#F3F4F6] group-hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                {icon}
            </div>
            <span className="text-sm font-medium text-[#F3F4F6] group-hover:text-white transition-colors">
                {label}
            </span>
        </button>
    )
}