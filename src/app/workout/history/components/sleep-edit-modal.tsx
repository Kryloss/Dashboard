"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, X, Plus } from "lucide-react"
import { SleepData, SleepSession } from "@/lib/user-data-storage"

interface SleepEditModalProps {
    sleepData: SleepData | null
    onClose: () => void
    onSave: (sleepData: SleepData) => void
}

export function SleepEditModal({ sleepData, onClose, onSave }: SleepEditModalProps) {
    const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([])
    const [qualityRating, setQualityRating] = useState(3)

    useEffect(() => {
        if (sleepData) {
            setSleepSessions(sleepData.sessions || [])
            setQualityRating(sleepData.qualityRating || 3)
        }
    }, [sleepData])

    // Calculate duration helper
    const calculateDuration = (startTime: string, endTime: string) => {
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)

        const startMinutes = startHour * 60 + startMin
        let endMinutes = endHour * 60 + endMin

        // Handle overnight sleep
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60
        }

        const totalMinutes = endMinutes - startMinutes
        return { totalMinutes, hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
    }

    // Add new nap session
    const addNapSession = () => {
        if (sleepSessions.length >= 3) return // Limit to 3 total sessions

        const newNap: SleepSession = {
            id: Date.now().toString(),
            type: 'nap',
            startTime: '14:00',
            endTime: '15:00',
            wakeUps: 0
        }
        setSleepSessions([...sleepSessions, newNap])
    }

    // Remove session
    const removeSession = (id: string) => {
        setSleepSessions(sleepSessions.filter(session => session.id !== id))
    }

    // Update session time
    const updateSessionTime = (id: string, field: 'startTime' | 'endTime', value: string) => {
        setSleepSessions(sleepSessions.map(session =>
            session.id === id ? { ...session, [field]: value } : session
        ))
    }

    // Update session wake-ups
    const updateSessionWakeUps = (id: string, wakeUps: number) => {
        setSleepSessions(sleepSessions.map(session =>
            session.id === id ? { ...session, wakeUps } : session
        ))
    }

    const handleSave = () => {
        if (!sleepData || sleepSessions.length === 0) return

        const totalSleep = sleepSessions.reduce((total, session) => {
            const duration = calculateDuration(session.startTime, session.endTime)
            return total + duration.totalMinutes
        }, 0)

        const updatedSleepData: SleepData = {
            ...sleepData,
            sessions: sleepSessions,
            totalMinutes: totalSleep,
            qualityRating,
            totalWakeUps: sleepSessions.reduce((total, session) => total + session.wakeUps, 0)
        }

        onSave(updatedSleepData)
        onClose()
    }

    if (!sleepData) return null

    return (
        <Dialog open={!!sleepData} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#0E0F13] border-[#212227] text-[#F3F4F6]">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center justify-between text-base font-semibold text-[#F3F4F6]">
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] rounded-lg flex items-center justify-center">
                                <Moon className="w-3 h-3 text-white" />
                            </div>
                            <span>Edit sleep session</span>
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
                                                    className="bg-[#161B22] border-[#212227] text-[#F3F4F6] text-sm h-8"
                                                    style={{ colorScheme: 'dark' }}
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
                                                    className="bg-[#161B22] border-[#212227] text-[#F3F4F6] text-sm h-8"
                                                    style={{ colorScheme: 'dark' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <Label className="text-xs text-[#A1A1AA] mb-1">
                                                Wake-ups
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="20"
                                                value={session.wakeUps}
                                                onChange={(e) => updateSessionWakeUps(session.id, parseInt(e.target.value) || 0)}
                                                className="bg-[#161B22] border-[#212227] text-[#F3F4F6] text-sm h-8"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Nap Button */}
                            {sleepSessions.length < 3 && (
                                <Button
                                    onClick={addNapSession}
                                    variant="outline"
                                    className="w-full bg-transparent border-[#212227] text-[#A1A1AA] hover:bg-[#161B22] hover:text-[#F3F4F6] hover:border-[#2A2B31]"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add nap
                                </Button>
                            )}
                        </div>

                        {/* Sleep Quality */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#F3F4F6]">Sleep quality</Label>
                            <Select value={qualityRating.toString()} onValueChange={(value) => setQualityRating(parseInt(value))}>
                                <SelectTrigger className="bg-[#161B22] border-[#212227] text-[#F3F4F6]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#161B22] border-[#212227]">
                                    <SelectItem value="1" className="text-[#F3F4F6] focus:bg-[#2A2B31] focus:text-[#F3F4F6]">Poor</SelectItem>
                                    <SelectItem value="2" className="text-[#F3F4F6] focus:bg-[#2A2B31] focus:text-[#F3F4F6]">Fair</SelectItem>
                                    <SelectItem value="3" className="text-[#F3F4F6] focus:bg-[#2A2B31] focus:text-[#F3F4F6]">Good</SelectItem>
                                    <SelectItem value="4" className="text-[#F3F4F6] focus:bg-[#2A2B31] focus:text-[#F3F4F6]">Excellent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </ScrollArea>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-[#212227]">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="bg-transparent border-[#212227] text-[#A1A1AA] hover:bg-[#161B22] hover:text-[#F3F4F6]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-[#2A8CEA] hover:bg-[#2563EB] text-white"
                    >
                        Save changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}