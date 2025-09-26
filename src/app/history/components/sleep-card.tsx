"use client"

import { Button } from "@/components/ui/button"
import { Moon, Clock, Smile, Meh, Frown, Edit3, Trash2 } from "lucide-react"
import { SleepData, SleepSession as BaseSleepSession } from "@/lib/user-data-storage"

// Extended interface to handle legacy data
interface CompatibleSleepSession extends Omit<BaseSleepSession, 'startTime' | 'endTime'> {
    startTime: string | number
    endTime: string | number
}

interface CompatibleSleepData extends Omit<SleepData, 'sessions'> {
    sessions: CompatibleSleepSession[]
}

interface SleepCardProps {
    sleepData: CompatibleSleepData
    onEdit: () => void
    onDelete: () => void
}

export function SleepCard({ sleepData, onEdit, onDelete }: SleepCardProps) {
    // Sleep quality icons
    const qualityIcons = [Frown, Meh, Smile, Smile]
    const qualityLabels = ['Poor', 'Fair', 'Good', 'Excellent']
    const qualityColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400']

    // Convert time to minutes (handles both string "HH:MM" and legacy number formats)
    const timeToMinutes = (time: string | number) => {
        if (typeof time === 'number') {
            // Legacy format: minutes from midnight
            return time
        }
        if (typeof time === 'string' && time.includes(':')) {
            // New format: "HH:MM"
            const [hours, minutes] = time.split(':').map(Number)
            if (isNaN(hours) || isNaN(minutes)) return 0
            return hours * 60 + minutes
        }
        return 0
    }

    // Format time to display format (handles both string and number inputs)
    const formatTime = (time: string | number) => {
        try {
            let hours: number, minutes: number

            if (typeof time === 'number') {
                // Legacy format: minutes from midnight
                let totalMinutes = time
                if (totalMinutes < 0) totalMinutes += 24 * 60 // Handle negative times (previous day)
                hours = Math.floor(totalMinutes / 60) % 24
                minutes = totalMinutes % 60
            } else if (typeof time === 'string' && time.includes(':')) {
                // New format: "HH:MM"
                [hours, minutes] = time.split(':').map(Number)
                if (isNaN(hours) || isNaN(minutes)) {
                    return "Invalid time"
                }
            } else {
                return "Invalid time"
            }

            const period = hours < 12 ? 'AM' : 'PM'
            const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

            return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
        } catch (error) {
            console.error('Error formatting time:', error, time)
            return "Invalid time"
        }
    }

    // Format date
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
            day: 'numeric'
        })
    }

    // Format duration
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60

        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    // Calculate duration in minutes for a session (handles both string and number formats)
    const calculateSessionDuration = (startTime: string | number, endTime: string | number) => {
        try {
            const startMinutes = timeToMinutes(startTime)
            const endMinutes = timeToMinutes(endTime)
            let duration = endMinutes - startMinutes
            if (duration < 0) duration += 24 * 60 // Handle overnight sleep
            return duration
        } catch (error) {
            console.error('Error calculating session duration:', error, { startTime, endTime })
            return 0
        }
    }

    // Calculate main sleep session (usually the longest one)
    const mainSession = sleepData.sessions && sleepData.sessions.length > 0
        ? sleepData.sessions.reduce((longest, current) => {
            try {
                const currentDuration = calculateSessionDuration(current.startTime, current.endTime)
                const longestDuration = calculateSessionDuration(longest.startTime, longest.endTime)
                return currentDuration > longestDuration ? current : longest
            } catch (error) {
                console.error('Error comparing sessions:', error)
                return longest
            }
        }, sleepData.sessions[0])
        : null

    // If no valid session found, don't render the component
    if (!mainSession || !sleepData.sessions || sleepData.sessions.length === 0) {
        return (
            <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-4">
                <div className="text-center text-[#A1A1AA]">
                    <p>Invalid sleep data</p>
                </div>
            </div>
        )
    }

    return (
        <div className="group bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(43,210,255,0.35),_0_8px_40px_rgba(43,210,255,0.20)] transition-all duration-200 ease-out">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] rounded-[10px] flex items-center justify-center text-white">
                            <Moon className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-sm font-medium text-[#F3F4F6]">Sleep Session</span>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-[#A1A1AA]">
                                    {formatDate(sleepData.date)}
                                </span>
                                <span className="text-xs text-[#A1A1AA]">•</span>
                                <span className="text-xs text-[#A1A1AA]">
                                    {formatTime(mainSession.startTime)} - {formatTime(mainSession.endTime)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="text-2xl font-bold text-[#F3F4F6] mb-1">
                            {formatDuration(sleepData.totalMinutes)}
                        </div>
                        <div className="text-xs text-[#A1A1AA]">Total Sleep</div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-[#9CA3AF]">
                        <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{sleepData.sessions.length} session{sleepData.sessions.length !== 1 ? 's' : ''}</span>
                        </div>
                        {sleepData.totalWakeUps > 0 && (
                            <div className="flex items-center space-x-1">
                                <span>•</span>
                                <span>{sleepData.totalWakeUps} wake-up{sleepData.totalWakeUps !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sleep Quality */}
                <div className="flex flex-col items-center space-y-1 ml-4">
                    {(() => {
                        const IconComponent = qualityIcons[sleepData.qualityRating - 1]
                        const colorClass = qualityColors[sleepData.qualityRating - 1]
                        return <IconComponent className={`w-6 h-6 ${colorClass}`} />
                    })()}
                    <span className="text-xs text-[#A1A1AA] text-center">
                        {qualityLabels[sleepData.qualityRating - 1]}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
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

            {/* Sessions Summary */}
            {sleepData.sessions.length > 1 && (
                <div className="mt-3 pt-3 border-t border-[#2A2B31]">
                    <div className="flex flex-wrap gap-2">
                        {sleepData.sessions.map((session, index) => (
                            <div
                                key={session.id}
                                className={`text-xs px-2 py-1 rounded-md ${
                                    session.type === 'main'
                                        ? 'bg-[#2BD2FF]/10 text-[#2BD2FF] border border-[#2BD2FF]/20'
                                        : 'bg-[#9BE15D]/10 text-[#9BE15D] border border-[#9BE15D]/20'
                                }`}
                            >
                                {session.type === 'main' ? 'Main' : `Nap ${index}`}: {formatDuration(calculateSessionDuration(session.startTime, session.endTime))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}