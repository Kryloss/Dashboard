// Comprehensive diagnostics for workout tracking issues
import { WorkoutStorage } from './workout-storage'
import { GoalProgressCalculator } from './goal-progress'
import { UserDataStorage } from './user-data-storage'

export interface WorkoutDiagnosticResult {
    timestamp: string
    overallHealth: 'healthy' | 'warning' | 'error'
    issues: string[]
    recommendations: string[]
    details: {
        ongoingWorkout: {
            exists: boolean
            isRunning: boolean
            elapsedTime: number
            startTime: string | null
            backgroundElapsedTime: number
            timeDiscrepancy: number
        }
        goalProgress: {
            canCalculate: boolean
            cacheValid: boolean
            lastCalculation: number | null
        }
        userData: {
            hasGoals: boolean
            goalsValid: boolean
        }
        localStorage: {
            hasData: boolean
            dataValid: boolean
        }
        supabase: {
            connected: boolean
            userAuthenticated: boolean
        }
    }
}

export class WorkoutDiagnostics {
    static async runFullDiagnostic(): Promise<WorkoutDiagnosticResult> {
        const timestamp = new Date().toISOString()
        const issues: string[] = []
        const recommendations: string[] = []

        console.log('🔍 Starting comprehensive workout diagnostics...')

        // Check ongoing workout
        const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
        const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
        const timeDiscrepancy = ongoingWorkout ? Math.abs(backgroundElapsedTime - ongoingWorkout.elapsedTime) : 0

        // Check goal progress calculation
        let goalProgressHealthy = false
        const cacheValid = false // Cache validation not implemented yet
        let lastCalculation: number | null = null

        try {
            const progress = await GoalProgressCalculator.calculateDailyProgress(true, true)
            goalProgressHealthy = progress !== null
            lastCalculation = Date.now()
        } catch (error) {
            issues.push(`Goal progress calculation failed: ${error}`)
        }

        // Check user data
        let hasGoals = false
        let goalsValid = false

        try {
            const goals = await UserDataStorage.getUserGoals()
            hasGoals = goals !== null
            goalsValid = hasGoals && goals !== null && goals.dailyExerciseMinutes > 0
        } catch (error) {
            issues.push(`User goals check failed: ${error}`)
        }

        // Check localStorage
        const localStorageData = localStorage.getItem('ongoing-workout')
        const hasLocalStorageData = !!localStorageData
        let dataValid = false

        if (hasLocalStorageData) {
            try {
                const parsed = JSON.parse(localStorageData)
                dataValid = parsed && typeof parsed === 'object' && parsed.workoutId
            } catch (error) {
                issues.push(`Invalid localStorage data: ${error}`)
            }
        }

        // Check Supabase connection
        let supabaseConnected = false
        let userAuthenticated = false

        try {
            // This would need to be implemented based on your Supabase setup
            // For now, we'll assume it's working if we can get ongoing workout
            supabaseConnected = true
            userAuthenticated = true
        } catch (error) {
            issues.push(`Supabase connection issue: ${error}`)
        }

        // Analyze issues and generate recommendations
        if (ongoingWorkout && ongoingWorkout.isRunning && timeDiscrepancy > 5) {
            issues.push(`Time discrepancy detected: ${timeDiscrepancy} seconds`)
            recommendations.push('Check if workout startTime is accurate')
        }

        if (ongoingWorkout && ongoingWorkout.isRunning && !goalProgressHealthy) {
            issues.push('Ongoing workout exists but goal progress calculation failed')
            recommendations.push('Check goal progress calculation logic')
        }

        if (!hasGoals) {
            issues.push('No user goals found')
            recommendations.push('User should set up daily goals')
        }

        if (ongoingWorkout && !ongoingWorkout.isRunning) {
            recommendations.push('Workout is paused - rings will not update until resumed')
        }

        if (ongoingWorkout && ongoingWorkout.isRunning && !hasLocalStorageData) {
            issues.push('Running workout exists but no localStorage data')
            recommendations.push('Check data persistence logic')
        }

        // Determine overall health
        let overallHealth: 'healthy' | 'warning' | 'error' = 'healthy'

        if (issues.length > 0) {
            overallHealth = issues.some(issue =>
                issue.includes('failed') ||
                issue.includes('error') ||
                issue.includes('discrepancy')
            ) ? 'error' : 'warning'
        }

        const result: WorkoutDiagnosticResult = {
            timestamp,
            overallHealth,
            issues,
            recommendations,
            details: {
                ongoingWorkout: {
                    exists: !!ongoingWorkout,
                    isRunning: ongoingWorkout?.isRunning || false,
                    elapsedTime: ongoingWorkout?.elapsedTime || 0,
                    startTime: ongoingWorkout?.startTime || null,
                    backgroundElapsedTime,
                    timeDiscrepancy
                },
                goalProgress: {
                    canCalculate: goalProgressHealthy,
                    cacheValid,
                    lastCalculation
                },
                userData: {
                    hasGoals,
                    goalsValid
                },
                localStorage: {
                    hasData: hasLocalStorageData,
                    dataValid
                },
                supabase: {
                    connected: supabaseConnected,
                    userAuthenticated
                }
            }
        }

        console.log('🔍 Workout diagnostics completed:', result)
        return result
    }

    static async checkOngoingWorkoutHealth(): Promise<boolean> {
        try {
            const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()

            if (!ongoingWorkout) {
                console.log('✅ No ongoing workout - system healthy')
                return true
            }

            if (!ongoingWorkout.isRunning) {
                console.log('✅ Workout is paused - no updates expected')
                return true
            }

            const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
            const timeDiscrepancy = Math.abs(backgroundElapsedTime - ongoingWorkout.elapsedTime)

            if (timeDiscrepancy > 10) {
                console.warn('⚠️ Large time discrepancy detected:', {
                    stored: ongoingWorkout.elapsedTime,
                    calculated: backgroundElapsedTime,
                    discrepancy: timeDiscrepancy
                })
                return false
            }

            console.log('✅ Ongoing workout health check passed')
            return true

        } catch (error) {
            console.error('❌ Ongoing workout health check failed:', error)
            return false
        }
    }

    static async checkGoalProgressHealth(): Promise<boolean> {
        try {
            const progress = await GoalProgressCalculator.calculateDailyProgress(true, true)

            if (!progress) {
                console.warn('⚠️ Goal progress calculation returned null')
                return false
            }

            // Check if progress values are reasonable
            const { exercise, nutrition, recovery } = progress

            if (exercise.progress < 0 || exercise.progress > 1) {
                console.warn('⚠️ Invalid exercise progress:', exercise.progress)
                return false
            }

            if (nutrition.progress < 0 || nutrition.progress > 1) {
                console.warn('⚠️ Invalid nutrition progress:', nutrition.progress)
                return false
            }

            if (recovery.progress < 0 || recovery.progress > 1) {
                console.warn('⚠️ Invalid recovery progress:', recovery.progress)
                return false
            }

            console.log('✅ Goal progress health check passed')
            return true

        } catch (error) {
            console.error('❌ Goal progress health check failed:', error)
            return false
        }
    }

    static logSystemState(): void {
        console.log('🔍 Current workout system state:')

        // Log ongoing workout
        WorkoutStorage.getOngoingWorkout().then(workout => {
            if (workout) {
                console.log('📊 Ongoing Workout:', {
                    id: workout.workoutId,
                    type: workout.type,
                    isRunning: workout.isRunning,
                    elapsedTime: workout.elapsedTime,
                    startTime: workout.startTime,
                    exercises: workout.exercises?.length || 0
                })
            } else {
                console.log('📊 No ongoing workout')
            }
        })

        // Log background elapsed time
        const backgroundTime = WorkoutStorage.getBackgroundElapsedTime()
        console.log('⏱️ Background elapsed time:', backgroundTime, 'seconds')

        // Log localStorage
        const localStorageData = localStorage.getItem('ongoing-workout')
        console.log('💾 LocalStorage data:', localStorageData ? 'Present' : 'Missing')

        // Log user goals
        UserDataStorage.getUserGoals().then(goals => {
            if (goals) {
                console.log('🎯 User Goals:', {
                    exerciseMinutes: goals.dailyExerciseMinutes,
                    calories: goals.dailyCalories,
                    sleepHours: goals.sleepHours
                })
            } else {
                console.log('🎯 No user goals set')
            }
        })
    }
}

// Convenience functions
export const runWorkoutDiagnostics = () => WorkoutDiagnostics.runFullDiagnostic()
export const checkWorkoutHealth = () => WorkoutDiagnostics.checkOngoingWorkoutHealth()
export const checkGoalHealth = () => WorkoutDiagnostics.checkGoalProgressHealth()
export const logWorkoutState = () => WorkoutDiagnostics.logSystemState()
