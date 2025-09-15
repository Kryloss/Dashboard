"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Dumbbell, Footprints, Heart, Bike, FileText, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkoutStorage } from "@/lib/workout-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"

interface QuickLogDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onActivityLogged?: () => void
}

const workoutTypes = [
    {
        id: 'strength',
        name: 'Strength Training',
        description: 'Weight lifting and resistance training',
        icon: <Dumbbell className="w-6 h-6" />,
        color: 'text-[#9BE15D]'
    },
    {
        id: 'running',
        name: 'Running',
        description: 'Cardio and endurance training',
        icon: <Footprints className="w-6 h-6" />,
        color: 'text-[#FF2D55]'
    },
    {
        id: 'yoga',
        name: 'Yoga',
        description: 'Flexibility and mindfulness',
        icon: <Heart className="w-6 h-6" />,
        color: 'text-[#2BD2FF]'
    },
    {
        id: 'cycling',
        name: 'Cycling',
        description: 'Indoor and outdoor cycling',
        icon: <Bike className="w-6 h-6" />,
        color: 'text-[#FF375F]'
    }
]

export function QuickLogDialog({ open, onOpenChange, onActivityLogged }: QuickLogDialogProps) {
    const { user } = useAuth()
    const notifications = useNotifications()
    const [selectedType, setSelectedType] = useState<string>('')
    const [workoutName, setWorkoutName] = useState('')
    const [hours, setHours] = useState('')
    const [minutes, setMinutes] = useState('')
    const [date, setDate] = useState(() => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    })
    const [time, setTime] = useState(() => {
        const now = new Date()
        const timeStr = now.toTimeString().slice(0, 5)
        return timeStr
    })
    const [notes, setNotes] = useState('')
    const [isLogging, setIsLogging] = useState(false)

    const handleClose = () => {
        // Reset form
        setSelectedType('')
        setWorkoutName('')
        setHours('')
        setMinutes('')
        const today = new Date()
        setDate(today.toISOString().split('T')[0])
        const now = new Date()
        setTime(now.toTimeString().slice(0, 5))
        setNotes('')
        onOpenChange(false)
    }

    const handleLogWorkout = async () => {
        if (!selectedType || (!hours && !minutes)) return
        
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to log workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => {
                        handleClose()
                        window.location.href = '/auth/signin'
                    }
                }
            })
            return
        }

        setIsLogging(true)
        try {
            // Calculate duration in seconds
            const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)
            const durationSeconds = totalMinutes * 60

            // Combine date and time
            const completedAt = new Date(`${date}T${time}:00`).toISOString()

            // Create the workout activity
            const activity = {
                workoutType: selectedType as 'strength' | 'running' | 'yoga' | 'cycling',
                name: workoutName || `${workoutTypes.find(w => w.id === selectedType)?.name}`,
                exercises: [], // Empty for quick log
                durationSeconds,
                notes,
                completedAt
            }

            await WorkoutStorage.saveWorkoutActivity(activity)

            // Success notification
            notifications.success('Activity logged', {
                description: `${workoutTypes.find(w => w.id === selectedType)?.name} saved`,
                duration: 3000
            })

            // Show quick log tip for first usage
            const quickLogCount = localStorage.getItem('quick-log-count')
            const count = parseInt(quickLogCount || '0') + 1
            localStorage.setItem('quick-log-count', count.toString())

            if (count === 1) {
                setTimeout(() => {
                    notifications.info('Quick tip', {
                        description: 'Perfect for logging past workouts',
                        duration: 3000
                    })
                }, 2000)
            }

            // Small delay to allow events to propagate before closing
            setTimeout(() => {
                // Call the callback to refresh activities
                if (onActivityLogged) {
                    onActivityLogged()
                }

                handleClose()
            }, 100)
        } catch (error) {
            console.error('Error logging workout:', error)
            notifications.error('Log failed', {
                description: 'Could not save activity'
            })
        } finally {
            setIsLogging(false)
        }
    }

    const isValid = selectedType && (hours || minutes) && date && time

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[14px] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#F3F4F6]" />
                        </div>
                        <div>
                            <DialogTitle>Quick Log Workout</DialogTitle>
                            <DialogDescription>
                                Log a completed workout with custom duration and time
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Workout Type Selection */}
                    <div>
                        <Label className="text-sm font-medium text-[#F3F4F6] mb-3 block">Workout Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {workoutTypes.map((workout) => (
                                <button
                                    key={workout.id}
                                    onClick={() => setSelectedType(workout.id)}
                                    className={cn(
                                        "flex items-center space-x-3 p-3 rounded-[12px] border transition-all text-left",
                                        "bg-[#0E0F13] border-[#212227]",
                                        "hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
                                        selectedType === workout.id && "border-[#2A8CEA] bg-[rgba(42,140,234,0.10)]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-[8px] flex items-center justify-center",
                                        "bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]",
                                        workout.color
                                    )}>
                                        {workout.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-[#F3F4F6] text-sm">
                                            {workout.name}
                                        </h3>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Workout Name */}
                    <div>
                        <Label className="text-sm font-medium text-[#F3F4F6] mb-2 block">
                            Workout Name (Optional)
                        </Label>
                        <Input
                            value={workoutName}
                            onChange={(e) => setWorkoutName(e.target.value)}
                            placeholder={selectedType ? `${workoutTypes.find(w => w.id === selectedType)?.name}` : "Enter workout name"}
                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#6B7280] focus:border-[#2A8CEA] focus:ring-[#2A8CEA]"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <Label className="text-sm font-medium text-[#F3F4F6] mb-2 block">Duration</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-[#A1A1AA] mb-1 block">Hours</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    placeholder="0"
                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#6B7280] focus:border-[#2A8CEA] focus:ring-[#2A8CEA]"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-[#A1A1AA] mb-1 block">Minutes</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    placeholder="30"
                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#6B7280] focus:border-[#2A8CEA] focus:ring-[#2A8CEA]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-sm font-medium text-[#F3F4F6] mb-2 flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Date</span>
                            </Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] focus:border-[#2A8CEA] focus:ring-[#2A8CEA]"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-[#F3F4F6] mb-2 flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Time</span>
                            </Label>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] focus:border-[#2A8CEA] focus:ring-[#2A8CEA]"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label className="text-sm font-medium text-[#F3F4F6] mb-2 block">
                            Notes (Optional)
                        </Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this workout..."
                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#6B7280] focus:border-[#2A8CEA] focus:ring-[#2A8CEA] resize-none h-20"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4 border-t border-[#212227]">
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isLogging}
                            className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLogWorkout}
                            disabled={!isValid || isLogging}
                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLogging ? 'Logging...' : 'Log Workout'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}