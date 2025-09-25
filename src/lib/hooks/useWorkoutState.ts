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

    // Local cache (persisted) helpers
    const getCacheKey = useCallback(() => {
        const userSuffix = user?.id ? `-${user.id.slice(-8)}` : '-anonymous'
        return `healss-workout-state${userSuffix}`
    }, [user])

    const loadCachedState = useCallback((): WorkoutState | null => {
        if (typeof window === 'undefined') return null
        try {
            const cached = localStorage.getItem(getCacheKey())
            if (!cached) return null
            const parsed = JSON.parse(cached) as WorkoutState
            return parsed
        } catch {
            return null
        }
    }, [getCacheKey])

    const saveCachedState = useCallback((next: WorkoutState) => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(getCacheKey(), JSON.stringify(next))
        } catch {
            // ignore cache errors
        }
    }, [getCacheKey])

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

            // Only invalidate cache on force
            if (force) {
                GoalProgressCalculator.invalidateCache(user.id)
            }

            const [goalProgress, recentActivities] = await Promise.all([
                GoalProgressCalculator.calculateDailyProgress(force, true, user.id),
                WorkoutStorage.getRecentActivities(5)
            ])

            const nextState: WorkoutState = {
                goalProgress,
                recentActivities,
                isLoading: false,
                lastRefresh: Date.now()
            }

            setState(nextState)
            saveCachedState(nextState)


        } catch (error) {
            console.error('❌ Failed to refresh workout state:', error)
            setState(prev => ({ ...prev, isLoading: false }))
        } finally {
            isRefreshingRef.current = false
        }
    }, [user, supabase, saveCachedState])

    // Optimistic update for immediate feedback
    const addWorkoutOptimistically = useCallback((workoutData: {
        workoutType: string
        durationSeconds: number
        exercises: unknown[]
        completedAt?: string
    }) => {
        setState(prev => {
            const exerciseMinutes = Math.round(workoutData.durationSeconds / 60)

            // Seed goalProgress if missing, with sensible defaults
            const seeded = prev.goalProgress ?? {
                exercise: {
                    progress: 0,
                    currentMinutes: 0,
                    targetMinutes: 30,
                    sessionCount: 0,
                    sessions: []
                },
                nutrition: {
                    progress: 0,
                    currentCalories: 0,
                    targetCalories: 2000,
                    currentMacros: { carbs: 0, protein: 0, fats: 0 },
                    targetMacros: { carbs: 250, protein: 150, fats: 67 },
                    mealsConsumed: 0,
                    placeholder: true
                },
                recovery: {
                    progress: 0,
                    currentHours: 0,
                    targetHours: 8,
                    placeholder: false
                }
            }

            // Only adjust exercise if the activity counts for today
            const completedAtIso = workoutData.completedAt || new Date().toISOString()
            const isToday = GoalProgressCalculator.isWorkoutToday(completedAtIso)
            const newExerciseMinutes = seeded.exercise.currentMinutes + (isToday ? exerciseMinutes : 0)
            const newExerciseProgress = Math.min(
                newExerciseMinutes / Math.max(seeded.exercise.targetMinutes, 1),
                1.0
            )

            // Optimistically prepend to recent activities
            const optimisticActivity: WorkoutActivity = {
                id: `temp-${Date.now()}`,
                workoutType: workoutData.workoutType as WorkoutActivity['workoutType'],
                name: undefined,
                exercises: [],
                durationSeconds: workoutData.durationSeconds,
                notes: undefined,
                completedAt: completedAtIso,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: user?.id
            }

            const next: WorkoutState = {
                ...prev,
                goalProgress: {
                    ...seeded,
                    exercise: {
                        ...seeded.exercise,
                        currentMinutes: newExerciseMinutes,
                        progress: newExerciseProgress,
                        sessionCount: Math.max(seeded.exercise.sessionCount, 0) + (isToday ? 1 : 0),
                        sessions: seeded.exercise.sessions
                    }
                },
                recentActivities: [optimisticActivity, ...prev.recentActivities]
            }

            // Cache optimistic state to improve UX on route changes
            saveCachedState(next)
            return next
        })

        // Schedule actual refresh in background
        refreshTimeoutRef.current = setTimeout(() => {
            refreshWorkoutData(true)
        }, 400)
    }, [refreshWorkoutData, saveCachedState, user?.id])

    // Optimistic delete
    const removeActivityOptimistically = useCallback((activity: WorkoutActivity) => {
        setState(prev => {
            // Adjust goal progress only if activity is today
            const isToday = GoalProgressCalculator.isWorkoutToday(activity.completedAt)
            let goalProgress = prev.goalProgress

            if (isToday && goalProgress) {
                const minutes = Math.round(activity.durationSeconds / 60)
                const newMinutes = Math.max(goalProgress.exercise.currentMinutes - minutes, 0)
                goalProgress = {
                    ...goalProgress,
                    exercise: {
                        ...goalProgress.exercise,
                        currentMinutes: newMinutes,
                        progress: Math.min(newMinutes / Math.max(goalProgress.exercise.targetMinutes, 1), 1)
                    }
                }
            }

            const next: WorkoutState = {
                ...prev,
                goalProgress,
                recentActivities: prev.recentActivities.filter(a => a.id !== activity.id)
            }
            saveCachedState(next)
            return next
        })
    }, [saveCachedState])

    // Optimistic update
    const updateActivityOptimistically = useCallback((updated: WorkoutActivity) => {
        setState(prev => {
            const index = prev.recentActivities.findIndex(a => a.id === updated.id)
            let goalProgress = prev.goalProgress

            if (index !== -1) {
                const prevAct = prev.recentActivities[index]
                const prevIsToday = GoalProgressCalculator.isWorkoutToday(prevAct.completedAt)
                const newIsToday = GoalProgressCalculator.isWorkoutToday(updated.completedAt)

                if (goalProgress) {
                    let minutes = goalProgress.exercise.currentMinutes
                    if (prevIsToday) minutes -= Math.round(prevAct.durationSeconds / 60)
                    if (newIsToday) minutes += Math.round(updated.durationSeconds / 60)
                    minutes = Math.max(minutes, 0)
                    goalProgress = {
                        ...goalProgress,
                        exercise: {
                            ...goalProgress.exercise,
                            currentMinutes: minutes,
                            progress: Math.min(minutes / Math.max(goalProgress.exercise.targetMinutes, 1), 1)
                        }
                    }
                }
            }

            const nextActivities = [...prev.recentActivities]
            if (index !== -1) nextActivities[index] = { ...prev.recentActivities[index], ...updated }

            const next: WorkoutState = {
                ...prev,
                goalProgress,
                recentActivities: nextActivities
            }
            saveCachedState(next)
            return next
        })
    }, [saveCachedState])

    // Immediate refresh function for explicit calls (currently unused but available)
    // const forceRefresh = useCallback(() => {
    //     refreshWorkoutData(true)
    // }, [refreshWorkoutData])

    // Initial load: seed from cache immediately, then refresh (not forced)
    useEffect(() => {
        if (user && supabase) {
            const cached = loadCachedState()
            if (cached) {
                setState(() => ({ ...cached, isLoading: true }))
            }
            // Prefer cached unless forced elsewhere
            // Small delay to yield to paint
            setTimeout(() => {
                refreshWorkoutData(false)
            }, 0)
        }
    }, [user, supabase, refreshWorkoutData, loadCachedState])

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
        refreshWorkoutData,
        addWorkoutOptimistically,
        removeActivityOptimistically,
        updateActivityOptimistically
    }
}