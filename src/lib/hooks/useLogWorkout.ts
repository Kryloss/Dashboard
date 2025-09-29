"use client"

import { useCallback, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/contexts/NotificationContext'
import { useWorkoutState } from '@/lib/hooks/useWorkoutState'
import { WorkoutStorage, WorkoutExercise } from '@/lib/workout-storage'

interface LogWorkoutInput {
    workoutType: 'strength' | 'running' | 'yoga' | 'cycling'
    name?: string
    exercises?: WorkoutExercise[]
    durationSeconds: number
    completedAt?: string
    notes?: string
}

export function useLogWorkout() {
    const { user, supabase, loading } = useAuth()
    const notifications = useNotifications()
    const { addWorkoutOptimistically, refreshWorkoutData } = useWorkoutState()
    const [isLogging, setIsLogging] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const logWorkout = useCallback(async (input: LogWorkoutInput) => {
        if (loading) return
        setError(null)

        if (!user || !supabase) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to log workouts'
            })
            return
        }

        setIsLogging(true)
        try {
            // Ensure storage is ready
            WorkoutStorage.initialize(user, supabase)

            const completedAt = input.completedAt || new Date().toISOString()
            const exercises = input.exercises || []


            // Optimistic UI
            addWorkoutOptimistically({
                workoutType: input.workoutType,
                durationSeconds: input.durationSeconds,
                exercises: [],
                completedAt
            })

            // Persist
            await WorkoutStorage.saveWorkoutActivity({
                workoutType: input.workoutType,
                name: input.name,
                exercises,
                durationSeconds: input.durationSeconds,
                notes: input.notes,
                completedAt,
                userId: user.id
            })

            // Revalidate immediately to ensure data is fresh
            await refreshWorkoutData(true)

            // Notify listeners after data is refreshed (keeps existing UX hooks working)
            try {
                window.dispatchEvent(new CustomEvent('workoutCompleted', {
                    detail: {
                        source: 'use-log-workout',
                        workoutType: input.workoutType,
                        duration: input.durationSeconds,
                        exercises: exercises.length,
                        completedAt
                    }
                }))
            } catch {}

            // Notification handled by page event listener
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error'
            setError(message)
            notifications.error('Log failed', { description: message })
            // Force a refresh to roll back any inconsistent state
            refreshWorkoutData(true)
        } finally {
            setIsLogging(false)
        }
    }, [user, supabase, loading, notifications, addWorkoutOptimistically, refreshWorkoutData])

    return { logWorkout, isLogging, error }
}


