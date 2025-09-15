"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { UserDataStorage } from "@/lib/user-data-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Moon, Plus, X, Star, Smile, Meh, Frown } from "lucide-react"

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
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null)
    const [dragOffset, setDragOffset] = useState(0)
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

    // Convert pixel position to time (in minutes)
    const pixelToTime = (pixel: number, timelineWidth: number): number => {
        const ratio = pixel / timelineWidth
        return Math.round((ratio * 720) / 15) * 15 // 720 minutes (12 hours), snap to 15-min intervals
    }

    // Convert time to pixel position
    const timeToPixel = (time: number, timelineWidth: number): number => {
        const adjustedTime = time < 0 ? time + 720 : time // Handle negative times
        return (Math.max(0, Math.min(720, adjustedTime)) / 720) * timelineWidth
    }

    // Handle timeline click - create or modify sleep sessions
    const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current || isDragging) return

        const rect = timelineRef.current.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const timelineWidth = rect.width
        const clickedTime = pixelToTime(clickX, timelineWidth)

        // Check if clicking on an existing session
        const clickedSession = sleepSessions.find(session => {
            const startPos = timeToPixel(session.startTime, timelineWidth)
            const endPos = timeToPixel(session.endTime, timelineWidth)
            return clickX >= startPos && clickX <= endPos
        })

        if (clickedSession) {
            // Select the session for editing
            setSelectedSession(clickedSession.id)
        } else {
            // Create new nap session at clicked position
            if (sleepSessions.length >= 5) {
                notifications.warning('Session limit', {
                    description: 'Maximum 5 sleep sessions allowed',
                    duration: 3000
                })
                return
            }

            const newSession: SleepSession = {
                id: `nap-${Date.now()}`,
                startTime: clickedTime,
                endTime: Math.min(clickedTime + 60, 720), // 1 hour default, max 12 PM
                wakeUps: 0,
                type: 'nap'
            }

            setSleepSessions(prev => [...prev, newSession])
            setSelectedSession(newSession.id)
        }
    }

    // Handle mouse down on session for dragging
    const handleSessionMouseDown = (event: React.MouseEvent, sessionId: string, dragMode: 'start' | 'end' | 'move') => {
        event.stopPropagation()
        if (!timelineRef.current) return

        const rect = timelineRef.current.getBoundingClientRect()
        const session = sleepSessions.find(s => s.id === sessionId)
        if (!session) return

        setIsDragging(true)
        setDragType(dragMode)
        setSelectedSession(sessionId)

        const mouseX = event.clientX - rect.left
        if (dragMode === 'move') {
            const sessionStart = timeToPixel(session.startTime, rect.width)
            setDragOffset(mouseX - sessionStart)
        } else {
            setDragOffset(0)
        }
    }

    // Handle mouse move for dragging
    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!isDragging || !dragType || !selectedSession || !timelineRef.current) return

        const rect = timelineRef.current.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const timelineWidth = rect.width

        setSleepSessions(prev => prev.map(session => {
            if (session.id !== selectedSession) return session

            const duration = session.endTime - session.startTime

            switch (dragType) {
                case 'start': {
                    const newStartTime = pixelToTime(mouseX, timelineWidth)
                    const maxStart = session.endTime - 15 // Minimum 15 minutes
                    return {
                        ...session,
                        startTime: Math.max(
                            session.type === 'main' ? -240 : 0, // 8 PM for main sleep
                            Math.min(newStartTime, maxStart)
                        )
                    }
                }
                case 'end': {
                    const newEndTime = pixelToTime(mouseX, timelineWidth)
                    const minEnd = session.startTime + 15 // Minimum 15 minutes
                    return {
                        ...session,
                        endTime: Math.max(minEnd, Math.min(newEndTime, 720))
                    }
                }
                case 'move': {
                    const newStartTime = pixelToTime(mouseX - dragOffset, timelineWidth)
                    const maxStart = 720 - duration
                    const minStart = session.type === 'main' ? -240 : 0
                    const clampedStart = Math.max(minStart, Math.min(newStartTime, maxStart))
                    return {
                        ...session,
                        startTime: clampedStart,
                        endTime: clampedStart + duration
                    }
                }
                default:
                    return session
            }
        }))
    }, [isDragging, dragType, selectedSession, dragOffset])

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
        setDragType(null)
        setDragOffset(0)
    }, [])

    // Add mouse event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = dragType === 'move' ? 'grabbing' : 'col-resize'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'auto'
        }
    }, [isDragging, handleMouseMove, handleMouseUp, dragType])


    // Add wake-up to session
    const addWakeUp = (sessionId: string) => {
        setSleepSessions(prev => prev.map(session =>
            session.id === sessionId
                ? { ...session, wakeUps: session.wakeUps + 1 }
                : session
        ))
    }

    // Add new nap session
    const addNapSession = () => {
        if (sleepSessions.length >= 5) {
            notifications.warning('Session limit', {
                description: 'Maximum 5 sleep sessions allowed',
                duration: 3000
            })
            return
        }

        // Find a good default time for nap (avoiding existing sessions)
        let defaultStart = 13 * 60 // 1 PM default
        let defaultEnd = 14 * 60 // 2 PM default

        // Check if this time conflicts with existing sessions
        const hasConflict = sleepSessions.some(session => {
            const sessionStart = session.startTime < 0 ? session.startTime + 24 * 60 : session.startTime
            const sessionEnd = session.endTime
            return (defaultStart >= sessionStart && defaultStart <= sessionEnd) ||
                   (defaultEnd >= sessionStart && defaultEnd <= sessionEnd)
        })

        if (hasConflict) {
            // Try 3 PM if 1 PM conflicts
            defaultStart = 15 * 60
            defaultEnd = 16 * 60
        }

        const newSession: SleepSession = {
            id: `nap-${Date.now()}`,
            startTime: defaultStart,
            endTime: defaultEnd,
            wakeUps: 0,
            type: 'nap'
        }

        setSleepSessions(prev => [...prev, newSession])
    }

    // Remove session
    const removeSession = (sessionId: string) => {
        if (sessionId === 'main') return // Can't remove main sleep
        setSleepSessions(prev => prev.filter(session => session.id !== sessionId))
    }

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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
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
                            <Label className="text-sm font-medium text-[#F3F4F6]">Sleep Timeline (12 AM - 12 PM)</Label>

                            {/* Main Timeline */}
                            <div className="relative bg-[#121318] border border-[#212227] rounded-lg p-6">
                                {/* Timeline endpoints */}
                                <div className="flex justify-between text-sm font-medium text-[#F3F4F6] mb-4">
                                    <span>12 AM</span>
                                    <span>12 PM</span>
                                </div>

                                {/* Interactive Timeline */}
                                <div className="relative w-full mb-8">
                                    {/* Instructions */}
                                    <div className="text-xs text-[#A1A1AA] mb-3 text-center">
                                        Click on timeline to add nap • Click and drag sleep bars to adjust time • Drag edges to resize
                                    </div>

                                    {/* Timeline container */}
                                    <div
                                        ref={timelineRef}
                                        className="relative w-full h-12 flex items-center cursor-pointer select-none"
                                        onClick={handleTimelineClick}
                                    >
                                        {/* Timeline base */}
                                        <div className="relative w-full h-3 bg-[#2A2B31] rounded-full">
                                            {/* Hour markers */}
                                            {Array.from({ length: 13 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute w-px h-8 bg-[#4A4B51] top-1/2 transform -translate-y-1/2"
                                                    style={{ left: `${(i / 12) * 100}%` }}
                                                />
                                            ))}

                                            {/* Time labels */}
                                            <div className="absolute -top-6 left-0 text-xs text-[#7A7F86]">12 AM</div>
                                            <div className="absolute -top-6 left-1/4 text-xs text-[#7A7F86]">3 AM</div>
                                            <div className="absolute -top-6 left-1/2 text-xs text-[#7A7F86]">6 AM</div>
                                            <div className="absolute -top-6 left-3/4 text-xs text-[#7A7F86]">9 AM</div>
                                            <div className="absolute -top-6 right-0 text-xs text-[#7A7F86]">12 PM</div>
                                        </div>

                                        {/* Sleep Session Bars */}
                                        {sleepSessions.map((session, index) => {
                                            if (!timelineRef.current) return null

                                            const timelineWidth = timelineRef.current.offsetWidth
                                            const startPos = timeToPixel(session.startTime, timelineWidth)
                                            const endPos = timeToPixel(session.endTime, timelineWidth)
                                            const width = Math.max(endPos - startPos, 20) // Minimum 20px width
                                            const isSelected = selectedSession === session.id

                                            return (
                                                <div
                                                    key={session.id}
                                                    className={`absolute top-1/2 transform -translate-y-1/2 h-4 rounded-lg border-2 transition-all duration-200 ${
                                                        session.type === 'main'
                                                            ? 'bg-gradient-to-r from-[#2BD2FF] to-[#2A8CEA] border-[#2BD2FF]'
                                                            : 'bg-gradient-to-r from-[#9BE15D] to-[#7BC142] border-[#9BE15D]'
                                                    } ${
                                                        isSelected
                                                            ? 'ring-2 ring-white ring-opacity-50 shadow-lg scale-105'
                                                            : 'hover:scale-102 hover:shadow-md'
                                                    }`}
                                                    style={{
                                                        left: `${startPos}px`,
                                                        width: `${width}px`,
                                                        zIndex: session.type === 'main' ? 10 + index : 5 + index,
                                                    }}
                                                    onMouseDown={(e) => handleSessionMouseDown(e, session.id, 'move')}
                                                >
                                                    {/* Start resize handle */}
                                                    <div
                                                        className="absolute left-0 top-0 w-2 h-full cursor-col-resize opacity-0 hover:opacity-100 bg-white bg-opacity-30 rounded-l-lg transition-opacity"
                                                        onMouseDown={(e) => handleSessionMouseDown(e, session.id, 'start')}
                                                    />

                                                    {/* Session label */}
                                                    {width > 60 && (
                                                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium pointer-events-none">
                                                            {session.type === 'main' ? 'Sleep' : 'Nap'}
                                                        </div>
                                                    )}

                                                    {/* End resize handle */}
                                                    <div
                                                        className="absolute right-0 top-0 w-2 h-full cursor-col-resize opacity-0 hover:opacity-100 bg-white bg-opacity-30 rounded-r-lg transition-opacity"
                                                        onMouseDown={(e) => handleSessionMouseDown(e, session.id, 'end')}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Selected session details */}
                                    {selectedSession && (
                                        <div className="mt-4 p-3 bg-[#0E0F13] border border-[#2A8CEA] rounded-lg">
                                            {(() => {
                                                const session = sleepSessions.find(s => s.id === selectedSession)
                                                if (!session) return null
                                                const duration = calculateDuration(session.startTime, session.endTime)

                                                return (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                                session.type === 'main' ? 'bg-[#2BD2FF]' : 'bg-[#9BE15D]'
                                                            }`} />
                                                            <span className="text-sm font-medium text-[#F3F4F6]">
                                                                {session.type === 'main' ? 'Main Sleep' : 'Nap'} • {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                            </span>
                                                            <span className="text-xs text-[#A1A1AA]">
                                                                {duration.hours}h {duration.minutes}m
                                                            </span>
                                                            {session.wakeUps > 0 && (
                                                                <span className="text-xs text-[#A1A1AA]">
                                                                    • {session.wakeUps} wake-ups
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                onClick={() => addWakeUp(session.id)}
                                                                variant="ghost"
                                                                className="text-xs h-auto px-2 py-1 text-[#A1A1AA] hover:text-[#F3F4F6]"
                                                            >
                                                                + Wake-up
                                                            </Button>
                                                            {session.type === 'nap' && (
                                                                <Button
                                                                    onClick={() => removeSession(session.id)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-6 h-6 text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                onClick={() => setSelectedSession(null)}
                                                                variant="ghost"
                                                                className="text-xs h-auto px-2 py-1 text-[#A1A1AA] hover:text-[#F3F4F6]"
                                                            >
                                                                Done
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </div>


                                {/* Add Nap Button */}
                                {sleepSessions.length < 5 && (
                                    <div className="text-center mb-6">
                                        <Button
                                            onClick={addNapSession}
                                            variant="outline"
                                            className="border-[#212227] text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Nap
                                        </Button>
                                        <div className="text-xs text-[#7A7F86] mt-2">
                                            Or click anywhere on the timeline above
                                        </div>
                                    </div>
                                )}
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
                                            className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-all ${
                                                sleepQuality === rating
                                                    ? 'bg-[#2A8CEA]/20 border border-[#2A8CEA]/50'
                                                    : 'hover:bg-[rgba(255,255,255,0.04)]'
                                            }`}
                                        >
                                            <IconComponent className={`w-6 h-6 ${
                                                sleepQuality === rating
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