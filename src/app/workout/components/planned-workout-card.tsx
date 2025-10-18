"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock, Calendar } from "lucide-react"

export interface PlannedWorkoutProps {
    id: string
    icon: React.ReactNode
    name: string
    duration: string
    time: string
    onStart?: () => void
    onEdit?: () => void
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
        <div
            className={cn(
                "p-4 bg-gradient-to-br from-[#121318] via-[#0F1014] to-[#0B0C10] border border-[#212227] rounded-2xl shadow-[0_18px_64px_rgba(14,15,19,0.45)] hover:border-[#2A2B31] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(14,15,19,0.55)]",
                className
            )}
        >
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

            <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-[#A1A1AA]">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7A7F86]">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">{time}</span>
                    </div>
                </div>

                <Button
                    className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_10px_45px_rgba(42,140,234,0.27)] hover:shadow-[0_12px_55px_rgba(42,140,234,0.36)] hover:scale-[1.02] active:scale-[0.995] transition-all"
                    onClick={onStart}
                    aria-label={`Start ${name}`}
                >
                    Start Now
                </Button>
            </div>
        </div>
    )
}