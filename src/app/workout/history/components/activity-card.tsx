"use client"

import { Button } from "@/components/ui/button"
import { WorkoutActivity } from "@/lib/workout-storage"
import { Edit3, Trash2, Clock, Calendar } from "lucide-react"
import { ReactNode } from "react"

interface ActivityCardProps {
    activity: WorkoutActivity
    onEdit: () => void
    onDelete: () => void
    formatDuration: (seconds: number) => string
    getWorkoutIcon: (type: string) => ReactNode
    getWorkoutColor: (type: string) => string
}

export function ActivityCard({
    activity,
    onEdit,
    onDelete,
    formatDuration,
    getWorkoutIcon,
    getWorkoutColor
}: ActivityCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) return "Today"
        if (diffDays === 2) return "Yesterday"
        if (diffDays <= 7) return `${diffDays - 1} days ago`
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
    }

    return (
        <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200 group">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                    {/* Workout Icon */}
                    <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] ${getWorkoutColor(activity.workoutType)}`}>
                        {getWorkoutIcon(activity.workoutType)}
                    </div>

                    {/* Workout Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-[#F3F4F6] text-lg truncate">
                                {activity.name || `${activity.workoutType.charAt(0).toUpperCase() + activity.workoutType.slice(1)} Workout`}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-[rgba(42,140,234,0.25)] text-[#4AA7FF] rounded-full border border-[rgba(42,140,234,0.35)] capitalize">
                                {activity.workoutType}
                            </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-[#A1A1AA] mb-3">
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(activity.completedAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDuration(activity.durationSeconds)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                {getWorkoutIcon(activity.workoutType)}
                                <span>{activity.exercises?.length || 0} exercises</span>
                            </div>
                        </div>

                        {activity.notes && (
                            <p className="text-sm text-[#A1A1AA] bg-[#0E0F13] rounded-[10px] p-3 border border-[#212227]">
                                {activity.notes}
                            </p>
                        )}

                        {/* Exercise Summary */}
                        {activity.exercises && activity.exercises.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-[#7A7F86] mb-2">Exercises:</p>
                                <div className="flex flex-wrap gap-1">
                                    {activity.exercises.slice(0, 3).map((exercise, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 text-xs bg-[#0E0F13] text-[#A1A1AA] rounded-[6px] border border-[#212227]"
                                        >
                                            {exercise.name}
                                        </span>
                                    ))}
                                    {activity.exercises.length > 3 && (
                                        <span className="px-2 py-1 text-xs bg-[#0E0F13] text-[#7A7F86] rounded-[6px] border border-[#212227]">
                                            +{activity.exercises.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        onClick={onEdit}
                        variant="ghost"
                        size="icon"
                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-8 h-8"
                    >
                        <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        size="icon"
                        className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-8 h-8"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}