"use client"

import { cn } from "@/lib/utils"
import { Dumbbell, Target, Heart, Bike, Clock } from "lucide-react"

interface ActivityItemProps {
    date: string
    name: string
    duration: string
    progress: number // 0-1 for progress bar
    workoutType: string
    exerciseCount: number
    completedAt: string // ISO string for time extraction
    className?: string
}

export function ActivityItem({
    date,
    name,
    duration,
    progress,
    workoutType,
    exerciseCount,
    completedAt,
    className
}: ActivityItemProps) {
    const getWorkoutIcon = (type: string) => {
        switch (type) {
            case 'strength': return <Dumbbell className="w-5 h-5" />
            case 'running': return <Target className="w-5 h-5" />
            case 'yoga': return <Heart className="w-5 h-5" />
            case 'cycling': return <Bike className="w-5 h-5" />
            default: return <Dumbbell className="w-5 h-5" />
        }
    }

    const getWorkoutColor = (type: string) => {
        switch (type) {
            case 'strength': return 'text-[#9BE15D]'
            case 'running': return 'text-[#FF2D55]'
            case 'yoga': return 'text-[#2BD2FF]'
            case 'cycling': return 'text-[#FF375F]'
            default: return 'text-[#9BE15D]'
        }
    }

    const formatTime = (isoString: string) => {
        const date = new Date(isoString)
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        })
    }
    return (
        <div className={cn(
            "flex items-center space-x-4 py-4 px-5 bg-[#0E0F13] border border-[#212227] rounded-[16px] mb-3 last:mb-0",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]",
            "hover:border-[#2A2B31] hover:bg-[#17181D] transition-all duration-200",
            className
        )}>
            {/* Workout Type Icon */}
            <div className={cn(
                "w-12 h-12 rounded-[12px] flex items-center justify-center",
                "bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]",
                getWorkoutColor(workoutType)
            )}>
                {getWorkoutIcon(workoutType)}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-[#A1A1AA] font-medium">{date}</span>
                        <span className="text-xs text-[#6B7280]">{formatTime(completedAt)}</span>
                    </div>
                </div>
                
                <h3 className="font-semibold text-[#F3F4F6] text-sm mb-2 truncate">{name}</h3>
                
                <div className="flex items-center space-x-4 text-xs text-[#A1A1AA]">
                    <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Dumbbell className="w-3 h-3" />
                        <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                    <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#2A8CEA] to-[#1659BF] rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}