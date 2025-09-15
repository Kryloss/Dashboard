// Centralized workout state management for real-time ring updates
import { GoalProgressCalculator, DailyGoalProgress } from './goal-progress'
import { WorkoutStorage, WorkoutActivity } from './workout-storage'

export interface WorkoutState {
    goalProgress: DailyGoalProgress | null
    recentActivities: WorkoutActivity[]
    isLoading: boolean
    lastUpdate: number
}

type StateListener = (state: WorkoutState) => void

class WorkoutStateManager {
    private state: WorkoutState = {
        goalProgress: null,
        recentActivities: [],
        isLoading: false,
        lastUpdate: 0
    }

    private listeners: Set<StateListener> = new Set()
    private updatePromise: Promise<void> | null = null
    private lastRefreshTime = 0
    private readonly MIN_REFRESH_INTERVAL = 2000 // Minimum 2 seconds between refreshes

    // Real-time workout tracking
    private ongoingWorkoutInterval: NodeJS.Timeout | null = null
    private readonly ONGOING_WORKOUT_UPDATE_INTERVAL = 60000 // Update every minute

    // Subscribe to state changes
    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener)

        // Immediately call with current state
        listener(this.state)

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener)
        }
    }

    // Get current state
    getState(): WorkoutState {
        return { ...this.state }
    }

    // Force refresh of all data
    async refreshAll(force = false, includeOngoingWorkout = false): Promise<void> {
        const now = Date.now()

        // Prevent too frequent updates unless forced or including ongoing workout
        if (!force && !includeOngoingWorkout && now - this.lastRefreshTime < this.MIN_REFRESH_INTERVAL) {
            return
        }

        // Prevent concurrent updates
        if (this.updatePromise && !force && !includeOngoingWorkout) {
            return this.updatePromise
        }

        this.lastRefreshTime = now
        this.updatePromise = this.performRefresh(includeOngoingWorkout)
        await this.updatePromise
        this.updatePromise = null
    }

    private async performRefresh(includeOngoingWorkout = false): Promise<void> {
        console.log('🔄 WorkoutStateManager: Starting refresh...', { includeOngoingWorkout })

        // Don't set loading to true if we already have data - keep previous data visible
        const hasExistingData = this.state.goalProgress !== null || this.state.recentActivities.length > 0
        if (!hasExistingData) {
            this.setState({ isLoading: true })
        }

        try {
            // Invalidate cache to ensure fresh data (but not for ongoing workout updates)
            if (!includeOngoingWorkout) {
                GoalProgressCalculator.invalidateCache()
            }

            // Get fresh goal progress
            const goalProgress = await GoalProgressCalculator.calculateDailyProgress(true, includeOngoingWorkout)

            // Get recent activities (don't need to refresh for ongoing workout updates)
            let recentActivities = this.state.recentActivities
            if (!includeOngoingWorkout) {
                recentActivities = await WorkoutStorage.getRecentActivities(5)
            }

            this.setState({
                goalProgress,
                recentActivities,
                isLoading: false,
                lastUpdate: Date.now()
            })

            console.log('✅ WorkoutStateManager: Refresh completed', {
                includeOngoingWorkout,
                goalProgress: goalProgress ? {
                    exercise: Math.round(goalProgress.exercise.progress * 100),
                    nutrition: Math.round(goalProgress.nutrition.progress * 100),
                    recovery: Math.round(goalProgress.recovery.progress * 100)
                } : null,
                activitiesCount: recentActivities.length
            })

        } catch (error) {
            console.error('❌ WorkoutStateManager: Refresh failed', error)
            // Only set loading to false if we were actually loading
            if (!hasExistingData) {
                this.setState({ isLoading: false })
            }
        }
    }

    // Update state and notify listeners
    private setState(updates: Partial<WorkoutState>): void {
        this.state = { ...this.state, ...updates }
        this.notifyListeners()
    }

    // Notify all listeners of state change
    private notifyListeners(): void {
        this.listeners.forEach(listener => {
            try {
                listener(this.state)
            } catch (error) {
                console.error('Error in state listener:', error)
            }
        })
    }

    // Handle workout completion
    async handleWorkoutCompleted(source: string, workoutData?: unknown): Promise<void> {
        console.log('🎯 WorkoutStateManager: Workout completed', { source, workoutData })

        // Stop ongoing workout tracking since workout is completed
        this.stopOngoingWorkoutTracking()

        // Force immediate refresh
        await this.refreshAll(true)

        // Schedule a single delayed refresh to catch any async updates
        setTimeout(() => {
            this.refreshAll(true)
        }, 500)
    }

    // Handle workout deletion
    async handleWorkoutDeleted(): Promise<void> {
        console.log('🗑️ WorkoutStateManager: Workout deleted')
        await this.refreshAll(true)
    }

    // Handle workout update
    async handleWorkoutUpdated(): Promise<void> {
        console.log('📝 WorkoutStateManager: Workout updated')
        await this.refreshAll(true)
    }

    // Start real-time tracking for ongoing workouts
    startOngoingWorkoutTracking(): void {
        // Clear any existing interval
        this.stopOngoingWorkoutTracking()

        console.log('🔄 WorkoutStateManager: Starting ongoing workout tracking')

        this.ongoingWorkoutInterval = setInterval(async () => {
            try {
                // Check if there's an ongoing workout
                const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()

                if (ongoingWorkout && ongoingWorkout.isRunning) {
                    const realTimeElapsed = WorkoutStorage.getBackgroundElapsedTime()
                    console.log('⏱️ WorkoutStateManager: Updating rings for ongoing workout', {
                        elapsedSeconds: realTimeElapsed,
                        elapsedMinutes: Math.round(realTimeElapsed / 60),
                        workoutType: ongoingWorkout.type
                    })
                    // Refresh with ongoing workout data
                    await this.refreshAll(true, true) // force refresh and include ongoing workout
                } else {
                    // No ongoing workout, stop tracking
                    console.log('🛑 WorkoutStateManager: No ongoing workout, stopping tracking')
                    this.stopOngoingWorkoutTracking()
                }
            } catch (error) {
                console.error('❌ WorkoutStateManager: Error in ongoing workout tracking:', error)
            }
        }, this.ONGOING_WORKOUT_UPDATE_INTERVAL)
    }

    // Stop real-time tracking for ongoing workouts
    stopOngoingWorkoutTracking(): void {
        if (this.ongoingWorkoutInterval) {
            console.log('🛑 WorkoutStateManager: Stopping ongoing workout tracking')
            clearInterval(this.ongoingWorkoutInterval)
            this.ongoingWorkoutInterval = null
        }
    }

    // Debug current state
    debugState(): void {
        console.log('🔍 WorkoutStateManager Debug:', {
            state: this.state,
            listenersCount: this.listeners.size,
            hasUpdatePromise: !!this.updatePromise
        })
    }
}

// Global instance
export const workoutStateManager = new WorkoutStateManager()

// Convenience functions for common operations
export const refreshWorkoutRings = () => workoutStateManager.refreshAll(true)
export const subscribeToWorkoutState = (listener: StateListener) => workoutStateManager.subscribe(listener)
export const handleWorkoutCompletion = (source: string, data?: unknown) => workoutStateManager.handleWorkoutCompleted(source, data)
