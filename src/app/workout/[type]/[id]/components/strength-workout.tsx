"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Play, Pause, Square, Plus, GripVertical, Save } from "lucide-react"
import { WorkoutStorageSupabase } from "@/lib/workout-storage-supabase"
import { useAuth } from "@/lib/hooks/useAuth"

interface Exercise {
  id: string
  name: string
  description?: string
  category?: string
  targetMuscles?: string[]
  equipment?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  restTime?: number
  sets: Array<{
    id: string
    reps: string
    weight: string
    notes: string
    completed?: boolean
    restTime?: number
  }>
  instructions?: string[]
  tips?: string[]
  alternatives?: string[]
  createdAt?: string
  updatedAt?: string
}

interface StrengthWorkoutProps {
  workoutId: string
}

export function StrengthWorkout({ workoutId }: StrengthWorkoutProps) {
  const router = useRouter()
  const { user, supabase } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const isInitializingRef = useRef(true)

  // Initialize storage and load ongoing workout on component mount
  useEffect(() => {
    const initializeAndLoad = async () => {
      // Only proceed if we have user context
      if (!user || !supabase) {
        console.log('No user or supabase client available, skipping initialization')
        isInitializingRef.current = false
        return
      }

      // Initialize storage with user context
      WorkoutStorageSupabase.initialize(user, supabase)

      // Load ongoing workout for this type (strength)
      const ongoingWorkout = await WorkoutStorageSupabase.getOngoingWorkout()
      if (ongoingWorkout && ongoingWorkout.type === 'strength') {
        console.log('Found ongoing strength workout:', ongoingWorkout.id, 'Expected:', workoutId, 'Exercises:', ongoingWorkout.exercises.length, 'User:', user.id)

        // Always set exercises first to ensure they're visible immediately
        setExercises(ongoingWorkout.exercises)

        // Calculate current elapsed time if workout is running
        if (ongoingWorkout.isRunning) {
          const timeSinceStart = Math.floor((Date.now() - new Date(ongoingWorkout.startTime).getTime()) / 1000)
          const currentTime = ongoingWorkout.elapsedTime + timeSinceStart
          setTime(currentTime)
        } else {
          setTime(ongoingWorkout.elapsedTime)
        }

        setIsRunning(ongoingWorkout.isRunning)

        // If the ID doesn't match, update the workout with the expected ID to maintain URL consistency
        if (ongoingWorkout.id !== workoutId) {
          console.log('Updating workout ID to match URL:', workoutId)
          const updatedWorkout = {
            ...ongoingWorkout,
            id: workoutId,
            userId: user.id // Ensure user ID is properly set
          }
          // Update local state first to ensure exercises are visible
          setExercises(updatedWorkout.exercises)
          // Don't auto-save during initialization - only save when user makes changes
          console.log('Updated workout ID during initialization - no auto-save triggered')
        }
      } else {
        // No ongoing workout found with this ID - wait briefly for potential database sync
        console.log('No ongoing workout found immediately, retrying once...')

        // Brief delay to allow for database synchronization in case workout was just created
        await new Promise(resolve => setTimeout(resolve, 500))

        // Try loading again after brief delay
        const retryWorkout = await WorkoutStorageSupabase.getOngoingWorkout()
        if (retryWorkout && retryWorkout.type === 'strength') {
          console.log('Found workout on retry with exercises:', retryWorkout.exercises.length, 'User:', user.id)
          // Set exercises immediately to ensure they're visible
          setExercises(retryWorkout.exercises)

          if (retryWorkout.isRunning) {
            const timeSinceStart = Math.floor((Date.now() - new Date(retryWorkout.startTime).getTime()) / 1000)
            const currentTime = retryWorkout.elapsedTime + timeSinceStart
            setTime(currentTime)
          } else {
            setTime(retryWorkout.elapsedTime)
          }

          setIsRunning(retryWorkout.isRunning)

          // If the ID doesn't match, update it to maintain URL consistency
          if (retryWorkout.id !== workoutId) {
            console.log('Updating retry workout ID to match URL:', workoutId)
            const updatedRetryWorkout = {
              ...retryWorkout,
              id: workoutId,
              userId: user.id // Ensure user ID is properly set
            }
            // Update local state first to ensure exercises are visible
            setExercises(updatedRetryWorkout.exercises)
            // Don't auto-save during initialization - only save when user makes changes
            console.log('Updated retry workout ID during initialization - no auto-save triggered')
          }
        } else {
          // Still no workout found - create a new empty workout
          console.log('Creating new empty workout as fallback for user:', user.id)

          // Don't auto-save during initialization - only save when user makes changes
          console.log('Created new empty workout during initialization - no auto-save triggered')
          setExercises([])
          setTime(0)
          setIsRunning(false)
        }
      }
    }

    initializeAndLoad().finally(() => {
      // Mark initialization as complete
      isInitializingRef.current = false
    })
  }, [workoutId, user, supabase])

  // Simple save function - saves immediately without debouncing
  const saveWorkoutState = async (updatedExercises: Exercise[] = exercises) => {
    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      console.log('Save already in progress, skipping duplicate save request')
      return
    }

    console.log('saveWorkoutState called with exercises:', updatedExercises.length, 'Current state exercises:', exercises.length, 'User:', user?.id)

    // Only save if we have user context
    if (!user || !supabase) {
      console.log('No user or supabase client, skipping save')
      return
    }

    // Only save if there are exercises to save or if this is a user action (not initialization)
    if (updatedExercises.length === 0 && exercises.length === 0) {
      console.log('Skipping save - no exercises to save and none in state')
      return
    }

    isSavingRef.current = true

    try {
      // Use the WorkoutStorageSupabase layer for consistent user association
      const workoutToSave = {
        id: workoutId,
        type: 'strength' as const,
        exercises: updatedExercises,
        startTime: new Date().toISOString(), // Will be updated by storage layer if workout exists
        elapsedTime: time,
        isRunning: isRunning,
        userId: user.id
      }

      console.log('Saving workout state via WorkoutStorageSupabase:', workoutId, 'exercises:', updatedExercises.length, 'user:', user.id)

      // Use the storage layer which handles user association properly
      await WorkoutStorageSupabase.saveOngoingWorkout(workoutToSave)

      console.log('Successfully saved workout via WorkoutStorageSupabase:', workoutId)
    } catch (error) {
      console.error('Critical error in saveWorkoutState:', error)

      // Always maintain localStorage backup even on critical errors
      if (typeof window !== 'undefined' && user) {
        const workoutForStorage = {
          id: workoutId,
          type: 'strength' as const,
          exercises: updatedExercises,
          startTime: new Date().toISOString(),
          elapsedTime: time,
          isRunning: isRunning,
          userId: user.id
        }
        localStorage.setItem('ongoing-workout', JSON.stringify(workoutForStorage))
        localStorage.setItem('ongoing-workout-timestamp', Date.now().toString())
        console.log('Emergency localStorage save completed')
      }
    } finally {
      // Always reset the save lock
      isSavingRef.current = false
    }
  }

  // Stopwatch logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
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
    // Save current workout state when user starts the workout
    console.log('User started workout - saving current state')
    await saveWorkoutState()
  }

  const pauseTimer = async () => {
    setIsRunning(false)
    console.log('User paused workout - saving current state')
    await saveWorkoutState()
  }

  const resetTimer = async () => {
    setIsRunning(false)
    setTime(0)
    console.log('User reset workout - saving current state')
    await saveWorkoutState()
  }

  const addExercise = async () => {
    if (!newExerciseName.trim()) return

    const newExercise: Exercise = {
      id: `exercise-${Date.now()}`,
      name: newExerciseName.trim(),
      description: '',
      category: 'general',
      targetMuscles: [],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      restTime: 60,
      sets: [{
        id: `set-${Date.now()}`,
        reps: "",
        weight: "",
        notes: "",
        completed: false,
        restTime: 60
      }],
      instructions: [],
      tips: [],
      alternatives: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedExercises = [...exercises, newExercise]
    setExercises(updatedExercises)
    setNewExerciseName("")
    setShowAddExercise(false)

    // Save immediately after adding exercise
    console.log('User added exercise - saving current state')
    await saveWorkoutState(updatedExercises)
  }

  const addSet = async (exerciseId: string) => {
    const updatedExercises = exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: [...exercise.sets, {
            id: `set-${Date.now()}`,
            reps: "",
            weight: "",
            notes: "",
            completed: false,
            restTime: exercise.restTime || 60
          }],
          updatedAt: new Date().toISOString()
        }
      }
      return exercise
    })

    setExercises(updatedExercises)
    console.log('User added set - saving current state')
    await saveWorkoutState(updatedExercises)
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

    // Debounced save for set updates to avoid saving on every keystroke
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveWorkoutState(updatedExercises)
    }, 2000)
  }

  const removeExercise = async (exerciseId: string) => {
    const updatedExercises = exercises.filter(exercise => exercise.id !== exerciseId)
    setExercises(updatedExercises)
    console.log('User removed exercise - saving current state')
    await saveWorkoutState(updatedExercises)
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
    console.log('User removed set - saving current state')
    await saveWorkoutState(updatedExercises)
  }

  const finishWorkout = async () => {
    // Clear the workout using the storage layer
    if (user && supabase) {
      try {
        await WorkoutStorageSupabase.clearOngoingWorkout()
        console.log('Successfully finished workout via WorkoutStorageSupabase')
      } catch (error) {
        console.error('Error finishing workout:', error)
      }
    }

    // Clear from localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ongoing-workout')
      localStorage.removeItem('ongoing-workout-timestamp')
    }

    router.push('/workout')
  }

  const quitWorkout = async () => {
    // Clear any pending save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Save current state before leaving
    await saveWorkoutState()
    console.log('Workout saved before quit:', workoutId)

    router.push('/workout')
  }

  const saveAsTemplate = async () => {
    if (!templateName.trim() || exercises.length === 0) {
      console.log('Cannot save template: missing name or exercises', {
        hasName: !!templateName.trim(),
        exerciseCount: exercises.length
      })
      return
    }

    // Ensure we have user context
    if (!user || !supabase) {
      console.error('Cannot save template: no user or supabase client available')
      return
    }

    try {
      console.log('Saving enhanced template:', {
        name: templateName.trim(),
        type: 'strength',
        exerciseCount: exercises.length,
        userId: user.id,
        exercises: exercises.map(e => ({
          id: e.id,
          name: e.name,
          setCount: e.sets.length,
          category: e.category,
          equipment: e.equipment,
          difficulty: e.difficulty,
          hasDescription: !!e.description,
          hasInstructions: (e.instructions?.length || 0) > 0,
          hasTips: (e.tips?.length || 0) > 0,
          targetMuscles: e.targetMuscles?.length || 0
        }))
      })

      const template = await WorkoutStorageSupabase.saveTemplate({
        name: templateName.trim(),
        type: 'strength',
        exercises: exercises
      })

      setShowSaveTemplate(false)
      setTemplateName("")

      // Show success feedback
      console.log('Enhanced template saved successfully:', {
        id: template.id,
        name: template.name,
        exerciseCount: template.exercises.length,
        userId: template.userId,
        exerciseDetails: template.exercises.map(e => ({
          name: e.name,
          category: e.category,
          equipment: e.equipment,
          difficulty: e.difficulty,
          setCount: e.sets.length
        }))
      })
    } catch (error) {
      console.error('Failed to save enhanced template:', error)
      // You could add user-facing error feedback here
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
            <div>
              <h1 className="text-2xl font-bold text-[#F3F4F6]">Strength Training</h1>
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

          {/* Save as Template */}
          {exercises.length > 0 && (
            <div className="mt-8">
              {!showSaveTemplate ? (
                <Button
                  onClick={() => setShowSaveTemplate(true)}
                  className="w-full bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31] hover:scale-[1.01] active:scale-[0.997] transition-all py-3"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
              ) : (
                <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-name" className="text-[#A1A1AA]">Template Name</Label>
                      <Input
                        id="template-name"
                        name="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., My Push Workout, Upper Body"
                        className="mt-1 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px]"
                        onKeyPress={(e) => e.key === 'Enter' && saveAsTemplate()}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={saveAsTemplate}
                        disabled={!templateName.trim()}
                        className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                      >
                        Save Template
                      </Button>
                      <Button
                        onClick={() => {
                          setShowSaveTemplate(false)
                          setTemplateName("")
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
            </div>
          )}

          {/* Finish Workout */}
          <div className="mt-8 pt-8 border-t border-[#212227]">
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
    </div>
  )
}