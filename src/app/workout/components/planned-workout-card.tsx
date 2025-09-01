"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PlannedWorkoutProps {
    icon: React.ReactNode
    name: string
    duration: string
    time: string
    onStart: () => void
    onEdit: () => void
    className?: string
}

export function PlannedWorkoutCard({
    icon,
    name,
    duration,
    time,
    onStart,
    onEdit,
    className
}: PlannedWorkoutProps) {
    return (
        <div className={cn(
            "bg-[#121318] border border-[#212227] rounded-[20px] p-5",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]",
            "hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)]",
            "transition-all duration-200 ease-out",
            className
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[14px] flex items-center justify-center text-[#F3F4F6]">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#F3F4F6] text-sm">{name}</h3>
                        <p className="text-xs text-[#A1A1AA] mt-1">{duration} • {time}</p>
                    </div>
                </div>
            </div>

            <div className="flex space-x-2">
                <Button
                    onClick={onStart}
                    className="flex-1 bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all text-sm font-medium h-8"
                >
                    Start
                </Button>
                <Button
                    onClick={onEdit}
                    variant="secondary"
                    className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31] hover:scale-[1.01] active:scale-[0.997] transition-all text-sm font-medium h-8 px-4"
                >
                    Edit
                </Button>
            </div>
        </div>
    )
}