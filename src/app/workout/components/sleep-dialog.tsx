"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { UserDataStorage } from "@/lib/user-data-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Moon, Sun, Star, Smile, Meh, Frown } from "lucide-react"

interface SleepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSleepLogged?: () => void
}

interface SleepSession {
    id: string
    startTime: number // minutes from midnight (0-720 for 12am-12pm)
    endTime: number
    wakeUps: number
    type: 'main' | 'nap'
}

export function SleepDialog({ open, onOpenChange, onSleepLogged }: SleepDialogProps) {
    const { user, supabase } = useAuth()
    const notifications = useNotifications()
    const [isLoading, setIsLoading] = useState(false)
    const [sleepQuality, setSleepQuality] = useState(3) // 1-5 rating
    const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([])
    const timelineRef = useRef<HTMLDivElement>(null)

    // Sleep quality icons
    const qualityIcons = [Frown, Meh, Smile, Smile, Star]
    const qualityLabels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent']
    const qualityColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-blue-400']

    // Load user's sleep goal to set default session
    const loadDefaultSleepSession = useCallback(async () => {
        if (!user || !supabase) return

        try {
            UserDataStorage.initialize(user, supabase)
            const goals = await UserDataStorage.getUserGoals()
            const sleepHours = goals?.sleepHours || 8.0

            // Default sleep from 11 PM to (11 PM + sleep hours)
            const startTime = 23 * 60 // 11 PM in minutes
            const endTime = Math.min((startTime + sleepHours * 60) % (24 * 60), 12 * 60) // Cap at 12 PM

            setSleepSessions([{
                id: 'main',
                startTime: startTime > 12 * 60 ? startTime - 24 * 60 : startTime, // Convert to 0-720 range
                endTime,
                wakeUps: 0,
                type: 'main'
            }])
        } catch (error) {
            console.error('Error loading sleep goal:', error)
            // Fallback to 8 hours (11 PM to 7 AM)
            setSleepSessions([{
                id: 'main',
                startTime: -60, // 11 PM (23:00 - 24:00 = -1 hour from midnight)
                endTime: 7 * 60, // 7 AM
                wakeUps: 0,
                type: 'main'
            }])
        }
    }, [user, supabase])

    useEffect(() => {
        if (open) {
            loadDefaultSleepSession()
            setSleepQuality(3)
        }
    }, [open, loadDefaultSleepSession])

    // Convert minutes to 12-hour time format
    const formatTime = (minutes: number) => {
        let totalMinutes = minutes
        if (totalMinutes < 0) totalMinutes += 24 * 60 // Handle negative times (previous day)

        const hours = Math.floor(totalMinutes / 60) % 24
        const mins = totalMinutes % 60
        const period = hours < 12 ? 'AM' : 'PM'
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

        return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`
    }



    // Calculate duration in hours and minutes
    const calculateDuration = (start: number, end: number) => {
        let duration = end - start
        if (duration < 0) duration += 24 * 60 // Handle overnight sleep

        const hours = Math.floor(duration / 60)
        const minutes = duration % 60
        return { hours, minutes, totalMinutes: duration }
    }








    // Convert time to x,y coordinates on oval (commented out as unused)
    // const timeToCoordinates = (minutes: number, centerX: number, centerY: number, radiusX: number, radiusY: number): {x: number, y: number} => {
    //     const angle = timeToAngle(minutes)
    //     return {
    //         x: centerX + radiusX * Math.cos(angle),
    //         y: centerY + radiusY * Math.sin(angle)
    //     }
    // }











    // Save sleep data
    const handleSaveSleep = async () => {
        if (!user || !supabase) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to log sleep data'
            })
            return
        }

        if (sleepSessions.length === 0) {
            notifications.warning('No sleep data', {
                description: 'Please set at least one sleep session'
            })
            return
        }

        try {
            setIsLoading(true)
            UserDataStorage.initialize(user, supabase)

            // Calculate total sleep duration
            const totalSleep = sleepSessions.reduce((total, session) => {
                const duration = calculateDuration(session.startTime, session.endTime)
                return total + duration.totalMinutes
            }, 0)

            // Save sleep data
            const sleepData = {
                date: new Date().toISOString().split('T')[0],
                sessions: sleepSessions,
                qualityRating: sleepQuality,
                totalMinutes: totalSleep,
                totalWakeUps: sleepSessions.reduce((total, session) => total + session.wakeUps, 0)
            }

            await UserDataStorage.saveSleepData(sleepData)

            notifications.success('Sleep logged!', {
                description: `${Math.floor(totalSleep / 60)}h ${totalSleep % 60}m recorded`,
                duration: 3000
            })

            onSleepLogged?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Error saving sleep data:', error)
            notifications.error('Save failed', {
                description: 'Could not save sleep data'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="flex items-center space-x-3 text-lg font-semibold text-[#F3F4F6]">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] rounded-lg flex items-center justify-center">
                            <Moon className="w-4 h-4 text-white" />
                        </div>
                        <span>Log Sleep</span>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="px-6 pb-6 space-y-6">
                        {/* Timeline and Sleep Sessions */}
                        <div className="space-y-6">
                            <Label className="text-sm font-medium text-[#F3F4F6]">Sleep Clock (24 Hour)</Label>

                            {/* Oval Clock Interface */}
                            <div className="relative bg-[#121318] border border-[#212227] rounded-lg p-8">

                                {/* Clock container */}
                                <div
                                    ref={timelineRef}
                                    className="relative w-full max-w-md mx-auto select-none"
                                    style={{ aspectRatio: '320/240' }}
                                >
                                    {/* Oval Clock face with smooth day/night gradients */}
                                    <svg className="w-full h-full" viewBox="0 0 320 240">
                                        {/* Advanced gradient definitions for smooth day/night transitions */}
                                        <defs>
                                            {/* Radial gradient for overall ambiance */}
                                            <radialGradient id="clockAmbiance" cx="50%" cy="50%" r="50%">
                                                <stop offset="0%" style={{stopColor:"#1F2937", stopOpacity:0.1}} />
                                                <stop offset="100%" style={{stopColor:"#0F172A", stopOpacity:0.2}} />
                                            </radialGradient>

                                            {/* Circular gradient following the clock shape */}
                                            <linearGradient id="timeGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                                                <stop offset="0%" style={{stopColor:"#1E40AF", stopOpacity:0.15}} />
                                                <stop offset="12.5%" style={{stopColor:"#3B82F6", stopOpacity:0.12}} />
                                                <stop offset="25%" style={{stopColor:"#60A5FA", stopOpacity:0.08}} />
                                                <stop offset="37.5%" style={{stopColor:"#FBBF24", stopOpacity:0.08}} />
                                                <stop offset="50%" style={{stopColor:"#F59E0B", stopOpacity:0.12}} />
                                                <stop offset="62.5%" style={{stopColor:"#FBBF24", stopOpacity:0.08}} />
                                                <stop offset="75%" style={{stopColor:"#60A5FA", stopOpacity:0.08}} />
                                                <stop offset="87.5%" style={{stopColor:"#3B82F6", stopOpacity:0.12}} />
                                                <stop offset="100%" style={{stopColor:"#1E40AF", stopOpacity:0.15}} />
                                            </linearGradient>

                                            {/* Dot color gradients */}
                                            <linearGradient id="dotGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" style={{stopColor:"#3B82F6"}} />
                                                <stop offset="25%" style={{stopColor:"#60A5FA"}} />
                                                <stop offset="50%" style={{stopColor:"#F59E0B"}} />
                                                <stop offset="75%" style={{stopColor:"#60A5FA"}} />
                                                <stop offset="100%" style={{stopColor:"#3B82F6"}} />
                                            </linearGradient>
                                        </defs>

                                        {/* Base ambiance background */}
                                        <ellipse
                                            cx="160"
                                            cy="120"
                                            rx="138"
                                            ry="98"
                                            fill="url(#clockAmbiance)"
                                        />

                                        {/* Time-based gradient overlay */}
                                        <ellipse
                                            cx="160"
                                            cy="120"
                                            rx="136"
                                            ry="96"
                                            fill="url(#timeGradient)"
                                        />

                                        {/* Oval clock border with subtle gradient */}
                                        <ellipse
                                            cx="160"
                                            cy="120"
                                            rx="140"
                                            ry="100"
                                            fill="none"
                                            stroke="#4B5563"
                                            strokeWidth="2"
                                            opacity="0.8"
                                        />

                                        {/* 24 hour dots with smooth color transitions */}
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const angle = (i * Math.PI) / 12 - Math.PI / 2 // 24 hours around circle, start at top (12 AM)
                                            const hour = i

                                            // Create smooth color transition based on time of day
                                            const getHourColor = (hour: number) => {
                                                // Normalize hour to 0-1 for smooth transitions
                                                const normalizedHour = hour / 24

                                                if (hour >= 0 && hour < 6) {
                                                    // Deep night (midnight to 6 AM): Blue tones
                                                    const intensity = 1 - (hour / 6) * 0.3
                                                    return `hsl(220, 85%, ${45 + intensity * 20}%)`
                                                } else if (hour >= 6 && hour < 12) {
                                                    // Morning to noon: Blue to amber transition
                                                    const progress = (hour - 6) / 6
                                                    const hue = 220 + (progress * 120) // Blue to amber
                                                    return `hsl(${hue}, ${85 - progress * 30}%, ${60 + progress * 15}%)`
                                                } else if (hour >= 12 && hour < 18) {
                                                    // Afternoon: Amber tones
                                                    const intensity = 1 - ((hour - 12) / 6) * 0.2
                                                    return `hsl(45, ${85 + intensity * 10}%, ${65 + intensity * 10}%)`
                                                } else {
                                                    // Evening to night: Amber to blue transition
                                                    const progress = (hour - 18) / 6
                                                    const hue = 45 - (progress * 85) // Amber to blue
                                                    return `hsl(${hue + (progress * 175)}, 85%, ${70 - progress * 25}%)`
                                                }
                                            }

                                            const cos = Math.cos(angle)
                                            const sin = Math.sin(angle)
                                            const centerX = 160
                                            const centerY = 120
                                            const rx = 135 // Slightly inside the border
                                            const ry = 95

                                            // Calculate position on oval perimeter
                                            const x = centerX + cos * rx
                                            const y = centerY + sin * ry

                                            return (
                                                <circle
                                                    key={i}
                                                    cx={x}
                                                    cy={y}
                                                    r="2.5"
                                                    fill={getHourColor(hour)}
                                                    opacity="0.9"
                                                    style={{
                                                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))'
                                                    }}
                                                />
                                            )
                                        })}

                                        {/* Major hour labels with smooth gradient colors */}
                                        {[
                                            { time: '24', angle: -Math.PI / 2, hour: 0 }, // 12 AM at top
                                            { time: '6', angle: 0, hour: 6 }, // 6 AM at right
                                            { time: '12', angle: Math.PI / 2, hour: 12 }, // 12 PM at bottom
                                            { time: '18', angle: Math.PI, hour: 18 } // 6 PM at left
                                        ].map(({ time, angle, hour }) => {
                                            const cos = Math.cos(angle)
                                            const sin = Math.sin(angle)
                                            const centerX = 160
                                            const centerY = 120
                                            const labelRx = 155 // Outside the dots
                                            const labelRy = 115

                                            // Same color logic as dots for consistency
                                            const getLabelColor = (hour: number) => {
                                                if (hour >= 0 && hour < 6) {
                                                    return `hsl(220, 70%, 70%)` // Night blue
                                                } else if (hour >= 6 && hour < 12) {
                                                    const progress = (hour - 6) / 6
                                                    const hue = 220 + (progress * 120)
                                                    return `hsl(${hue}, 70%, 75%)`
                                                } else if (hour >= 12 && hour < 18) {
                                                    return `hsl(45, 85%, 75%)` // Day amber
                                                } else {
                                                    const progress = (hour - 18) / 6
                                                    const hue = 45 - (progress * 85)
                                                    return `hsl(${hue + (progress * 175)}, 70%, 70%)`
                                                }
                                            }

                                            const x = centerX + cos * labelRx
                                            const y = centerY + sin * labelRy

                                            return (
                                                <text
                                                    key={time}
                                                    x={x}
                                                    y={y}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className="text-sm font-medium"
                                                    fill={getLabelColor(hour)}
                                                    style={{
                                                        filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.4))'
                                                    }}
                                                >
                                                    {time}
                                                </text>
                                            )
                                        })}

                                    </svg>

                                    {/* Moon and Sun icons outside the clock */}
                                    <div className="absolute top-2 left-4 flex items-center space-x-2">
                                        <Moon className="w-5 h-5 text-blue-400" />
                                        <span className="text-xs text-blue-400 font-medium">Night</span>
                                    </div>
                                    <div className="absolute top-2 right-4 flex items-center space-x-2">
                                        <Sun className="w-5 h-5 text-amber-400" />
                                        <span className="text-xs text-amber-400 font-medium">Day</span>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Sleep Quality Rating */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-[#F3F4F6]">Sleep Quality</Label>

                            <div className="flex items-center justify-between">
                                {qualityIcons.map((IconComponent, index) => {
                                    const rating = index + 1
                                    return (
                                        <button
                                            key={rating}
                                            onClick={() => setSleepQuality(rating)}
                                            className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-all ${sleepQuality === rating
                                                ? 'bg-[#2A8CEA]/20 border border-[#2A8CEA]/50'
                                                : 'hover:bg-[rgba(255,255,255,0.04)]'
                                                }`}
                                        >
                                            <IconComponent className={`w-6 h-6 ${sleepQuality === rating
                                                ? qualityColors[index]
                                                : 'text-[#A1A1AA]'
                                                }`} />
                                            <span className="text-xs text-[#A1A1AA]">{qualityLabels[index]}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Total Sleep Summary */}
                        <div className="bg-[#0E0F13] border border-[#212227] rounded-lg p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-[#F3F4F6] mb-1">
                                    {(() => {
                                        const total = sleepSessions.reduce((sum, session) => {
                                            const duration = calculateDuration(session.startTime, session.endTime)
                                            return sum + duration.totalMinutes
                                        }, 0)
                                        const hours = Math.floor(total / 60)
                                        const minutes = total % 60
                                        return `${hours}h ${minutes}m`
                                    })()}
                                </div>
                                <div className="text-sm text-[#A1A1AA]">Total Sleep Time</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <Button
                                onClick={() => onOpenChange(false)}
                                variant="outline"
                                className="flex-1 border-[#212227] text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveSleep}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-[#2BD2FF] to-[#2A8CEA] text-white border border-[rgba(43,210,255,0.35)] shadow-[0_4px_16px_rgba(43,210,255,0.28)] hover:shadow-[0_6px_24px_rgba(43,210,255,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? 'Saving...' : 'Log Sleep'}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}