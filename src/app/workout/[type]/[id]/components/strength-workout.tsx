"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Play, Pause, Square, Plus, GripVertical } from "lucide-react"

interface Exercise {
  id: string
  name: string
  sets: Array<{
    id: string
    reps: string
    weight: string
    notes: string
  }>
}

interface StrengthWorkoutProps {
  workoutId: string
}

export function StrengthWorkout({ workoutId }: StrengthWorkoutProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => setIsRunning(true)
  const pauseTimer = () => setIsRunning(false)
  const resetTimer = () => {
    setIsRunning(false)
    setTime(0)
  }

  const addExercise = () => {
    if (!newExerciseName.trim()) return

    const newExercise: Exercise = {
      id: `exercise-${Date.now()}`,
      name: newExerciseName.trim(),
      sets: [{
        id: `set-${Date.now()}`,
        reps: "",
        weight: "",
        notes: ""
      }]
    }

    setExercises(prev => [...prev, newExercise])
    setNewExerciseName("")
    setShowAddExercise(false)
  }

  const addSet = (exerciseId: string) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: [...exercise.sets, {
            id: `set-${Date.now()}`,
            reps: "",
            weight: "",
            notes: ""
          }]
        }
      }
      return exercise
    }))
  }

  const updateSet = (exerciseId: string, setId: string, field: keyof Exercise['sets'][0], value: string) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: value }
            }
            return set
          })
        }
      }
      return exercise
    }))
  }

  const removeExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(exercise => exercise.id !== exerciseId))
  }

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.filter(set => set.id !== setId)
        }
      }
      return exercise
    }))
  }

  const finishWorkout = () => {
    resetTimer()
    router.push('/workout')
  }

  const quitWorkout = () => {
    // Don't reset timer - just go back
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
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                          placeholder="12"
                          className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[10px] text-sm h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                          placeholder="135 lbs"
                          className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[10px] text-sm h-8"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
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
          <div className="mt-12 pt-8 border-t border-[#212227]">
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