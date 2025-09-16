"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { UserDataStorage } from "@/lib/user-data-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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

    // Parse time string (e.g., "9:30 PM") to minutes
    const parseTimeString = (timeStr: string): number | null => {
        const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
        const match = timeStr.trim().match(timeRegex)

        if (!match) return null

        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const period = match[3].toUpperCase()

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null

        // Convert to 24-hour format
        if (period === 'AM') {
            if (hours === 12) hours = 0
        } else {
            if (hours !== 12) hours += 12
        }

        return hours * 60 + minutes
    }

    // Update session time from manual input
    const updateSessionTimeFromInput = (sessionId: string, field: 'start' | 'end', timeStr: string) => {
        const newTime = parseTimeString(timeStr)
        if (newTime === null) return false // Invalid time format

        setSleepSessions(prev => prev.map(session => {
            if (session.id !== sessionId) return session

            if (field === 'start') {
                // For overnight sessions, allow start time to be after end time
                // Only check for minimum duration
                const duration = session.endTime >= newTime
                    ? session.endTime - newTime  // Same day
                    : (24 * 60) - newTime + session.endTime // Overnight

                if (duration < 15) return session // Minimum 15 minutes
                return { ...session, startTime: newTime }
            } else {
                // For end time, check duration considering overnight possibility
                const duration = newTime >= session.startTime
                    ? newTime - session.startTime  // Same day
                    : (24 * 60) - session.startTime + newTime // Overnight

                if (duration < 15) return session // Minimum 15 minutes
                return { ...session, endTime: newTime }
            }
        }))

        return true
    }

    // Calculate duration in hours and minutes
    const calculateDuration = (start: number, end: number) => {
        let duration = end - start
        if (duration < 0) duration += 24 * 60 // Handle overnight sleep

        const hours = Math.floor(duration / 60)
        const minutes = duration % 60
        return { hours, minutes, totalMinutes: duration }
    }

    // Convert pixel position to time (in minutes) - 24 hour range
    const pixelToTime = (pixel: number, timelineWidth: number): number => {
        const ratio = pixel / timelineWidth
        // 24 hours from 6 PM (-360 minutes) to 6 PM next day (1080 minutes)
        const totalRange = 1440 // 24 hours in minutes
        const startOffset = -360 // Start at 6 PM previous day
        return Math.round((startOffset + (ratio * totalRange)) / 15) * 15 // Snap to 15-min intervals
    }

    // Convert time to pixel position - 24 hour range
    const timeToPixel = (time: number, timelineWidth: number): number => {
        const startOffset = -360 // Start at 6 PM previous day
        const totalRange = 1440 // 24 hours in minutes
        const adjustedTime = time - startOffset // Offset to 0-based range
        const ratio = Math.max(0, Math.min(totalRange, adjustedTime)) / totalRange
        return ratio * timelineWidth
    }

    // Handle timeline click/tap - only select sessions, no creation
    const handleTimelinePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!timelineRef.current || isDragging) return

        const rect = timelineRef.current.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const timelineWidth = rect.width

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
            // Deselect if clicking on empty timeline
            setSelectedSession(null)
        }
    }

    // Handle mouse/touch down on session for dragging
    const handleSessionPointerDown = (event: React.PointerEvent, sessionId: string, dragMode: 'start' | 'end' | 'move') => {
        event.stopPropagation()
        event.preventDefault()
        if (!timelineRef.current) return

        const rect = timelineRef.current.getBoundingClientRect()
        const session = sleepSessions.find(s => s.id === sessionId)
        if (!session) return

        setIsDragging(true)
        setDragType(dragMode)
        setSelectedSession(sessionId)

        const pointerX = event.clientX - rect.left
        if (dragMode === 'move') {
            const sessionStart = timeToPixel(session.startTime, rect.width)
            setDragOffset(pointerX - sessionStart)
        } else {
            setDragOffset(0)
        }

        // Capture pointer for better mobile experience
        if (event.currentTarget.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId)
        }
    }


    // Throttle function for performance optimization
    const throttleRef = useRef<number | null>(null)

    // Handle pointer move for dragging - optimized version with touch support
    const handlePointerMove = useCallback((event: PointerEvent) => {
        if (!isDragging || !dragType || !selectedSession || !timelineRef.current) return

        // Throttle pointer events for better performance
        if (throttleRef.current) {
            cancelAnimationFrame(throttleRef.current)
        }

        throttleRef.current = requestAnimationFrame(() => {
            if (!timelineRef.current) return

            const rect = timelineRef.current.getBoundingClientRect()
            const pointerX = event.clientX - rect.left // Don't clamp - allow negative values
            const timelineWidth = rect.width

            setSleepSessions(prev => prev.map(session => {
                if (session.id !== selectedSession) return session

                const duration = session.endTime - session.startTime
                const newSession = { ...session }

                switch (dragType) {
                    case 'start': {
                        const newStartTime = pixelToTime(pointerX, timelineWidth)
                        const maxStart = session.endTime - 15 // Minimum 15 minutes
                        const proposedStart = Math.max(
                            -360, // 6 PM for any session (24h range start)
                            Math.min(newStartTime, maxStart)
                        )

                        newSession.startTime = proposedStart
                        break
                    }
                    case 'end': {
                        const newEndTime = pixelToTime(pointerX, timelineWidth)
                        const minEnd = session.startTime + 15 // Minimum 15 minutes
                        const proposedEnd = Math.max(minEnd, Math.min(newEndTime, 1080)) // 6 PM next day

                        newSession.endTime = proposedEnd
                        break
                    }
                    case 'move': {
                        const newStartTime = pixelToTime(pointerX - dragOffset, timelineWidth)
                        const maxStart = 1080 - duration // 6 PM next day minus duration
                        const minStart = -360 // 6 PM previous day
                        const clampedStart = Math.max(minStart, Math.min(newStartTime, maxStart))
                        const clampedEnd = clampedStart + duration

                        newSession.startTime = clampedStart
                        newSession.endTime = clampedEnd
                        break
                    }
                }

                return newSession
            }))
        })
    }, [isDragging, dragType, selectedSession, dragOffset])

    // Handle pointer up
    const handlePointerUp = useCallback(() => {
        // Cancel any pending throttled mouse moves
        if (throttleRef.current) {
            cancelAnimationFrame(throttleRef.current)
            throttleRef.current = null
        }

        // Check for overlaps when releasing and resolve them
        if (selectedSession) {
            setSleepSessions(prev => {
                const draggedSession = prev.find(s => s.id === selectedSession)
                if (!draggedSession) return prev

                // Check if the dragged session overlaps with others
                const hasOverlap = prev.some(session => {
                    if (session.id === selectedSession) return false
                    return !(draggedSession.endTime <= session.startTime || draggedSession.startTime >= session.endTime)
                })

                if (hasOverlap) {
                    // Find a safe position for the session
                    const sortedSessions = prev
                        .filter(s => s.id !== selectedSession)
                        .sort((a, b) => a.startTime - b.startTime)

                    const duration = draggedSession.endTime - draggedSession.startTime
                    let safeStart = draggedSession.startTime

                    // Try to find a gap
                    for (let i = 0; i < sortedSessions.length; i++) {
                        const currentSession = sortedSessions[i]
                        const nextSession = sortedSessions[i + 1]

                        // Check if we can fit before the current session
                        if (safeStart + duration <= currentSession.startTime) {
                            break
                        }

                        // Try after current session
                        safeStart = currentSession.endTime

                        // Check if we can fit before the next session (or at the end)
                        if (!nextSession || safeStart + duration <= nextSession.startTime) {
                            break
                        }
                    }

                    // Apply the safe position
                    return prev.map(session =>
                        session.id === selectedSession
                            ? { ...session, startTime: safeStart, endTime: safeStart + duration }
                            : session
                    )
                }

                return prev
            })
        }

        setIsDragging(false)
        setDragType(null)
        setDragOffset(0)
    }, [selectedSession])

    // Add pointer event listeners for better mobile/touch support
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('pointermove', handlePointerMove)
            document.addEventListener('pointerup', handlePointerUp)
            document.addEventListener('pointercancel', handlePointerUp)
            document.body.style.cursor = dragType === 'move' ? 'grabbing' : 'col-resize'
            document.body.style.touchAction = 'none' // Prevent scrolling during drag
        }

        return () => {
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
            document.removeEventListener('pointercancel', handlePointerUp)
            document.body.style.cursor = 'auto'
            document.body.style.touchAction = 'auto'
        }
    }, [isDragging, handlePointerMove, handlePointerUp, dragType])


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
                            <Label className="text-sm font-medium text-[#F3F4F6]">Sleep Timeline (6 PM - 6 PM next day)</Label>

                            {/* Main Timeline */}
                            <div className="relative bg-[#121318] border border-[#212227] rounded-lg p-6">
                                {/* Timeline endpoints */}
                                <div className="flex justify-between text-sm font-medium text-[#F3F4F6] mb-4">
                                    <span>6 PM</span>
                                    <span>6 PM</span>
                                </div>

                                {/* Interactive Timeline */}
                                <div className="relative w-full mb-8">
                                    {/* Instructions */}
                                    <div className="text-xs text-[#A1A1AA] mb-3 text-center">
                                        Click sleep bars to select • Drag bars to move • Drag edges to resize
                                    </div>

                                    {/* Timeline container */}
                                    <div
                                        ref={timelineRef}
                                        className="relative w-full h-12 flex items-center cursor-pointer select-none touch-manipulation"
                                        onPointerDown={handleTimelinePointerDown}
                                    >
                                        {/* Timeline base */}
                                        <div className="relative w-full h-3 bg-[#2A2B31] rounded-full">
                                            {/* Hour markers - 24 hour timeline */}
                                            {Array.from({ length: 25 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute w-px h-8 bg-[#4A4B51] top-1/2 transform -translate-y-1/2"
                                                    style={{ left: `${(i / 24) * 100}%` }}
                                                />
                                            ))}

                                            {/* Time labels - 24 hour timeline */}
                                            <div className="absolute -top-6 left-0 text-xs text-[#7A7F86]">6 PM</div>
                                            <div className="absolute -top-6 left-1/4 text-xs text-[#7A7F86]">12 AM</div>
                                            <div className="absolute -top-6 left-1/2 text-xs text-[#7A7F86]">6 AM</div>
                                            <div className="absolute -top-6 left-3/4 text-xs text-[#7A7F86]">12 PM</div>
                                            <div className="absolute -top-6 right-0 text-xs text-[#7A7F86]">6 PM</div>
                                        </div>

                                        {/* Sleep Session Bars */}
                                        {sleepSessions.map((session) => {
                                            if (!timelineRef.current) return null

                                            const timelineWidth = timelineRef.current.offsetWidth
                                            const startPos = timeToPixel(session.startTime, timelineWidth)
                                            const endPos = timeToPixel(session.endTime, timelineWidth)
                                            const width = Math.max(endPos - startPos, 40) // Minimum 40px width for better touch targets
                                            const isSelected = selectedSession === session.id

                                            return (
                                                <div
                                                    key={session.id}
                                                    className={`absolute top-1/2 transform -translate-y-1/2 h-6 rounded-lg border-2 transition-all duration-200 touch-manipulation ${
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
                                                        zIndex: isDragging && isSelected ? 1000 : (isSelected ? 100 : (session.type === 'main' ? 20 : 10)),
                                                    }}
                                                    onPointerDown={(e) => handleSessionPointerDown(e, session.id, 'move')}
                                                >
                                                    {/* Start resize handle */}
                                                    <div
                                                        className="absolute left-0 top-0 w-4 h-full cursor-col-resize opacity-30 hover:opacity-100 active:opacity-100 bg-white bg-opacity-30 rounded-l-lg transition-opacity touch-manipulation md:opacity-0 md:hover:opacity-100"
                                                        onPointerDown={(e) => handleSessionPointerDown(e, session.id, 'start')}
                                                    />

                                                    {/* Session label with time */}
                                                    {width > 80 && (
                                                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium pointer-events-none">
                                                            <div className="text-center">
                                                                <div className="font-semibold">
                                                                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                                </div>
                                                                <div className="text-[10px] opacity-80">
                                                                    {session.type === 'main' ? 'Sleep' : 'Nap'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* End resize handle */}
                                                    <div
                                                        className="absolute right-0 top-0 w-4 h-full cursor-col-resize opacity-30 hover:opacity-100 active:opacity-100 bg-white bg-opacity-30 rounded-r-lg transition-opacity touch-manipulation md:opacity-0 md:hover:opacity-100"
                                                        onPointerDown={(e) => handleSessionPointerDown(e, session.id, 'end')}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* All sessions details */}
                                    {sleepSessions.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-sm font-medium text-[#F3F4F6] mb-2">Sleep Sessions</div>
                                            {sleepSessions.map((session) => {
                                                const duration = calculateDuration(session.startTime, session.endTime)
                                                const isSelected = selectedSession === session.id

                                                return (
                                                    <div
                                                        key={session.id}
                                                        className={`p-3 rounded-lg border transition-all ${
                                                            isSelected
                                                                ? 'bg-[#0E0F13] border-[#2A8CEA]'
                                                                : 'bg-[#121318] border-[#212227] hover:border-[#2A2B31]'
                                                        }`}
                                                    >
                                                        <div className="space-y-3">
                                                            {/* Session header */}
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`w-3 h-3 rounded-full ${
                                                                    session.type === 'main' ? 'bg-[#2BD2FF]' : 'bg-[#9BE15D]'
                                                                }`} />
                                                                <span className="text-sm font-medium text-[#F3F4F6]">
                                                                    {session.type === 'main' ? 'Main Sleep' : 'Nap'}
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

                                                            {/* Editable time inputs */}
                                                            <div className="flex items-center space-x-4">
                                                                <div className="flex items-center space-x-2">
                                                                    <label className="text-xs text-[#A1A1AA]">Start:</label>
                                                                    <Input
                                                                        value={formatTime(session.startTime)}
                                                                        onChange={(e) => {
                                                                            const success = updateSessionTimeFromInput(session.id, 'start', e.target.value)
                                                                            if (!success) {
                                                                                // Could add error feedback here
                                                                            }
                                                                        }}
                                                                        className="w-20 h-7 text-xs bg-[#0E0F13] border-[#212227] text-[#F3F4F6]"
                                                                        placeholder="9:00 PM"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <label className="text-xs text-[#A1A1AA]">End:</label>
                                                                    <Input
                                                                        value={formatTime(session.endTime)}
                                                                        onChange={(e) => {
                                                                            const success = updateSessionTimeFromInput(session.id, 'end', e.target.value)
                                                                            if (!success) {
                                                                                // Could add error feedback here
                                                                            }
                                                                        }}
                                                                        className="w-20 h-7 text-xs bg-[#0E0F13] border-[#212227] text-[#F3F4F6]"
                                                                        placeholder="7:00 AM"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Action buttons */}
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
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
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
                                            Create a new nap session
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