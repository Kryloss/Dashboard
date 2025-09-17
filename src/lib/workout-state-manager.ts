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
    private readonly ONGOING_WORKOUT_UPDATE_INTERVAL = 30000 // Update every 30 seconds for better responsiveness

    // Activity history polling
    private activityPollingInterval: NodeJS.Timeout | null = null
    private readonly ACTIVITY_POLLING_INTERVAL = 10000 // Check activity history every 10 seconds

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
        // Don't set loading if we already have data
        const hasExistingData = this.state.goalProgress !== null || this.state.recentActivities.length > 0
        if (!hasExistingData) {
            this.setState({ isLoading: true })
        }

        try {
            // Invalidate cache for fresh data
            if (!includeOngoingWorkout) {
                GoalProgressCalculator.invalidateCache()
            }

            // Get fresh goal progress and activities
            const goalProgress = await GoalProgressCalculator.calculateDailyProgress(true, includeOngoingWorkout)
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

        } catch (error) {
            console.error('WorkoutStateManager refresh failed:', error)
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

    // Handle workout completion (simplified)
    async handleWorkoutCompleted(): Promise<void> {
        // Stop ongoing workout tracking since workout is completed
        this.stopOngoingWorkoutTracking()
        // Note: Activity polling will pick up the new logged workout
    }

    // Handle workout deletion
    async handleWorkoutDeleted(): Promise<void> {
        await this.refreshAll(true)
    }

    // Handle workout update
    async handleWorkoutUpdated(): Promise<void> {
        await this.refreshAll(true)
    }

    // Start real-time tracking for ongoing workouts
    startOngoingWorkoutTracking(): void {
        this.stopOngoingWorkoutTracking()
        this.checkAndUpdateOngoingWorkout()
        this.ongoingWorkoutInterval = setInterval(() => {
            this.checkAndUpdateOngoingWorkout()
        }, this.ONGOING_WORKOUT_UPDATE_INTERVAL)
    }

    // Check and update ongoing workout
    private async checkAndUpdateOngoingWorkout(): Promise<void> {
        try {
            const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
            if (ongoingWorkout && ongoingWorkout.isRunning) {
                GoalProgressCalculator.invalidateCache()
                await this.refreshAll(true, true)
            } else {
                this.stopOngoingWorkoutTracking()
            }
        } catch (error) {
            console.error('Error in ongoing workout tracking:', error)
        }
    }

    // Stop real-time tracking for ongoing workouts
    stopOngoingWorkoutTracking(): void {
        if (this.ongoingWorkoutInterval) {
            clearInterval(this.ongoingWorkoutInterval)
            this.ongoingWorkoutInterval = null
        }
    }

    // Start activity history polling
    startActivityPolling(): void {
        this.stopActivityPolling()
        this.activityPollingInterval = setInterval(async () => {
            await this.checkActivityHistory()
        }, this.ACTIVITY_POLLING_INTERVAL)

        // Run initial check
        this.checkActivityHistory()
    }

    // Stop activity history polling
    stopActivityPolling(): void {
        if (this.activityPollingInterval) {
            clearInterval(this.activityPollingInterval)
            this.activityPollingInterval = null
        }
    }

    // Check for new activities and update goal progress
    private async checkActivityHistory(): Promise<void> {
        try {
            const recentActivities = await WorkoutStorage.getRecentActivities(5)
            const lastUpdateTime = this.state.lastUpdate

            // Check if there are any new activities since last update
            const hasNewActivities = recentActivities.some(activity => {
                const activityTime = new Date(activity.completedAt).getTime()
                return activityTime > lastUpdateTime
            })

            if (hasNewActivities) {
                GoalProgressCalculator.invalidateCache()
                await this.refreshAll(true)
            }
        } catch (error) {
            console.error('Error checking activity history:', error)
        }
    }

    // Force refresh for debugging
    async forceRefreshOngoingWorkout(): Promise<void> {
        try {
            const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
            if (ongoingWorkout && ongoingWorkout.isRunning) {
                GoalProgressCalculator.invalidateCache()
                await this.refreshAll(true, true)
                await this.checkAndUpdateOngoingWorkout()
            }
        } catch (error) {
            console.error('Force refresh failed:', error)
        }
    }

    // Debug current state
    debugState(): void {
        console.log('WorkoutStateManager:', {
            isLoading: this.state.isLoading,
            hasGoalProgress: !!this.state.goalProgress,
            activitiesCount: this.state.recentActivities.length,
            listenersCount: this.listeners.size,
            hasOngoingInterval: !!this.ongoingWorkoutInterval
        })
    }
}

// Global instance
export const workoutStateManager = new WorkoutStateManager()

// Convenience functions for common operations
export const refreshWorkoutRings = () => workoutStateManager.refreshAll(true)
export const subscribeToWorkoutState = (listener: StateListener) => workoutStateManager.subscribe(listener)
export const handleWorkoutCompletion = () => workoutStateManager.handleWorkoutCompleted()
export const forceRefreshOngoingWorkout = () => workoutStateManager.forceRefreshOngoingWorkout()
export const debugWorkoutState = () => workoutStateManager.debugState()
