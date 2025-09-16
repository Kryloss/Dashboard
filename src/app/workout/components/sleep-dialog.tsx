"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { UserDataStorage } from "@/lib/user-data-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Moon, Star, Smile, Meh, Frown } from "lucide-react"

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
                                {/* Instructions */}
                                <div className="text-xs text-[#A1A1AA] mb-6 text-center">
                                    Sleep Timeline • AM at top, PM at bottom
                                </div>

                                {/* Clock container */}
                                <div
                                    ref={timelineRef}
                                    className="relative w-full max-w-md mx-auto select-none"
                                    style={{ aspectRatio: '320/240' }}
                                >
                                    {/* Clock face - rounded rectangular shape */}
                                    <svg className="w-full h-full" viewBox="0 0 320 240">
                                        {/* Outer clock ring - rounded rectangle */}
                                        <rect
                                            x="20"
                                            y="20"
                                            width="280"
                                            height="200"
                                            rx="30"
                                            ry="30"
                                            fill="none"
                                            stroke="#2A2B31"
                                            strokeWidth="6"
                                        />

                                        {/* Hour markers for rounded rectangle */}
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const angle = (i * Math.PI) / 12 - Math.PI / 2 // Start at top (12 AM)
                                            const isMainHour = i % 6 === 0 // 12 AM, 6 AM, 12 PM, 6 PM

                                            // Calculate position on smooth rounded rectangle perimeter
                                            const getRoundedRectPoint = (angle: number, outerRadius: boolean) => {
                                                const cos = Math.cos(angle)
                                                const sin = Math.sin(angle)

                                                // Adjusted for new viewBox (320x240) with center at (160, 120)
                                                const centerX = 160
                                                const centerY = 120
                                                const rx = outerRadius ? 130 : (isMainHour ? 110 : 120)
                                                const ry = outerRadius ? 90 : (isMainHour ? 75 : 82)
                                                const cornerRadius = 30 // Match the SVG corner radius

                                                // Enhanced rounded rectangle calculation
                                                const absX = Math.abs(cos)
                                                const absY = Math.abs(sin)

                                                // Calculate effective radii considering rounded corners
                                                const effectiveRx = rx - cornerRadius
                                                const effectiveRy = ry - cornerRadius

                                                let x, y

                                                // Determine which region we're in and apply appropriate calculation
                                                if (absX / effectiveRx > absY / effectiveRy) {
                                                    // Near vertical edges - apply corner smoothing
                                                    const edgeX = cos > 0 ? effectiveRx : -effectiveRx
                                                    const edgeY = sin * effectiveRx / absX

                                                    // Apply corner radius smoothing
                                                    if (Math.abs(edgeY) > effectiveRy) {
                                                        // In corner region
                                                        const cornerCenterY = sin > 0 ? effectiveRy : -effectiveRy
                                                        const cornerCenterX = cos > 0 ? effectiveRx : -effectiveRx
                                                        const cornerAngle = Math.atan2(sin * effectiveRy - cornerCenterY, cos * effectiveRx - cornerCenterX)
                                                        x = centerX + cornerCenterX + cornerRadius * Math.cos(cornerAngle)
                                                        y = centerY + cornerCenterY + cornerRadius * Math.sin(cornerAngle)
                                                    } else {
                                                        // On straight edge
                                                        x = centerX + edgeX + (cos > 0 ? cornerRadius : -cornerRadius)
                                                        y = centerY + edgeY
                                                    }
                                                } else {
                                                    // Near horizontal edges - apply corner smoothing
                                                    const edgeY = sin > 0 ? effectiveRy : -effectiveRy
                                                    const edgeX = cos * effectiveRy / absY

                                                    // Apply corner radius smoothing
                                                    if (Math.abs(edgeX) > effectiveRx) {
                                                        // In corner region
                                                        const cornerCenterX = cos > 0 ? effectiveRx : -effectiveRx
                                                        const cornerCenterY = sin > 0 ? effectiveRy : -effectiveRy
                                                        const cornerAngle = Math.atan2(sin * effectiveRy - cornerCenterY, cos * effectiveRx - cornerCenterX)
                                                        x = centerX + cornerCenterX + cornerRadius * Math.cos(cornerAngle)
                                                        y = centerY + cornerCenterY + cornerRadius * Math.sin(cornerAngle)
                                                    } else {
                                                        // On straight edge
                                                        x = centerX + edgeX
                                                        y = centerY + edgeY + (sin > 0 ? cornerRadius : -cornerRadius)
                                                    }
                                                }

                                                return { x, y }
                                            }

                                            const outer = getRoundedRectPoint(angle, true)
                                            const inner = getRoundedRectPoint(angle, false)

                                            return (
                                                <line
                                                    key={i}
                                                    x1={outer.x}
                                                    y1={outer.y}
                                                    x2={inner.x}
                                                    y2={inner.y}
                                                    stroke="#4A4B51"
                                                    strokeWidth={isMainHour ? "2" : "1"}
                                                />
                                            )
                                        })}

                                        {/* Time labels for rounded rectangle */}
                                        {[
                                            { time: '12 AM', angle: -Math.PI / 2, hours: 0 },
                                            { time: '6 AM', angle: 0, hours: 6 },
                                            { time: '12 PM', angle: Math.PI / 2, hours: 12 },
                                            { time: '6 PM', angle: Math.PI, hours: 18 }
                                        ].map(({ time, angle }) => {
                                            // Use enhanced rounded rectangle calculation for labels
                                            const cos = Math.cos(angle)
                                            const sin = Math.sin(angle)
                                            const centerX = 160
                                            const centerY = 120
                                            const labelRx = 95
                                            const labelRy = 65
                                            const cornerRadius = 20 // Smaller corner radius for labels

                                            const absX = Math.abs(cos)
                                            const absY = Math.abs(sin)
                                            const effectiveRx = labelRx - cornerRadius
                                            const effectiveRy = labelRy - cornerRadius

                                            let x, y

                                            if (absX / effectiveRx > absY / effectiveRy) {
                                                // Near vertical edges
                                                const edgeX = cos > 0 ? effectiveRx : -effectiveRx
                                                const edgeY = sin * effectiveRx / absX

                                                if (Math.abs(edgeY) > effectiveRy) {
                                                    // Corner region
                                                    const cornerCenterY = sin > 0 ? effectiveRy : -effectiveRy
                                                    const cornerCenterX = cos > 0 ? effectiveRx : -effectiveRx
                                                    const cornerAngle = Math.atan2(sin * effectiveRy - cornerCenterY, cos * effectiveRx - cornerCenterX)
                                                    x = centerX + cornerCenterX + cornerRadius * Math.cos(cornerAngle)
                                                    y = centerY + cornerCenterY + cornerRadius * Math.sin(cornerAngle)
                                                } else {
                                                    // Straight edge
                                                    x = centerX + edgeX + (cos > 0 ? cornerRadius : -cornerRadius)
                                                    y = centerY + edgeY
                                                }
                                            } else {
                                                // Near horizontal edges
                                                const edgeY = sin > 0 ? effectiveRy : -effectiveRy
                                                const edgeX = cos * effectiveRy / absY

                                                if (Math.abs(edgeX) > effectiveRx) {
                                                    // Corner region
                                                    const cornerCenterX = cos > 0 ? effectiveRx : -effectiveRx
                                                    const cornerCenterY = sin > 0 ? effectiveRy : -effectiveRy
                                                    const cornerAngle = Math.atan2(sin * effectiveRy - cornerCenterY, cos * effectiveRx - cornerCenterX)
                                                    x = centerX + cornerCenterX + cornerRadius * Math.cos(cornerAngle)
                                                    y = centerY + cornerCenterY + cornerRadius * Math.sin(cornerAngle)
                                                } else {
                                                    // Straight edge
                                                    x = centerX + edgeX
                                                    y = centerY + edgeY + (sin > 0 ? cornerRadius : -cornerRadius)
                                                }
                                            }

                                            return (
                                                <text
                                                    key={time}
                                                    x={x}
                                                    y={y}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className="text-sm font-medium fill-[#F3F4F6]"
                                                >
                                                    {time}
                                                </text>
                                            )
                                        })}

                                    </svg>
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