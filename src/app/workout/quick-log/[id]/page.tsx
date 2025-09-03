"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { X, Plus, GripVertical, Edit3, Check, X as XIcon, Calendar, Clock } from "lucide-react"
import { WorkoutStorage, WorkoutExercise } from "@/lib/workout-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"

// Use WorkoutExercise from storage
type Exercise = WorkoutExercise

interface QuickLogPageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ type?: string; template?: string }>
}

export default function QuickLogPage({ params, searchParams }: QuickLogPageProps) {
    const [workoutId, setWorkoutId] = useState<string>('')
    const [workoutType, setWorkoutType] = useState<string>('strength')
    const [templateId, setTemplateId] = useState<string>('')
    const router = useRouter()
    const { user, supabase } = useAuth()
    const notifications = useNotifications()
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [showAddExercise, setShowAddExercise] = useState(false)
    const [newExerciseName, setNewExerciseName] = useState("")

    // Duration state (hours and minutes)
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)

    // Workout name editing
    const [workoutName, setWorkoutName] = useState<string>("")
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempWorkoutName, setTempWorkoutName] = useState("")

    // Date/Time dialog for logging
    const [showDateTimeDialog, setShowDateTimeDialog] = useState(false)
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    })
    const [selectedTime, setSelectedTime] = useState(() => {
        const now = new Date()
        return now.toTimeString().slice(0, 5)
    })

    // Cancel/Log confirmation dialog
    const [showQuitDialog, setShowQuitDialog] = useState(false)

    // Resolve params and searchParams Promises
    useEffect(() => {
        const resolveParams = async () => {
            const resolvedParams = await params
            const resolvedSearchParams = await searchParams
            setWorkoutId(resolvedParams.id)
            setWorkoutType(resolvedSearchParams.type || 'strength')
            setTemplateId(resolvedSearchParams.template || '')
        }
        resolveParams()
    }, [params, searchParams])

    // Initialize workout and load template if specified
    useEffect(() => {
        const initializeQuickLog = async () => {
            if (!user || !supabase || !workoutId) {
                console.error('No user, supabase client, or workoutId available')
                return
            }

            // Initialize storage with user context
            WorkoutStorage.initialize(user, supabase)

            // Load template if specified
            if (templateId) {
                try {
                    const templates = await WorkoutStorage.getTemplates(workoutType as 'strength' | 'running' | 'yoga' | 'cycling')
                    const template = templates.find(t => t.id === templateId)
                    if (template) {
                        setWorkoutName(template.name)
                        setExercises(template.exercises || [])
                    } else {
                        setWorkoutName("Quick Log Workout")
                    }
                } catch (error) {
                    console.error('Error loading template:', error)
                    setWorkoutName("Quick Log Workout")
                }
            } else {
                // Set default workout name based on type
                const typeNames = {
                    'strength': 'Strength Training',
                    'running': 'Running',
                    'yoga': 'Yoga',
                    'cycling': 'Cycling'
                }
                setWorkoutName(typeNames[workoutType as keyof typeof typeNames] || "Quick Log Workout")
            }
        }

        initializeQuickLog()
    }, [workoutId, workoutType, templateId, user, supabase])

    const addExercise = () => {
        if (!newExerciseName.trim()) return

        const newExercise = {
            ...WorkoutStorage.createEmptyExercise(),
            name: newExerciseName.trim()
        }

        const updatedExercises = [...exercises, newExercise]
        setExercises(updatedExercises)
        
        notifications.success('Exercise added', {
            description: newExerciseName.trim(),
            duration: 2000
        })
        
        setNewExerciseName("")
        setShowAddExercise(false)
    }

    const addSet = (exerciseId: string) => {
        const exercise = exercises.find(e => e.id === exerciseId)
        const updatedExercises = exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return {
                    ...exercise,
                    sets: [...exercise.sets, WorkoutStorage.createEmptySet()],
                    updatedAt: new Date().toISOString()
                }
            }
            return exercise
        })

        setExercises(updatedExercises)
        
        if (exercise) {
            notifications.info('Set added', {
                description: `${exercise.name}`,
                duration: 1500
            })
        }
    }

    const updateSet = (exerciseId: string, setId: string, field: keyof Exercise['sets'][0], value: string | number | boolean) => {
        const updatedExercises = exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return {
                    ...exercise,
                    sets: exercise.sets.map(set => {
                        if (set.id === setId) {
                            return { ...set, [field]: value }
                        }
                        return set
                    }),
                    updatedAt: new Date().toISOString()
                }
            }
            return exercise
        })

        setExercises(updatedExercises)
    }

    const removeExercise = (exerciseId: string) => {
        const exerciseToRemove = exercises.find(e => e.id === exerciseId)
        const updatedExercises = exercises.filter(exercise => exercise.id !== exerciseId)
        setExercises(updatedExercises)
        
        if (exerciseToRemove) {
            notifications.warning('Exercise removed', {
                description: exerciseToRemove.name,
                duration: 2000
            })
        }
    }

    const removeSet = (exerciseId: string, setId: string) => {
        const updatedExercises = exercises.map(exercise => {
            if (exercise.id === exerciseId) {
                return {
                    ...exercise,
                    sets: exercise.sets.filter(set => set.id !== setId),
                    updatedAt: new Date().toISOString()
                }
            }
            return exercise
        })

        setExercises(updatedExercises)
    }

    const startEditingName = () => {
        setTempWorkoutName(workoutName || "")
        setIsEditingName(true)
    }

    const saveWorkoutName = () => {
        const newName = tempWorkoutName.trim()
        setWorkoutName(newName || "Quick Log Workout")
        setIsEditingName(false)
    }

    const cancelEditingName = () => {
        setTempWorkoutName("")
        setIsEditingName(false)
    }

    const handleLogWorkout = async () => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to log workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        try {
            // Calculate duration in seconds
            const totalMinutes = hours * 60 + minutes
            const durationSeconds = totalMinutes * 60

            // Combine date and time
            const completedAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()

            // Save the workout activity
            await WorkoutStorage.saveWorkoutActivity({
                workoutType: workoutType as 'strength' | 'running' | 'yoga' | 'cycling',
                name: workoutName || "Quick Log Workout",
                exercises: exercises,
                durationSeconds,
                completedAt,
                userId: user?.id
            })

            notifications.success('Workout logged', {
                description: 'Saved to history',
                duration: 3000
            })
            
            console.log('Quick log workout saved to history')
            router.push('/workout')
        } catch (error) {
            console.error('Error saving quick log workout:', error)
            notifications.error('Log failed', {
                description: 'Could not save workout'
            })
            router.push('/workout')
        }
    }

    const confirmLogWorkout = () => {
        setShowDateTimeDialog(true)
    }

    const handleQuit = () => {
        setShowQuitDialog(true)
    }

    const confirmCancel = () => {
        router.push('/workout')
    }

    const formatDuration = () => {
        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`
        } else if (hours > 0) {
            return `${hours}h`
        } else if (minutes > 0) {
            return `${minutes}m`
        } else {
            return "0m"
        }
    }

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6] relative overflow-hidden">
            {/* Hero Gradient Background */}
            <div className="absolute inset-0 opacity-80">
                {/* Desktop gradient */}
                <div
                    className="hidden md:block absolute inset-0"
                    style={{
                        background: "radial-gradient(60% 60% at 60% 30%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                    }}
                />
                {/* Mobile gradient */}
                <div
                    className="block md:hidden absolute inset-0"
                    style={{
                        background: "radial-gradient(80% 80% at 50% 40%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="container mx-auto max-w-4xl px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1 mr-4">
                            {isEditingName ? (
                                <div className="flex items-center space-x-2">
                                    <Input
                                        value={tempWorkoutName}
                                        onChange={(e) => setTempWorkoutName(e.target.value)}
                                        placeholder="Enter workout name..."
                                        className="text-2xl font-bold bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px] h-auto py-2"
                                        onKeyPress={(e) => e.key === 'Enter' && saveWorkoutName()}
                                        onBlur={saveWorkoutName}
                                        autoFocus
                                    />
                                    <Button
                                        onClick={saveWorkoutName}
                                        variant="ghost"
                                        size="icon"
                                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-full"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={cancelEditingName}
                                        variant="ghost"
                                        size="icon"
                                        className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-bold text-[#F3F4F6]">
                                        {workoutName}
                                    </h1>
                                    <Button
                                        onClick={startEditingName}
                                        variant="ghost"
                                        size="icon"
                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-8 h-8"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                            <p className="text-sm text-[#A1A1AA] mt-1">Quick Log ID: {workoutId}</p>
                        </div>
                        <Button
                            onClick={handleQuit}
                            variant="ghost"
                            size="icon"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Duration Input */}
                    <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-[#F3F4F6] mb-2 font-mono">
                                {formatDuration()}
                            </div>
                            <div className="text-sm text-[#A1A1AA]">
                                Workout Duration
                            </div>
                        </div>

                        <div className="flex justify-center space-x-6">
                            <div className="text-center">
                                <Label className="text-[#A1A1AA] text-sm">Hours</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={hours}
                                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                                    className="w-20 text-center text-lg bg-[#0E0F13] border-[#212227] text-[#F3F4F6] rounded-[10px] mt-1"
                                />
                            </div>
                            <div className="text-center">
                                <Label className="text-[#A1A1AA] text-sm">Minutes</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                                    className="w-20 text-center text-lg bg-[#0E0F13] border-[#212227] text-[#F3F4F6] rounded-[10px] mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exercises */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-[#F3F4F6]">Exercises</h2>
                            <Button
                                onClick={() => setShowAddExercise(true)}
                                className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Exercise
                            </Button>
                        </div>

                        {/* Add Exercise Form */}
                        {showAddExercise && (
                            <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="exercise-name" className="text-[#A1A1AA]">Exercise Name</Label>
                                        <Input
                                            id="exercise-name"
                                            name="exercise-name"
                                            value={newExerciseName}
                                            onChange={(e) => setNewExerciseName(e.target.value)}
                                            placeholder="e.g., Bench Press, Squats, Deadlift"
                                            className="mt-1 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px]"
                                            onKeyPress={(e) => e.key === 'Enter' && addExercise()}
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={addExercise}
                                            disabled={!newExerciseName.trim()}
                                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                        >
                                            Add Exercise
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowAddExercise(false)
                                                setNewExerciseName("")
                                            }}
                                            variant="ghost"
                                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Exercise List */}
                        {exercises.map((exercise) => (
                            <div
                                key={exercise.id}
                                className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="cursor-move text-[#A1A1AA] hover:text-[#F3F4F6]">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-[#F3F4F6]">{exercise.name}</h3>
                                    </div>
                                    <Button
                                        onClick={() => removeExercise(exercise.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="text-[#A1A1AA] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Sets */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-[#A1A1AA] px-2">
                                        <div className="col-span-1">Set</div>
                                        <div className="col-span-3">Reps</div>
                                        <div className="col-span-3">Weight</div>
                                        <div className="col-span-4">Notes</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {exercise.sets.map((set, setIndex) => (
                                        <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-1 text-center text-sm text-[#A1A1AA]">
                                                {setIndex + 1}
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    id={`reps-${exercise.id}-${set.id}`}
                                                    name={`reps-${exercise.id}-${set.id}`}
                                                    value={set.reps}
                                                    onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                                                    placeholder="12"
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[10px] text-sm h-8"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    id={`weight-${exercise.id}-${set.id}`}
                                                    name={`weight-${exercise.id}-${set.id}`}
                                                    value={set.weight}
                                                    onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                                                    placeholder="135 lbs"
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[10px] text-sm h-8"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <Input
                                                    id={`notes-${exercise.id}-${set.id}`}
                                                    name={`notes-${exercise.id}-${set.id}`}
                                                    value={set.notes}
                                                    onChange={(e) => updateSet(exercise.id, set.id, 'notes', e.target.value)}
                                                    placeholder="Notes..."
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[10px] text-sm h-8"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                {exercise.sets.length > 1 && (
                                                    <Button
                                                        onClick={() => removeSet(exercise.id, set.id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-[#A1A1AA] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded-full w-8 h-8"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => addSet(exercise.id)}
                                    variant="ghost"
                                    className="w-full mt-3 text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-[10px] border-2 border-dashed border-[#212227] hover:border-[#2A2B31]"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Set
                                </Button>
                            </div>
                        ))}

                        {exercises.length === 0 && !showAddExercise && (
                            <div className="text-center py-12">
                                <div className="text-[#A1A1AA] mb-4">
                                    <p>No exercises added yet.</p>
                                    <p className="text-sm">Click &quot;Add Exercise&quot; to get started.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Log Workout Button */}
                    <div className="mt-8 pt-8 border-t border-[#212227]">
                        <Button
                            onClick={confirmLogWorkout}
                            disabled={hours === 0 && minutes === 0}
                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            Log Workout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Date/Time Dialog */}
            <Dialog
                open={showDateTimeDialog}
                onOpenChange={setShowDateTimeDialog}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3F4F6]">Set Date & Time</DialogTitle>
                        <DialogDescription className="text-[#A1A1AA]">
                            When did you complete this workout?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-sm font-medium text-[#F3F4F6] mb-2 flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Date</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] rounded-[14px]"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-[#F3F4F6] mb-2 flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Time</span>
                                </Label>
                                <Input
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] rounded-[14px]"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            onClick={() => setShowDateTimeDialog(false)}
                            variant="ghost"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLogWorkout}
                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                        >
                            Log Workout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quit Confirmation Dialog */}
            <Dialog
                open={showQuitDialog}
                onOpenChange={setShowQuitDialog}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3F4F6]">Cancel Quick Log?</DialogTitle>
                        <DialogDescription className="text-[#A1A1AA]">
                            You have unsaved data. What would you like to do?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-col">
                        <Button
                            onClick={confirmLogWorkout}
                            disabled={hours === 0 && minutes === 0}
                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Log Workout
                        </Button>
                        <Button
                            onClick={confirmCancel}
                            variant="ghost"
                            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                        >
                            Cancel & Discard
                        </Button>
                        <Button
                            onClick={() => setShowQuitDialog(false)}
                            variant="ghost"
                            className="w-full text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                        >
                            Continue Editing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}