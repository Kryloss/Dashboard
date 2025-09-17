"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { UserDataStorage } from "@/lib/user-data-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Moon, Smile, Meh, Frown, Plus, X, Clock } from "lucide-react"

interface SleepDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSleepLogged?: () => void
}

interface SleepSession {
    id: string
    startTime: string // time in HH:MM format (24-hour)
    endTime: string // time in HH:MM format (24-hour)
    wakeUps: number
    type: 'main' | 'nap'
}

export function SleepDialog({ open, onOpenChange, onSleepLogged }: SleepDialogProps) {
    const { user, supabase } = useAuth()
    const notifications = useNotifications()
    const [isLoading, setIsLoading] = useState(false)
    const [sleepQuality, setSleepQuality] = useState(3) // 1-5 rating
    const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([])

    // Sleep quality icons
    const qualityIcons = [Frown, Meh, Smile, Smile]
    const qualityLabels = ['Poor', 'Fair', 'Good', 'Excellent']
    const qualityColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400']

    // Load user's sleep goal to set default session
    const loadDefaultSleepSession = useCallback(async () => {
        if (!user || !supabase) return

        try {
            UserDataStorage.initialize(user, supabase)
            const goals = await UserDataStorage.getUserGoals()
            const sleepHours = goals?.sleepHours || 8.0

            // Default sleep from 11 PM to (11 PM + sleep hours)
            const endHour = Math.min(23 + sleepHours, 12) // Cap at 12 PM
            const endTime = endHour >= 24 ? `${String(Math.floor(endHour) - 24).padStart(2, '0')}:00` : `${String(Math.floor(endHour)).padStart(2, '0')}:00`

            setSleepSessions([{
                id: 'main',
                startTime: '23:00',
                endTime: endTime,
                wakeUps: 0,
                type: 'main'
            }])
        } catch (error) {
            console.error('Error loading sleep goal:', error)
            // Fallback to 8 hours (11 PM to 7 AM)
            setSleepSessions([{
                id: 'main',
                startTime: '23:00',
                endTime: '07:00',
                wakeUps: 0,
                type: 'main'
            }])
        }
    }, [user, supabase])

    // Load existing sleep data for today
    const loadExistingSleepData = useCallback(async () => {
        if (!user || !supabase) return

        try {
            UserDataStorage.initialize(user, supabase)
            const todayDate = new Date().toISOString().split('T')[0]
            const existingSleepData = await UserDataStorage.getSleepData(todayDate)

            if (existingSleepData && existingSleepData.sessions.length > 0) {
                // Load existing data for today
                setSleepSessions(existingSleepData.sessions)
                setSleepQuality(existingSleepData.qualityRating)
            } else {
                // No existing data, load default session
                setSleepSessions([])
                loadDefaultSleepSession()
                setSleepQuality(3)
            }
        } catch (error) {
            console.error('Error loading existing sleep data:', error)
            // Fallback to default session
            setSleepSessions([])
            loadDefaultSleepSession()
            setSleepQuality(3)
        }
    }, [user, supabase, loadDefaultSleepSession])

    useEffect(() => {
        if (open) {
            loadExistingSleepData()
        }
    }, [open, loadExistingSleepData])

    // Convert time string to minutes
    const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
    }

    // Calculate duration in hours and minutes
    const calculateDuration = (start: string, end: string) => {
        const startMinutes = timeToMinutes(start)
        const endMinutes = timeToMinutes(end)
        let duration = endMinutes - startMinutes
        if (duration < 0) duration += 24 * 60 // Handle overnight sleep

        const hours = Math.floor(duration / 60)
        const minutes = duration % 60
        return { hours, minutes, totalMinutes: duration }
    }

    // Check for overlapping sleep sessions
    const hasOverlaps = () => {
        for (let i = 0; i < sleepSessions.length; i++) {
            for (let j = i + 1; j < sleepSessions.length; j++) {
                const session1 = sleepSessions[i]
                const session2 = sleepSessions[j]

                const start1 = timeToMinutes(session1.startTime)
                const end1 = timeToMinutes(session1.endTime)
                const start2 = timeToMinutes(session2.startTime)
                const end2 = timeToMinutes(session2.endTime)

                // Normalize for overnight sessions
                const normalizeTime = (start: number, end: number) => {
                    if (end < start) end += 24 * 60
                    return { start, end }
                }

                const norm1 = normalizeTime(start1, end1)
                const norm2 = normalizeTime(start2, end2)

                // Check for overlap
                if (norm1.start < norm2.end && norm2.start < norm1.end) {
                    return true
                }
            }
        }
        return false
    }

    // Add new nap session (limit to 3 total sessions including main)
    const addNap = () => {
        if (sleepSessions.length >= 3) return // Limit to 3 total sessions

        const newNap: SleepSession = {
            id: `nap-${Date.now()}`,
            startTime: '14:00',
            endTime: '15:00',
            wakeUps: 0,
            type: 'nap'
        }
        setSleepSessions([...sleepSessions, newNap])
    }

    // Remove session (now allows removing main sleep session)
    const removeSession = (id: string) => {
        setSleepSessions(sleepSessions.filter(session => session.id !== id))
    }

    // Update session time
    const updateSessionTime = (id: string, field: 'startTime' | 'endTime', value: string) => {
        setSleepSessions(sleepSessions.map(session =>
            session.id === id ? { ...session, [field]: value } : session
        ))
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
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="flex items-center justify-between text-base font-semibold text-[#F3F4F6]">
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] rounded-lg flex items-center justify-center">
                                <Moon className="w-3 h-3 text-white" />
                            </div>
                            <span>Log sleep</span>
                        </div>
                        <div className="text-sm font-medium text-[#F3F4F6] mr-8">
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
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[50vh]">
                    <div className="px-4 pb-4 space-y-4">

                        {/* Sleep Sessions */}
                        <div className="space-y-3">
                            <div className="space-y-2">
                                {sleepSessions.map((session) => (
                                    <div key={session.id} className="bg-[#0E0F13] border border-[#212227] rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-[#F3F4F6] capitalize">
                                                {session.type}
                                            </span>
                                            <Button
                                                onClick={() => removeSession(session.id)}
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-[#A1A1AA] hover:text-red-400"
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-[#A1A1AA] mb-1">
                                                    From
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={session.startTime}
                                                    onChange={(e) => updateSessionTime(session.id, 'startTime', e.target.value)}
                                                    className="bg-[#161B22] border-[#212227] text-[#F3F4F6] text-sm h-8 [&::-webkit-calendar-picker-indicator]:filter-none [&::-webkit-calendar-picker-indicator]:opacity-70"
                                                    style={{
                                                        colorScheme: 'dark'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-[#A1A1AA] mb-1">
                                                    To
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={session.endTime}
                                                    onChange={(e) => updateSessionTime(session.id, 'endTime', e.target.value)}
                                                    className="bg-[#161B22] border-[#212227] text-[#F3F4F6] text-sm h-8 [&::-webkit-calendar-picker-indicator]:filter-none [&::-webkit-calendar-picker-indicator]:opacity-70"
                                                    style={{
                                                        colorScheme: 'dark'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {hasOverlaps() && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                                    <span className="text-xs text-red-400">Sleep times overlap. Please adjust times.</span>
                                </div>
                            )}
                        </div>

                        {/* Sleep Quality Rating */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-[#F3F4F6]">How did you sleep?</Label>
                                <Button
                                    onClick={addNap}
                                    size="sm"
                                    variant="outline"
                                    disabled={sleepSessions.length >= 3}
                                    className="h-8 w-8 p-0 border-[#212227] text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center justify-center gap-6">
                                {qualityIcons.map((IconComponent, index) => {
                                    const rating = index + 1
                                    return (
                                        <button
                                            key={rating}
                                            onClick={() => setSleepQuality(rating)}
                                            className={`flex flex-col items-center space-y-2 p-4 rounded-lg transition-all w-20 h-20 ${sleepQuality === rating
                                                ? 'bg-[#2A8CEA]/20 border border-[#2A8CEA]/50'
                                                : 'hover:bg-[rgba(255,255,255,0.04)]'
                                                }`}
                                        >
                                            <IconComponent className={`w-8 h-8 ${sleepQuality === rating
                                                ? qualityColors[index]
                                                : 'text-[#A1A1AA]'
                                                }`} />
                                            <span className="text-xs text-[#A1A1AA]">{qualityLabels[index]}</span>
                                        </button>
                                    )
                                })}
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
                                disabled={isLoading || hasOverlaps()}
                                className="flex-1 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white border border-[rgba(59,130,246,0.35)] shadow-[0_4px_16px_rgba(59,130,246,0.28)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? 'Saving...' : 'Log sleep'}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}