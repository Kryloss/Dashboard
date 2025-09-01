"use client"

import { cn } from "@/lib/utils"

interface ActivityItemProps {
    date: string
    name: string
    duration: string
    progress: number // 0-1 for progress bar
    className?: string
}

export function ActivityItem({
    date,
    name,
    duration,
    progress,
    className
}: ActivityItemProps) {
    return (
        <div className={cn(
            "flex items-center justify-between py-3 border-b border-[#212227] last:border-b-0",
            className
        )}>
            <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm text-[#A1A1AA] font-medium">{date}</span>
                    <span className="text-sm font-medium text-[#F3F4F6]">{name}</span>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="flex-1 h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#2A8CEA] to-[#1659BF] rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
                        />
                    </div>
                    <span className="text-sm font-medium text-[#A1A1AA] min-w-0 shrink-0">
                        {duration}
                    </span>
                </div>
            </div>
        </div>
    )
}