// Debug helper for ongoing workout issues
import { WorkoutStorage } from './workout-storage'
import { GoalProgressCalculator } from './goal-progress'
import { workoutStateManager } from './workout-state-manager'

export class WorkoutDebugHelper {
    static async debugOngoingWorkout(): Promise<void> {
        console.log('🔍 === ONGOING WORKOUT DEBUG ===')

        try {
            // Check ongoing workout
            const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
            console.log('📊 Ongoing Workout:', ongoingWorkout)

            if (ongoingWorkout) {
                const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                console.log('⏱️ Background Elapsed Time:', backgroundElapsedTime, 'seconds')
                console.log('⏱️ Stored Elapsed Time:', ongoingWorkout.elapsedTime, 'seconds')
                console.log('⏱️ Time Difference:', Math.abs(backgroundElapsedTime - ongoingWorkout.elapsedTime), 'seconds')

                // Check if workout is running
                if (ongoingWorkout.isRunning) {
                    console.log('✅ Workout is marked as running')

                    // Check start time
                    const startTime = new Date(ongoingWorkout.startTime)
                    const now = new Date()
                    const timeSinceStart = Math.floor((now.getTime() - startTime.getTime()) / 1000)
                    console.log('🕐 Start Time:', startTime.toISOString())
                    console.log('🕐 Current Time:', now.toISOString())
                    console.log('🕐 Time Since Start:', timeSinceStart, 'seconds')

                    // Check if tracking is active
                    const state = workoutStateManager.getState()
                    console.log('🔄 State Manager State:', {
                        hasGoalProgress: !!state.goalProgress,
                        isLoading: state.isLoading,
                        lastUpdate: state.lastUpdate,
                        timeSinceLastUpdate: Date.now() - state.lastUpdate
                    })

                } else {
                    console.log('❌ Workout is NOT running - this is why rings aren\'t updating!')
                }
            } else {
                console.log('❌ No ongoing workout found')
            }

            // Check goal progress
            try {
                const progress = await GoalProgressCalculator.calculateDailyProgress(true, true)
                console.log('🎯 Goal Progress:', progress)
            } catch (error) {
                console.error('❌ Goal progress calculation failed:', error)
            }

        } catch (error) {
            console.error('❌ Debug failed:', error)
        }

        console.log('🔍 === END DEBUG ===')
    }

    static async forceUpdateRings(): Promise<void> {
        console.log('🔄 === FORCE UPDATE RINGS ===')

        try {
            // Force refresh the workout state manager
            await workoutStateManager.refreshAll(true, true)
            console.log('✅ Forced refresh completed')

            // Check if tracking is running
            const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
            if (ongoingWorkout && ongoingWorkout.isRunning) {
                console.log('🚀 Starting tracking if not already running...')
                workoutStateManager.startOngoingWorkoutTracking()
            }

        } catch (error) {
            console.error('❌ Force update failed:', error)
        }

        console.log('🔄 === END FORCE UPDATE ===')
    }

    static logCurrentState(): void {
        console.log('📊 === CURRENT STATE ===')

        // Log localStorage
        const localStorageData = localStorage.getItem('ongoing-workout')
        console.log('💾 LocalStorage:', localStorageData ? 'Present' : 'Missing')

        if (localStorageData) {
            try {
                const parsed = JSON.parse(localStorageData)
                console.log('💾 Parsed Data:', parsed)
            } catch (error) {
                console.error('💾 Parse Error:', error)
            }
        }

        // Log state manager
        const state = workoutStateManager.getState()
        console.log('🔄 State Manager:', state)

        console.log('📊 === END STATE ===')
    }
}

// Global debug functions
export const debugOngoingWorkout = () => WorkoutDebugHelper.debugOngoingWorkout()
export const forceUpdateRings = () => WorkoutDebugHelper.forceUpdateRings()
export const logCurrentState = () => WorkoutDebugHelper.logCurrentState()
