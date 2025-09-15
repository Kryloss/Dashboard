// Centralized workout state management for real-time ring updates
import { GoalProgressCalculator, DailyGoalProgress } from './goal-progress'
import { WorkoutStorage } from './workout-storage'

export interface WorkoutState {
    goalProgress: DailyGoalProgress | null
    recentActivities: any[]
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
    async refreshAll(force = false): Promise<void> {
        // Prevent concurrent updates
        if (this.updatePromise && !force) {
            return this.updatePromise
        }

        this.updatePromise = this.performRefresh()
        await this.updatePromise
        this.updatePromise = null
    }

    private async performRefresh(): Promise<void> {
        console.log('🔄 WorkoutStateManager: Starting refresh...')
        
        this.setState({ isLoading: true })

        try {
            // Invalidate cache to ensure fresh data
            GoalProgressCalculator.invalidateCache()

            // Get fresh goal progress
            const goalProgress = await GoalProgressCalculator.calculateDailyProgress(true)
            
            // Get recent activities
            const recentActivities = await WorkoutStorage.getRecentActivities(5)

            this.setState({
                goalProgress,
                recentActivities,
                isLoading: false,
                lastUpdate: Date.now()
            })

            console.log('✅ WorkoutStateManager: Refresh completed', {
                goalProgress: goalProgress ? {
                    exercise: Math.round(goalProgress.exercise.progress * 100),
                    nutrition: Math.round(goalProgress.nutrition.progress * 100),
                    recovery: Math.round(goalProgress.recovery.progress * 100)
                } : null,
                activitiesCount: recentActivities.length
            })

        } catch (error) {
            console.error('❌ WorkoutStateManager: Refresh failed', error)
            this.setState({ isLoading: false })
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
    async handleWorkoutCompleted(source: string, workoutData?: any): Promise<void> {
        console.log('🎯 WorkoutStateManager: Workout completed', { source, workoutData })
        
        // Force immediate refresh
        await this.refreshAll(true)
        
        // Also schedule a delayed refresh to catch any async updates
        setTimeout(() => {
            this.refreshAll(true)
        }, 1000)
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
export const handleWorkoutCompletion = (source: string, data?: any) => workoutStateManager.handleWorkoutCompleted(source, data)
