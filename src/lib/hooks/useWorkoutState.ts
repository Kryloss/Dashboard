"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { GoalProgressCalculator, DailyGoalProgress } from '@/lib/goal-progress'
import { WorkoutStorage, WorkoutActivity } from '@/lib/workout-storage'
import { useAuth } from './useAuth'

export interface WorkoutState {
    goalProgress: DailyGoalProgress | null
    recentActivities: WorkoutActivity[]
    isLoading: boolean
    lastRefresh: number
}

export function useWorkoutState() {
    const { user, supabase } = useAuth()
    const [state, setState] = useState<WorkoutState>({
        goalProgress: null,
        recentActivities: [],
        isLoading: true,
        lastRefresh: 0
    })

    const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const isRefreshingRef = useRef(false)

    // Simplified refresh function
    const refreshWorkoutData = useCallback(async (force = false) => {
        if (!user || !supabase) return

        // Prevent concurrent refreshes
        if (isRefreshingRef.current && !force) return
        isRefreshingRef.current = true

        try {
            // Clear any pending refresh
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
            }

            setState(prev => ({ ...prev, isLoading: true }))

            // Initialize storage if needed
            WorkoutStorage.initialize(user, supabase)

            // Force cache refresh and get fresh data
            GoalProgressCalculator.invalidateCache(user.id)

            const [goalProgress, recentActivities] = await Promise.all([
                GoalProgressCalculator.calculateDailyProgress(true, true, user.id),
                WorkoutStorage.getRecentActivities(5)
            ])

            setState({
                goalProgress,
                recentActivities,
                isLoading: false,
                lastRefresh: Date.now()
            })

            console.log('✅ Workout state refreshed:', {
                exerciseProgress: goalProgress?.exercise?.progress,
                activitiesCount: recentActivities.length
            })

        } catch (error) {
            console.error('❌ Failed to refresh workout state:', error)
            setState(prev => ({ ...prev, isLoading: false }))
        } finally {
            isRefreshingRef.current = false
        }
    }, [user, supabase])

    // Lightweight goal progress refresh (for ongoing workouts)
    const refreshGoalProgress = useCallback(async () => {
        if (!user || !supabase) return

        try {
            // Only refresh goal progress, keep existing state (no loading indicators)
            const goalProgress = await GoalProgressCalculator.calculateDailyProgress(false, true, user.id)

            // Don't change isLoading or other state - just update goal progress
            setState(prev => ({ ...prev, goalProgress }))
        } catch (error) {
            console.error('❌ Failed to refresh goal progress:', error)
        }
    }, [user, supabase])

    // Lightweight recent activities refresh (separate from goals)
    const refreshRecentActivities = useCallback(async () => {
        if (!user || !supabase) return

        try {
            const recentActivities = await WorkoutStorage.getRecentActivities(5)
            setState(prev => ({ ...prev, recentActivities }))
        } catch (error) {
            console.error('❌ Failed to refresh recent activities:', error)
        }
    }, [user, supabase])

    // Optimistic update for immediate feedback
    const addWorkoutOptimistically = useCallback((workoutData: {
        workoutType: string
        durationSeconds: number
        exercises: unknown[]
    }) => {
        setState(prev => {
            if (!prev.goalProgress) return prev

            // Calculate how much this workout contributes to exercise goal
            const exerciseMinutes = Math.round(workoutData.durationSeconds / 60)
            const newExerciseMinutes = prev.goalProgress.exercise.currentMinutes + exerciseMinutes
            const newExerciseProgress = Math.min(
                newExerciseMinutes / prev.goalProgress.exercise.targetMinutes,
                1.0
            )

            return {
                ...prev,
                goalProgress: {
                    ...prev.goalProgress,
                    exercise: {
                        ...prev.goalProgress.exercise,
                        currentMinutes: newExerciseMinutes,
                        progress: newExerciseProgress
                    }
                }
            }
        })

        // Schedule actual refresh in background
        refreshTimeoutRef.current = setTimeout(() => {
            refreshWorkoutData(true)
        }, 500)
    }, [refreshWorkoutData])

    // Immediate refresh function for explicit calls
    const forceRefresh = useCallback(() => {
        refreshWorkoutData(true)
    }, [refreshWorkoutData])

    // Initial load
    useEffect(() => {
        if (user && supabase) {
            refreshWorkoutData()
        }
    }, [user, supabase, refreshWorkoutData])

    // Cleanup
    useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
            }
        }
    }, [])

    return {
        state,
        refreshWorkoutData: forceRefresh,
        refreshGoalProgress,
        refreshRecentActivities,
        addWorkoutOptimistically
    }
}