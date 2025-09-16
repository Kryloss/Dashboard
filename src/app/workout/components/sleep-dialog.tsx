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
    // const [dragOffset, setDragOffset] = useState(0) // Unused in circular interface
    const timelineRef = useRef<HTMLDivElement>(null)
    const dragStartPos = useRef<{ x: number; y: number } | null>(null)

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

    // Calculate duration properly for overnight sessions
    const calculateSessionDuration = (start: number, end: number) => {
        if (end >= start) {
            return end - start // Same day
        } else {
            return (24 * 60) - start + end // Overnight session
        }
    }

    // Convert time (in minutes) to angle in radians (12 AM at top = -π/2)
    const timeToAngle = (minutes: number): number => {
        // Convert minutes to hours (0-24)
        const hours = minutes / 60
        // 12 AM = 0 hours = top of circle = -π/2 radians
        // Each hour = π/6 radians (360°/24 hours = 15° = π/12, but we want full circle in 12 hours)
        // Actually, we want 24 hours around full circle, so each hour = 2π/24 = π/12
        const angle = (hours * Math.PI / 12) - (Math.PI / 2) // Start at top (-π/2)
        return angle
    }

    // Convert mouse position to angle relative to oval center
    const mouseToAngle = (mouseX: number, mouseY: number, centerX: number, centerY: number): number => {
        const deltaX = mouseX - centerX
        const deltaY = mouseY - centerY

        // Normalize for oval shape (140x100 ratio = 1.4)
        const normalizedX = deltaX
        const normalizedY = deltaY * 1.4 // Scale Y to match oval aspect ratio

        return Math.atan2(normalizedY, normalizedX)
    }

    // Convert angle to time in minutes
    const angleToTime = (angle: number): number => {
        // Normalize angle to 0-2π range
        let normalizedAngle = angle + (Math.PI / 2) // Offset so 12 AM is at 0
        if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI
        if (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI

        // Convert to hours (0-24)
        const hours = (normalizedAngle / Math.PI) * 12 // Full circle = 24 hours

        // Convert to minutes and snap to 5-minute intervals for better PC control
        const minutes = hours * 60
        return Math.round(minutes / 5) * 5
    }

    // Convert time to x,y coordinates on oval (commented out as unused)
    // const timeToCoordinates = (minutes: number, centerX: number, centerY: number, radiusX: number, radiusY: number): {x: number, y: number} => {
    //     const angle = timeToAngle(minutes)
    //     return {
    //         x: centerX + radiusX * Math.cos(angle),
    //         y: centerY + radiusY * Math.sin(angle)
    //     }
    // }

    // Handle clock click/tap - only select sessions, no creation
    const handleClockPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!timelineRef.current || isDragging) return

        const rect = timelineRef.current.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const clickY = event.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Convert click position to time
        const clickAngle = mouseToAngle(clickX, clickY, centerX, centerY)
        // const clickTime = angleToTime(clickAngle) // Unused for now

        // Check if click is near the oval timeline (where sessions are now positioned)
        const deltaX = clickX - centerX
        const deltaY = clickY - centerY
        const normalizedX = deltaX
        const normalizedY = deltaY * 1.4 // Account for oval aspect ratio
        const distanceFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)

        // Only check for sessions if click is near the timeline (140±20 radius tolerance)
        const isNearTimeline = distanceFromCenter >= 120 && distanceFromCenter <= 160

        // Check if clicking on an existing session (within the timeline area)
        const clickedSession = isNearTimeline ? sleepSessions.find(session => {
            // Check if click is within the arc of this session
            const startAngle = timeToAngle(session.startTime)
            const endAngle = timeToAngle(session.endTime)

            // Handle overnight sessions (arc crosses 12 AM)
            let isInArc = false
            if (endAngle > startAngle) {
                // Normal arc
                isInArc = clickAngle >= startAngle && clickAngle <= endAngle
            } else {
                // Overnight arc (crosses 12 AM)
                isInArc = clickAngle >= startAngle || clickAngle <= endAngle
            }

            return isInArc
        }) : null

        if (clickedSession) {
            setSelectedSession(clickedSession.id)
        } else {
            setSelectedSession(null)
        }
    }

    // Handle mouse/touch down on session for dragging
    const handleSessionPointerDown = (event: React.PointerEvent, sessionId: string, dragMode: 'start' | 'end' | 'move') => {
        event.stopPropagation()
        event.preventDefault()
        if (!timelineRef.current) return

        const session = sleepSessions.find(s => s.id === sessionId)
        if (!session) return

        // Record initial drag position for dead zone detection
        const rect = timelineRef.current.getBoundingClientRect()
        dragStartPos.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }

        setIsDragging(true)
        setDragType(dragMode)
        setSelectedSession(sessionId)

        // In circular interface, we don't need to track drag offset
        // Drag handling is done purely through angle calculations

        // Capture pointer for better mobile experience
        if (event.currentTarget.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId)
        }
    }


    // Throttle function for performance optimization
    const throttleRef = useRef<number | null>(null)

    // Handle pointer move for dragging - circular version with touch support
    const handlePointerMove = useCallback((event: PointerEvent) => {
        if (!isDragging || !dragType || !selectedSession || !timelineRef.current) return

        // Throttle pointer events for better performance
        if (throttleRef.current) {
            cancelAnimationFrame(throttleRef.current)
        }

        throttleRef.current = requestAnimationFrame(() => {
            if (!timelineRef.current) return

            const rect = timelineRef.current.getBoundingClientRect()
            const centerX = rect.width / 2
            const centerY = rect.height / 2

            // Get raw pointer position
            let pointerX = event.clientX - rect.left
            let pointerY = event.clientY - rect.top

            // Dead zone check - only apply drag if moved enough from start position
            if (dragStartPos.current) {
                const moveDistance = Math.sqrt(
                    Math.pow(pointerX - dragStartPos.current.x, 2) +
                    Math.pow(pointerY - dragStartPos.current.y, 2)
                )

                // Require minimum 8px movement before applying drag (prevents micro-movements)
                if (moveDistance < 8) {
                    return
                }
            }

            // Constrain pointer to reasonable bounds around the clock
            // This prevents erratic behavior when mouse goes far outside
            const maxDistanceX = centerX + 160 // Allow some margin beyond the oval
            const maxDistanceY = centerY + 120
            const minDistanceX = centerX - 160
            const minDistanceY = centerY - 120

            pointerX = Math.max(minDistanceX, Math.min(maxDistanceX, pointerX))
            pointerY = Math.max(minDistanceY, Math.min(maxDistanceY, pointerY))

            // For better PC experience, ensure minimum distance from center
            // This prevents issues when cursor is too close to center
            const deltaX = pointerX - centerX
            const deltaY = pointerY - centerY
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            const minDistance = 30 // Minimum distance from center

            if (distance < minDistance && distance > 0) {
                const scale = minDistance / distance
                pointerX = centerX + deltaX * scale
                pointerY = centerY + deltaY * scale
            }

            // Convert pointer position to angle and then to time
            const pointerAngle = mouseToAngle(pointerX, pointerY, centerX, centerY)
            const pointerTime = angleToTime(pointerAngle)

            setSleepSessions(prev => prev.map(session => {
                if (session.id !== selectedSession) return session

                const duration = calculateSessionDuration(session.startTime, session.endTime)
                const newSession = { ...session }

                switch (dragType) {
                    case 'start': {
                        // Calculate minimum duration considering overnight sessions
                        const newStartTime = pointerTime
                        const minDuration = 15 // minimum 15 minutes

                        // Check if this would create a valid duration
                        const testDuration = calculateSessionDuration(newStartTime, session.endTime)

                        if (testDuration >= minDuration) {
                            newSession.startTime = newStartTime
                        }
                        break
                    }
                    case 'end': {
                        const newEndTime = pointerTime
                        const minDuration = 15 // minimum 15 minutes

                        // Check if this would create a valid duration
                        const testDuration = calculateSessionDuration(session.startTime, newEndTime)

                        if (testDuration >= minDuration) {
                            newSession.endTime = newEndTime
                        }
                        break
                    }
                    case 'move': {
                        // Move entire session while preserving duration
                        const newStartTime = pointerTime

                        // Calculate new end time based on preserved duration
                        let newEndTime = newStartTime + duration

                        // Handle wrap-around for 24-hour period
                        if (newEndTime >= 24 * 60) {
                            newEndTime -= 24 * 60
                        }
                        if (newEndTime < 0) {
                            newEndTime += 24 * 60
                        }

                        newSession.startTime = newStartTime
                        newSession.endTime = newEndTime
                        break
                    }
                }

                return newSession
            }))
        })
    }, [isDragging, dragType, selectedSession])

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

                    // Check for overlap considering overnight sessions
                    const sessionOverlapsTime = (s1Start: number, s1End: number, s2Start: number, s2End: number) => {
                        // Handle same-day sessions
                        if (s1End >= s1Start && s2End >= s2Start) {
                            return !(s1End <= s2Start || s1Start >= s2End)
                        }

                        // Handle overnight sessions - more complex overlap logic needed
                        // For now, be conservative and assume potential overlap
                        return true
                    }

                    return sessionOverlapsTime(
                        draggedSession.startTime, draggedSession.endTime,
                        session.startTime, session.endTime
                    )
                })

                if (hasOverlap) {
                    // Find a safe position for the session
                    const sortedSessions = prev
                        .filter(s => s.id !== selectedSession)
                        .sort((a, b) => a.startTime - b.startTime)

                    const duration = calculateSessionDuration(draggedSession.startTime, draggedSession.endTime)
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
        dragStartPos.current = null // Reset drag start position
        // setDragOffset(0) // Not needed in circular interface
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
                            <Label className="text-sm font-medium text-[#F3F4F6]">Sleep Clock (24 Hour)</Label>

                            {/* Oval Clock Interface */}
                            <div className="relative bg-[#121318] border border-[#212227] rounded-lg p-8">
                                {/* Instructions */}
                                <div className="text-xs text-[#A1A1AA] mb-6 text-center">
                                    Click and drag around the clock to set sleep times • AM at top, PM at bottom
                                </div>

                                {/* Clock container */}
                                <div
                                    ref={timelineRef}
                                    className={`relative w-full aspect-square max-w-md mx-auto select-none touch-manipulation ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'
                                        }`}
                                    onPointerDown={handleClockPointerDown}
                                >
                                    {/* Clock face - oval shape */}
                                    <svg className="w-full h-full" viewBox="0 0 300 300">
                                        {/* Outer clock ring - squared oval */}
                                        <ellipse
                                            cx="150"
                                            cy="150"
                                            rx="140"
                                            ry="100"
                                            fill="none"
                                            stroke="#2A2B31"
                                            strokeWidth="8"
                                        />

                                        {/* Hour markers */}
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const angle = (i * Math.PI) / 12 - Math.PI / 2 // Start at top (12 AM)
                                            const isMainHour = i % 6 === 0 // 12 AM, 6 AM, 12 PM, 6 PM
                                            const outerRadiusX = 140
                                            const outerRadiusY = 100
                                            const innerRadiusX = isMainHour ? 120 : 130
                                            const innerRadiusY = isMainHour ? 85 : 90

                                            const x1 = 150 + outerRadiusX * Math.cos(angle)
                                            const y1 = 150 + outerRadiusY * Math.sin(angle)
                                            const x2 = 150 + innerRadiusX * Math.cos(angle)
                                            const y2 = 150 + innerRadiusY * Math.sin(angle)

                                            return (
                                                <line
                                                    key={i}
                                                    x1={x1}
                                                    y1={y1}
                                                    x2={x2}
                                                    y2={y2}
                                                    stroke="#4A4B51"
                                                    strokeWidth={isMainHour ? "3" : "1"}
                                                />
                                            )
                                        })}

                                        {/* Time labels */}
                                        {[
                                            { time: '12 AM', angle: -Math.PI / 2, hours: 0 },
                                            { time: '6 AM', angle: 0, hours: 6 },
                                            { time: '12 PM', angle: Math.PI / 2, hours: 12 },
                                            { time: '6 PM', angle: Math.PI, hours: 18 }
                                        ].map(({ time, angle }) => {
                                            const radiusX = 110 // Slightly outside the oval on X axis
                                            const radiusY = 80  // Shorter on Y axis for oval shape
                                            const x = 150 + radiusX * Math.cos(angle)
                                            const y = 150 + radiusY * Math.sin(angle)

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

                                        {/* Sleep session arcs */}
                                        {sleepSessions.map((session) => {
                                            const startAngle = timeToAngle(session.startTime)
                                            const endAngle = timeToAngle(session.endTime)
                                            const isSelected = selectedSession === session.id
                                            const radiusX = 140 // Place sessions on the oval timeline itself
                                            const radiusY = 100 // Place sessions on the oval timeline itself
                                            const strokeWidth = 16 // Prominent on timeline

                                            // Calculate arc path for oval
                                            const startX = 150 + radiusX * Math.cos(startAngle)
                                            const startY = 150 + radiusY * Math.sin(startAngle)
                                            const endX = 150 + radiusX * Math.cos(endAngle)
                                            const endY = 150 + radiusY * Math.sin(endAngle)

                                            // Generate path that follows the exact oval timeline using small line segments
                                            const generateOvalArcPath = (startAngle: number, endAngle: number, rx: number, ry: number) => {
                                                // Calculate the angular span
                                                let angleDiff = endAngle - startAngle
                                                if (angleDiff < 0) angleDiff += 2 * Math.PI // Handle overnight

                                                // Create many small line segments to trace the exact oval outline
                                                const stepAngle = Math.PI / 72 // 2.5 degrees per step for very smooth curve
                                                const numSteps = Math.ceil(angleDiff / stepAngle)
                                                const actualStepAngle = angleDiff / numSteps

                                                const pathParts = [`M ${150 + rx * Math.cos(startAngle)} ${150 + ry * Math.sin(startAngle)}`]

                                                // Create line segments that exactly follow the oval perimeter
                                                for (let i = 1; i <= numSteps; i++) {
                                                    const currentAngle = startAngle + (actualStepAngle * i)
                                                    const x = 150 + rx * Math.cos(currentAngle)
                                                    const y = 150 + ry * Math.sin(currentAngle)
                                                    pathParts.push(`L ${x} ${y}`)
                                                }

                                                return pathParts.join(' ')
                                            }

                                            const pathData = generateOvalArcPath(startAngle, endAngle, radiusX, radiusY)

                                            return (
                                                <g key={session.id}>
                                                    {/* Session arc */}
                                                    <path
                                                        d={pathData}
                                                        fill="none"
                                                        stroke={session.type === 'main' ? '#2BD2FF' : '#9BE15D'}
                                                        strokeWidth={strokeWidth}
                                                        strokeLinecap="round"
                                                        className={`transition-all duration-200 ${isSelected ? 'drop-shadow-lg' : ''
                                                            }`}
                                                        style={{
                                                            filter: isSelected ? 'drop-shadow(0 0 8px rgba(43, 210, 255, 0.5))' : '',
                                                            strokeOpacity: isSelected ? 1 : 0.8
                                                        }}
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation()
                                                            handleSessionPointerDown(e, session.id, 'move')
                                                        }}
                                                    />

                                                    {/* Start handle */}
                                                    <circle
                                                        cx={startX}
                                                        cy={startY}
                                                        r="10"
                                                        fill={session.type === 'main' ? '#2BD2FF' : '#9BE15D'}
                                                        stroke="#121318"
                                                        strokeWidth="2"
                                                        className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation()
                                                            handleSessionPointerDown(e, session.id, 'start')
                                                        }}
                                                    />

                                                    {/* End handle */}
                                                    <circle
                                                        cx={endX}
                                                        cy={endY}
                                                        r="10"
                                                        fill={session.type === 'main' ? '#2BD2FF' : '#9BE15D'}
                                                        stroke="#121318"
                                                        strokeWidth="2"
                                                        className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation()
                                                            handleSessionPointerDown(e, session.id, 'end')
                                                        }}
                                                    />

                                                    {/* Session time label */}
                                                    {(() => {
                                                        // Calculate angle difference for overnight sessions
                                                        let angleDiff = endAngle - startAngle
                                                        if (angleDiff < 0) angleDiff += 2 * Math.PI // Handle overnight

                                                        const midAngle = startAngle + (angleDiff / 2)
                                                        const labelRadiusX = 120 // Inside the oval timeline since sessions are now on the border
                                                        const labelRadiusY = 85  // Inside the oval timeline
                                                        const labelX = 150 + labelRadiusX * Math.cos(midAngle)
                                                        const labelY = 150 + labelRadiusY * Math.sin(midAngle)

                                                        return (
                                                            <text
                                                                x={labelX}
                                                                y={labelY}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                                className="text-xs font-medium fill-white pointer-events-none"
                                                            >
                                                                <tspan x={labelX} dy="-0.3em">
                                                                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                                </tspan>
                                                                <tspan x={labelX} dy="1.2em" className="text-[10px] opacity-80">
                                                                    {session.type === 'main' ? 'Sleep' : 'Nap'}
                                                                </tspan>
                                                            </text>
                                                        )
                                                    })()}
                                                </g>
                                            )
                                        })}
                                    </svg>
                                </div>
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
                                                className={`p-3 rounded-lg border transition-all ${isSelected
                                                    ? 'bg-[#0E0F13] border-[#2A8CEA]'
                                                    : 'bg-[#121318] border-[#212227] hover:border-[#2A2B31]'
                                                    }`}
                                            >
                                                <div className="space-y-3">
                                                    {/* Session header */}
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-3 h-3 rounded-full ${session.type === 'main' ? 'bg-[#2BD2FF]' : 'bg-[#9BE15D]'
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