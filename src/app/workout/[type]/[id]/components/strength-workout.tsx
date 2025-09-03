"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { X, Play, Pause, Square, Plus, GripVertical, BookOpen, Edit3, Check, X as XIcon } from "lucide-react"
import { WorkoutStorage, WorkoutExercise } from "@/lib/workout-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"

// Use WorkoutExercise from storage
type Exercise = WorkoutExercise

interface StrengthWorkoutProps {
    workoutId: string
}

export function StrengthWorkout({ workoutId }: StrengthWorkoutProps) {
    const router = useRouter()
    const { user, supabase } = useAuth()
    const notifications = useNotifications()
    const [isRunning, setIsRunning] = useState(false)
    const [time, setTime] = useState(0)
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [showAddExercise, setShowAddExercise] = useState(false)
    const [newExerciseName, setNewExerciseName] = useState("")
    
    // Template save state
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
    const [templateName, setTemplateName] = useState("")
    const [isSavingTemplate, setIsSavingTemplate] = useState(false)
    const [templateSaveError, setTemplateSaveError] = useState<string | null>(null)
    
    // Workout name editing
    const [workoutName, setWorkoutName] = useState<string>("")
    const [isEditingName, setIsEditingName] = useState(false)
    const [tempWorkoutName, setTempWorkoutName] = useState("")

    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Initialize workout from storage or create new one
    useEffect(() => {
        const initializeWorkout = async () => {
            if (!user || !supabase) {
                console.error('No user or supabase client available')
                return
            }

            // Initialize storage with user context
            WorkoutStorage.initialize(user, supabase)

            try {
                const existingWorkout = await WorkoutStorage.getOngoingWorkout()

                if (existingWorkout && existingWorkout.workoutId === workoutId) {
                    // Load existing workout
                    setExercises(existingWorkout.exercises)
                    setWorkoutName(existingWorkout.name || "")

                    // If the workout was running when page was closed, calculate background elapsed time
                    if (existingWorkout.isRunning) {
                        // Calculate how much time has passed since the workout was last saved
                        const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                        setTime(backgroundElapsedTime)
                        setIsRunning(true)

                        // Update the workout with the current background elapsed time
                        await WorkoutStorage.saveOngoingWorkout({
                            ...existingWorkout,
                            elapsedTime: backgroundElapsedTime,
                            isRunning: true
                        })
                    } else {
                        // If paused, use stored elapsed time
                        setTime(existingWorkout.elapsedTime)
                        setIsRunning(false)
                    }
                } else {
                    // Create new workout
                    const newWorkout = WorkoutStorage.createWorkout('strength', workoutId)
                    await WorkoutStorage.saveOngoingWorkout(newWorkout)

                    setExercises([])
                    setTime(0)
                    setIsRunning(false)
                    setWorkoutName(newWorkout.name || "")
                }
            } catch (error) {
                console.error('Error initializing workout:', error)
            }
        }

        initializeWorkout()
    }, [workoutId, user, supabase])


    // Timer display using simple counter (no real-time calculation)
    useEffect(() => {
        if (isRunning) {
            // Only update timer display when running - use simple counter
            intervalRef.current = setInterval(() => {
                setTime(prevTime => {
                    const newTime = prevTime + 1

                    // Save exercises periodically for running workouts
                    if (newTime % 60 === 0) {
                        WorkoutStorage.getOngoingWorkout().then(workout => {
                            if (workout) {
                                WorkoutStorage.saveOngoingWorkout({
                                    ...workout,
                                    exercises,
                                    elapsedTime: newTime,
                                    isRunning: true
                                }).catch(error => {
                                    console.error('Error saving exercises during timer update:', error)
                                })
                            }
                        }).catch(error => {
                            console.error('Error getting workout during timer update:', error)
                        })
                    }

                    return newTime
                })
            }, 1000)
        } else {
            // When paused, clear interval and keep current time display
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            // Don't update time when paused - keep the last displayed time
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [isRunning, exercises])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startTimer = async () => {
        setIsRunning(true)
        // When starting/resuming, use current displayed time to prevent time jumps
        const currentDisplayTime = time

        // Update the workout in storage with current exercises
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                // Calculate start time for accurate real-time calculation
                const startTime = new Date(Date.now() - (currentDisplayTime * 1000)).toISOString()
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    exercises,
                    elapsedTime: currentDisplayTime,
                    isRunning: true,
                    startTime: startTime
                })
                
                // Notify user timer started
                if (currentDisplayTime === 0) {
                    notifications.success('Timer started', {
                        description: 'Workout is now active',
                        duration: 2000
                    })
                } else {
                    notifications.info('Timer resumed', {
                        description: 'Workout continues',
                        duration: 2000
                    })
                }
            }
        } catch (error) {
            console.error('Error updating workout on start:', error)
            notifications.error('Timer failed', {
                description: 'Could not start timer'
            })
        }
    }

    const pauseTimer = async () => {
        // Use current displayed time when pausing to prevent time jumps
        const currentDisplayTime = time
        setIsRunning(false)
        // Keep the current displayed time
        setTime(currentDisplayTime)

        // Update the workout in storage with current exercises
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    exercises,
                    elapsedTime: currentDisplayTime,
                    isRunning: false
                })
                
                notifications.warning('Timer paused', {
                    description: 'Workout on hold',
                    duration: 2000
                })
            }
        } catch (error) {
            console.error('Error updating workout on pause:', error)
            notifications.error('Pause failed', {
                description: 'Could not pause timer'
            })
        }
    }

    const resetTimer = async () => {
        // Stop the timer first
        setIsRunning(false)
        // Reset to 0 immediately
        setTime(0)

        // Update storage with reset values
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                // Create a new workout with reset values
                const resetWorkout = {
                    ...workout,
                    exercises,
                    elapsedTime: 0,
                    isRunning: false,
                    startTime: new Date().toISOString() // Reset start time
                }
                await WorkoutStorage.saveOngoingWorkout(resetWorkout)
                
                notifications.info('Timer reset', {
                    description: 'Back to 00:00',
                    duration: 2000
                })
            }
        } catch (error) {
            console.error('Error updating workout on reset:', error)
            notifications.error('Reset failed', {
                description: 'Could not reset timer'
            })
        }
    }

    const addExercise = async () => {
        if (!newExerciseName.trim()) return

        const newExercise = {
            ...WorkoutStorage.createEmptyExercise(),
            name: newExerciseName.trim()
        }

        const updatedExercises = [...exercises, newExercise]
        setExercises(updatedExercises)
        setNewExerciseName("")
        setShowAddExercise(false)

        // Save updated exercises to ongoing workout
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    exercises: updatedExercises
                })
                
                notifications.success('Exercise added', {
                    description: newExerciseName.trim(),
                    duration: 2000
                })

                // Show tip for first exercise
                const exerciseCount = exercises.length + 1
                if (exerciseCount === 1) {
                    setTimeout(() => {
                        notifications.info('Pro tip', {
                            description: 'Click + to add sets with weights',
                            duration: 3000
                        })
                    }, 1500)
                }
            }
        } catch (error) {
            console.error('Error saving workout:', error)
            notifications.error('Add failed', {
                description: 'Could not add exercise'
            })
        }
    }

    const addSet = async (exerciseId: string) => {
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

        // Save updated exercises to ongoing workout
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    exercises: updatedExercises
                })
            }
        } catch (error) {
            console.error('Error saving workout:', error)
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

        // Debounced save to avoid too many saves while typing
        clearTimeout((window as Window & { setUpdateTimeout?: NodeJS.Timeout }).setUpdateTimeout)
            ; (window as Window & { setUpdateTimeout?: NodeJS.Timeout }).setUpdateTimeout = setTimeout(async () => {
                try {
                    const workout = await WorkoutStorage.getOngoingWorkout()
                    if (workout) {
                        workout.exercises = updatedExercises
                        await WorkoutStorage.saveOngoingWorkout(workout)
                    }
                } catch (error) {
                    console.error('Error in debounced save:', error)
                }
            }, 1000)
    }

    const removeExercise = async (exerciseId: string) => {
        const updatedExercises = exercises.filter(exercise => exercise.id !== exerciseId)
        setExercises(updatedExercises)

        // Save updated exercises to ongoing workout
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    exercises: updatedExercises
                })
            }
        } catch (error) {
            console.error('Error saving workout:', error)
        }
    }

    const removeSet = async (exerciseId: string, setId: string) => {
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

        // Save updated exercises to ongoing workout
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    exercises: updatedExercises
                })
            }
        } catch (error) {
            console.error('Error saving workout:', error)
        }
    }

    const saveAsTemplate = async () => {
        if (!templateName.trim()) return
        if (!user) {
            setTemplateSaveError('You must be signed in to save templates')
            return
        }

        if (exercises.length === 0) {
            setTemplateSaveError('Cannot save template with no exercises')
            return
        }

        setIsSavingTemplate(true)
        setTemplateSaveError(null)

        try {
            // Create template object with current exercises
            const template = {
                name: templateName.trim(),
                type: 'strength' as const,
                exercises: exercises.map(exercise => ({
                    ...exercise,
                    // Ensure all required fields are present
                    id: exercise.id || `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: exercise.name || 'Unnamed Exercise',
                    description: exercise.description || '',
                    category: exercise.category || 'general',
                    targetMuscles: exercise.targetMuscles || [],
                    equipment: exercise.equipment || 'bodyweight',
                    difficulty: exercise.difficulty || 'beginner',
                    restTime: exercise.restTime || 60,
                    instructions: exercise.instructions || [],
                    tips: exercise.tips || [],
                    alternatives: exercise.alternatives || [],
                    createdAt: exercise.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    sets: exercise.sets.map(set => ({
                        ...set,
                        id: set.id || `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        reps: set.reps || '',
                        weight: set.weight || '',
                        notes: set.notes || '',
                        completed: set.completed || false,
                        restTime: set.restTime || exercise.restTime || 60
                    }))
                })),
                isBuiltIn: false
            }

            await WorkoutStorage.saveTemplate(template)
            
            // Close dialog and reset form on success
            setShowSaveTemplateDialog(false)
            setTemplateName("")
            setTemplateSaveError(null)
            
            notifications.success('Template saved', {
                description: `"${template.name}" saved`,
                duration: 4000
            })

            // Check if this is their first template
            const templatesCreated = localStorage.getItem('templates-created-count')
            const count = parseInt(templatesCreated || '0') + 1
            localStorage.setItem('templates-created-count', count.toString())

            if (count === 1) {
                setTimeout(() => {
                    notifications.info('Smart move!', {
                        description: 'Templates help repeat favorite workouts',
                        duration: 4000
                    })
                }, 2000)
            }
            
            console.log('Template saved successfully:', template.name)
        } catch (error) {
            console.error('Error saving template:', error)
            setTemplateSaveError(error instanceof Error ? error.message : 'Failed to save template. Please try again.')
        } finally {
            setIsSavingTemplate(false)
        }
    }

    const startEditingName = () => {
        setTempWorkoutName(workoutName || "")
        setIsEditingName(true)
    }

    const saveWorkoutName = async () => {
        const newName = tempWorkoutName.trim()
        setWorkoutName(newName)
        setIsEditingName(false)

        // Update the workout in storage
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    name: newName || undefined
                })
            }
        } catch (error) {
            console.error('Error updating workout name:', error)
        }
    }

    const cancelEditingName = () => {
        setTempWorkoutName("")
        setIsEditingName(false)
    }

    const finishWorkout = async () => {
        // Stop the timer first
        setIsRunning(false)

        try {
            // Save the completed workout as an activity before clearing
            await WorkoutStorage.saveWorkoutActivity({
                workoutType: 'strength',
                name: workoutName || undefined,
                exercises: exercises,
                durationSeconds: time,
                completedAt: new Date().toISOString(),
                userId: user?.id
            })
            
            console.log('Workout activity saved to history')

            // Clear the ongoing workout from storage
            await WorkoutStorage.clearOngoingWorkout()
            
            // Success notification
            notifications.success('Workout completed', {
                description: 'Saved to history',
                duration: 5000,
                action: {
                    label: 'History',
                    onClick: () => router.push('/workout/history')
                }
            })

            // Check if this is their first completed workout
            const completedWorkoutsCount = localStorage.getItem('completed-workouts-count')
            const count = parseInt(completedWorkoutsCount || '0') + 1
            localStorage.setItem('completed-workouts-count', count.toString())

            if (count === 1) {
                // First workout completion tip
                setTimeout(() => {
                    notifications.info('Great job!', {
                        description: 'Check history to track progress',
                        duration: 4000,
                        action: {
                            label: 'View History',
                            onClick: () => router.push('/workout/history')
                        }
                    })
                }, 2000)
            } else if (count === 3) {
                // Third workout milestone
                setTimeout(() => {
                    notifications.success('3 workouts completed!', {
                        description: 'Try saving a template next',
                        duration: 4000
                    })
                }, 2000)
            }
            
            console.log('Workout finished and cleared from storage')
        } catch (error) {
            console.error('Error finishing workout:', error)
            notifications.error('Save failed', {
                description: 'Could not save to history',
                duration: 6000
            })
        } finally {
            setTime(0)
        }
        router.push('/workout')
    }

    const quitWorkout = async () => {
        // Save current state before leaving (don't clear) - timer continues in background
        try {
            const workout = await WorkoutStorage.getOngoingWorkout()
            if (workout) {
                // Use current displayed time to save accurate state
                const currentDisplayTime = time
                await WorkoutStorage.saveOngoingWorkout({
                    ...workout,
                    exercises,
                    elapsedTime: currentDisplayTime,
                    isRunning: isRunning // Keep the timer running state - timer continues in background!
                })
                
                // Notify user that workout continues in background if it's running
                if (isRunning) {
                    notifications.info('Timer running', {
                        description: 'Continues in background',
                        duration: 6000,
                        action: {
                            label: 'Resume',
                            onClick: () => router.push(`/workout/${workout.type}/${workout.workoutId}`)
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Error saving workout state:', error)
            notifications.error('Save failed', {
                description: 'Could not save progress'
            })
        }
        router.push('/workout')
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
                                        {workoutName || "Strength Training"}
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
                            <p className="text-sm text-[#A1A1AA] mt-1">Workout ID: {workoutId}</p>
                        </div>
                        <Button
                            onClick={quitWorkout}
                            variant="ghost"
                            size="icon"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Stopwatch */}
                    <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-[#F3F4F6] mb-2 font-mono">
                                {formatTime(time)}
                            </div>
                            <div className="text-sm text-[#A1A1AA]">
                                {isRunning ? "Training in progress" : "Training paused"}
                            </div>
                        </div>

                        <div className="flex justify-center space-x-3">
                            {!isRunning ? (
                                <Button
                                    onClick={startTimer}
                                    className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start
                                </Button>
                            ) : (
                                <Button
                                    onClick={pauseTimer}
                                    className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                </Button>
                            )}

                            <Button
                                onClick={resetTimer}
                                variant="ghost"
                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full border border-[#212227]"
                            >
                                Reset
                            </Button>
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


                    {/* Finish Workout */}
                    <div className="mt-8 pt-8 border-t border-[#212227] space-y-4">
                        {/* Save as Template Button */}
                        <Button
                            onClick={() => setShowSaveTemplateDialog(true)}
                            disabled={exercises.length === 0}
                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Save as Template
                        </Button>
                        
                        {/* Stop Workout Button */}
                        <Button
                            onClick={finishWorkout}
                            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full shadow-[0_8px_32px_rgba(220,38,38,0.28)] hover:from-red-500 hover:to-red-400 hover:shadow-[0_10px_40px_rgba(220,38,38,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all py-3"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            Stop Workout
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Save Template Dialog */}
            <Dialog 
                open={showSaveTemplateDialog} 
                onOpenChange={(open) => {
                    setShowSaveTemplateDialog(open)
                    if (!open) {
                        setTemplateName("")
                        setTemplateSaveError(null)
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3F4F6]">Save as Template</DialogTitle>
                        <DialogDescription className="text-[#A1A1AA]">
                            Give your workout template a name so you can use it again later.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="template-name" className="text-[#A1A1AA]">Template Name</Label>
                            <Input
                                id="template-name"
                                name="template-name"
                                value={templateName}
                                onChange={(e) => {
                                    setTemplateName(e.target.value)
                                    setTemplateSaveError(null) // Clear error when user starts typing
                                }}
                                placeholder="e.g., Upper Body Strength, Push Day..."
                                className="mt-1 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px]"
                                onKeyPress={(e) => e.key === 'Enter' && !isSavingTemplate && templateName.trim() && saveAsTemplate()}
                                disabled={isSavingTemplate}
                            />
                        </div>
                        
                        {/* Error Message */}
                        {templateSaveError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[14px]">
                                <p className="text-sm text-red-400">{templateSaveError}</p>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter className="gap-2">
                        <Button
                            onClick={() => {
                                setShowSaveTemplateDialog(false)
                                setTemplateName("")
                                setTemplateSaveError(null)
                            }}
                            variant="ghost"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                            disabled={isSavingTemplate}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveAsTemplate}
                            disabled={!templateName.trim() || isSavingTemplate}
                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isSavingTemplate ? 'Saving...' : 'Save Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}