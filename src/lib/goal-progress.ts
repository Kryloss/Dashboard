// Goal progress calculation logic for daily fitness rings
import { WorkoutStorage } from './workout-storage'
import { UserDataStorage, UserGoals } from './user-data-storage'

export interface DailyGoalProgress {
    exercise: {
        progress: number // 0-1
        currentMinutes: number
        targetMinutes: number
        sessionCount: number
        sessions: Array<{
            duration: number // minutes
            type: string
            completedAt: string
        }>
    }
    nutrition: {
        progress: number // 0-1
        currentCalories: number
        targetCalories: number
        placeholder: boolean
    }
    recovery: {
        progress: number // 0-1
        currentHours: number
        targetHours: number
        placeholder: boolean
    }
}

// Cache for goal progress calculations
interface ProgressCache {
    date: string
    data: DailyGoalProgress
    timestamp: number
}

export class GoalProgressCalculator {
    private static cache: ProgressCache | null = null
    private static readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for more responsive updates

    // Get today's date in user's local timezone
    static getTodayDateString(): string {
        const today = new Date()

        // Use the same date calculation method as UserDataStorage
        // This ensures consistency between data saving and retrieval
        const todayString = today.toISOString().split('T')[0]

        console.log('🔍 Debug - Today date calculation:', {
            rawDate: today,
            isoString: today.toISOString(),
            splitResult: todayString,
            localeDateString: today.toLocaleDateString('en-CA'),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: today.getTimezoneOffset()
        })
        return todayString // YYYY-MM-DD format consistent with UserDataStorage
    }

    // Get start and end of today in user's local timezone
    static getTodayBounds(): { startOfDay: Date; endOfDay: Date } {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

        return { startOfDay, endOfDay }
    }

    // Check if a workout was completed today
    static isWorkoutToday(completedAt: string): boolean {
        const workoutDate = new Date(completedAt)
        const { startOfDay, endOfDay } = this.getTodayBounds()

        return workoutDate >= startOfDay && workoutDate <= endOfDay
    }

    // Calculate exercise progress from today's completed workouts
    static async calculateExerciseProgress(userGoals: UserGoals, includeOngoingWorkout = false): Promise<DailyGoalProgress['exercise']> {
        try {
            // Get activities with optimized query (reduced limit for performance)
            const allActivities = await WorkoutStorage.getWorkoutActivities(50, 0)

            console.log('🔍 GoalProgress Debug - Exercise calculation:', {
                totalActivities: allActivities.length,
                todayDateString: this.getTodayDateString(),
                todayBounds: this.getTodayBounds(),
                activities: allActivities.map(a => ({
                    id: a.id,
                    completedAt: a.completedAt,
                    durationSeconds: a.durationSeconds,
                    isToday: this.isWorkoutToday(a.completedAt)
                }))
            })

            // Filter for today's workouts
            const todayWorkouts = allActivities.filter(activity =>
                this.isWorkoutToday(activity.completedAt)
            )

            // Calculate total minutes and sessions from completed workouts
            let totalMinutes = todayWorkouts.reduce((sum, workout) => {
                return sum + Math.round(workout.durationSeconds / 60)
            }, 0)

            let sessionCount = todayWorkouts.length

            // Include ongoing workout time if requested
            if (includeOngoingWorkout) {
                const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (ongoingWorkout && ongoingWorkout.isRunning) {
                    // Use real-time elapsed time for accurate live progress
                    const realTimeElapsedSeconds = WorkoutStorage.getBackgroundElapsedTime()
                    const ongoingMinutes = Math.round(realTimeElapsedSeconds / 60)
                    console.log('🏃 GoalProgress: Including ongoing workout', {
                        workoutType: ongoingWorkout.type,
                        elapsedSeconds: realTimeElapsedSeconds,
                        elapsedMinutes: ongoingMinutes,
                        totalMinutesBefore: totalMinutes,
                        totalMinutesAfter: totalMinutes + ongoingMinutes
                    })
                    totalMinutes += ongoingMinutes
                    sessionCount += 1 // Count ongoing workout as an active session
                }
            }

            const targetMinutes = userGoals.dailyExerciseMinutes
            const progress = Math.min(totalMinutes / targetMinutes, 1.0)

            // Create session data for ring segments
            const sessions = todayWorkouts.map(workout => ({
                duration: Math.round(workout.durationSeconds / 60),
                type: workout.workoutType,
                completedAt: workout.completedAt
            }))

            // Add ongoing workout session if included
            if (includeOngoingWorkout) {
                const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (ongoingWorkout && ongoingWorkout.isRunning) {
                    // Use real-time elapsed time for accurate session duration
                    const realTimeElapsedSeconds = WorkoutStorage.getBackgroundElapsedTime()
                    sessions.push({
                        duration: Math.round(realTimeElapsedSeconds / 60),
                        type: ongoingWorkout.type,
                        completedAt: ongoingWorkout.startTime // Use start time for ongoing workouts
                    })
                }
            }

            return {
                progress,
                currentMinutes: totalMinutes,
                targetMinutes,
                sessionCount,
                sessions
            }
        } catch (error) {
            console.error('Error calculating exercise progress:', error)

            // Return safe defaults on error
            return {
                progress: 0,
                currentMinutes: 0,
                targetMinutes: userGoals.dailyExerciseMinutes,
                sessionCount: 0,
                sessions: []
            }
        }
    }

    // Calculate nutrition progress (placeholder for now)
    static calculateNutritionProgress(userGoals: UserGoals): DailyGoalProgress['nutrition'] {
        // Placeholder logic - can be enhanced later with actual calorie tracking
        const targetCalories = userGoals.dailyCalories

        // For now, return a placeholder progress based on time of day
        // This gives users a visual indication that the ring works
        const now = new Date()
        const hoursIntoDay = now.getHours() + (now.getMinutes() / 60)
        const timeBasedProgress = Math.min(hoursIntoDay / 24, 1.0) * 0.6 // Max 60% from time

        const currentCalories = Math.round(targetCalories * timeBasedProgress)

        return {
            progress: timeBasedProgress,
            currentCalories,
            targetCalories,
            placeholder: true
        }
    }

    // Calculate recovery progress using actual sleep data
    static async calculateRecoveryProgress(userGoals: UserGoals): Promise<DailyGoalProgress['recovery']> {
        const targetHours = userGoals.sleepHours

        try {
            // Get today's sleep data
            const todayDate = this.getTodayDateString()
            const sleepData = await UserDataStorage.getSleepData(todayDate)

            console.log('🔍 GoalProgress Debug - Recovery calculation:', {
                todayDate,
                targetHours,
                sleepData: sleepData ? {
                    id: sleepData.id,
                    date: sleepData.date,
                    totalMinutes: sleepData.totalMinutes,
                    sessions: sleepData.sessions.length,
                    actualHours: sleepData.totalMinutes / 60
                } : 'NO_SLEEP_DATA_FOUND'
            })

            // Additional debug: Check if sleep data exists for nearby dates
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const tomorrowString = tomorrow.toISOString().split('T')[0]

            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayString = yesterday.toISOString().split('T')[0]

            console.log('🔍 GoalProgress Debug - Date availability check:', {
                today: todayDate,
                tomorrow: tomorrowString,
                yesterday: yesterdayString
            })

            if (sleepData && sleepData.totalMinutes > 0) {
                // We have actual sleep data for today
                const actualHours = sleepData.totalMinutes / 60
                const progress = Math.min(actualHours / targetHours, 1.0)

                return {
                    progress,
                    currentHours: actualHours,
                    targetHours,
                    placeholder: false
                }
            }

            // Check yesterday's sleep data (if it's early in the day)
            const now = new Date()
            const hoursIntoDay = now.getHours() + (now.getMinutes() / 60)

            if (hoursIntoDay < 12) { // Before noon, check yesterday's sleep
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                const yesterdayDate = yesterday.toLocaleDateString('en-CA')

                const yesterdaySleep = await UserDataStorage.getSleepData(yesterdayDate)
                if (yesterdaySleep && yesterdaySleep.totalMinutes > 0) {
                    const actualHours = yesterdaySleep.totalMinutes / 60
                    const progress = Math.min(actualHours / targetHours, 1.0)

                    return {
                        progress,
                        currentHours: actualHours,
                        targetHours,
                        placeholder: false
                    }
                }
            }

            // No sleep data available, fall back to placeholder logic
            let timeBasedProgress = 0

            if (hoursIntoDay >= 6 && hoursIntoDay < 12) {
                // Morning: assume got some sleep last night
                timeBasedProgress = 0.7 // 70% as if slept 7 hours out of 8
            } else if (hoursIntoDay >= 12) {
                // Afternoon/evening: gradually increase recovery
                timeBasedProgress = Math.min(0.7 + ((hoursIntoDay - 12) / 12) * 0.3, 1.0)
            } else {
                // Very early morning: low recovery
                timeBasedProgress = 0.2
            }

            const currentHours = targetHours * timeBasedProgress

            return {
                progress: timeBasedProgress,
                currentHours,
                targetHours,
                placeholder: true
            }
        } catch (error) {
            console.error('Error calculating recovery progress:', error)

            // Return safe placeholder on error
            const timeBasedProgress = 0.5
            return {
                progress: timeBasedProgress,
                currentHours: targetHours * timeBasedProgress,
                targetHours,
                placeholder: true
            }
        }
    }

    // Check if cache is valid
    private static isCacheValid(): boolean {
        if (!this.cache) return false

        const now = Date.now()
        const isExpired = now - this.cache.timestamp > this.CACHE_DURATION
        const isDifferentDay = this.cache.date !== this.getTodayDateString()

        return !isExpired && !isDifferentDay
    }

    // Main function to calculate all daily progress with caching
    static async calculateDailyProgress(forceRefresh = false, includeOngoingWorkout = false): Promise<DailyGoalProgress | null> {
        try {
            // Return cached data if valid and not forcing refresh, but not if we need ongoing workout data
            if (!forceRefresh && !includeOngoingWorkout && this.isCacheValid()) {
                console.log('🔍 GoalProgress Debug - Using cached data:', this.cache!.data)
                return this.cache!.data
            }

            console.log('🔄 GoalProgress Debug - Starting fresh calculation', { forceRefresh, includeOngoingWorkout })

            // Get user goals
            const userGoals = await UserDataStorage.getUserGoals()
            console.log('🔍 GoalProgress Debug - User goals:', userGoals)

            if (!userGoals) {
                console.warn('No user goals found for progress calculation')
                return null
            }

            // Calculate each ring's progress
            const exercise = await this.calculateExerciseProgress(userGoals, includeOngoingWorkout)
            const nutrition = this.calculateNutritionProgress(userGoals)
            const recovery = await this.calculateRecoveryProgress(userGoals)

            const result = {
                exercise,
                nutrition,
                recovery
            }

            // Update cache
            this.cache = {
                date: this.getTodayDateString(),
                data: result,
                timestamp: Date.now()
            }

            return result
        } catch (error) {
            console.error('Error calculating daily progress:', error)
            return null
        }
    }

    // Invalidate cache (call when workout data changes)
    static invalidateCache(): void {
        this.cache = null
    }

    // Refresh progress and notify listeners (for real-time updates)
    static async refreshProgress(): Promise<DailyGoalProgress | null> {
        return this.calculateDailyProgress(true) // Force refresh for real-time updates
    }

    // Get progress for specific date (future enhancement)
    static async getProgressForDate(dateString: string): Promise<DailyGoalProgress | null> {
        // For now, only support today
        if (dateString === this.getTodayDateString()) {
            return this.calculateDailyProgress()
        }

        // Future: implement historical progress calculation
        console.warn('Historical progress calculation not yet implemented')
        return null
    }

    // Utility to format progress percentage
    static formatProgressPercentage(progress: number): string {
        return `${Math.round(progress * 100)}%`
    }

    // Utility to format time duration
    static formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes}m`
        }

        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60

        if (remainingMinutes === 0) {
            return `${hours}h`
        }

        return `${hours}h ${remainingMinutes}m`
    }

    // Debug function to log current progress
    static async debugProgress(): Promise<void> {
        // Force cache invalidation for fresh data
        this.invalidateCache()

        const progress = await this.calculateDailyProgress(true) // Force refresh
        if (progress) {
            console.log('🎯 Daily Goal Progress Debug:')
            console.log('Exercise:', {
                progress: this.formatProgressPercentage(progress.exercise.progress),
                current: `${progress.exercise.currentMinutes}m`,
                target: `${progress.exercise.targetMinutes}m`,
                sessions: progress.exercise.sessionCount
            })
            console.log('Nutrition:', {
                progress: this.formatProgressPercentage(progress.nutrition.progress),
                current: `${progress.nutrition.currentCalories} cal`,
                target: `${progress.nutrition.targetCalories} cal`,
                placeholder: progress.nutrition.placeholder
            })
            console.log('Recovery:', {
                progress: this.formatProgressPercentage(progress.recovery.progress),
                current: `${progress.recovery.currentHours.toFixed(1)}h`,
                target: `${progress.recovery.targetHours}h`,
                placeholder: progress.recovery.placeholder
            })
        } else {
            console.log('❌ No progress data available')
        }
    }

    // Debug function to check localStorage data directly
    static debugLocalStorageData(): void {
        if (typeof window === 'undefined') {
            console.log('❌ Not in browser context')
            return
        }

        const todayDate = this.getTodayDateString()
        console.log('🔍 Debug localStorage data for date:', todayDate)

        // Check sleep data
        const sleepKey = `UserDataStorage-sleep_data-${todayDate}`
        const sleepData = localStorage.getItem(sleepKey)
        console.log('Sleep data key:', sleepKey)
        console.log('Sleep data value:', sleepData ? JSON.parse(sleepData) : 'NOT_FOUND')

        // Check all sleep data keys
        const allKeys = Object.keys(localStorage)
        const sleepKeys = allKeys.filter(key => key.includes('sleep_data'))
        console.log('All sleep data keys in localStorage:', sleepKeys)

        // Check workout activities
        const workoutKey = 'WorkoutStorage-activities'
        const workoutData = localStorage.getItem(workoutKey)
        console.log('Workout activities:', workoutData ? JSON.parse(workoutData) : 'NOT_FOUND')
    }
}

// Make debug functions available globally for browser console debugging
if (typeof window !== 'undefined') {
    const globalWindow = window as typeof window & {
        debugGoalProgress?: () => Promise<void>
        debugLocalStorage?: () => void
        forceRefreshRings?: () => Promise<DailyGoalProgress | null>
    }

    globalWindow.debugGoalProgress = () => GoalProgressCalculator.debugProgress()
    globalWindow.debugLocalStorage = () => GoalProgressCalculator.debugLocalStorageData()
    globalWindow.forceRefreshRings = async () => {
        GoalProgressCalculator.invalidateCache()
        const progress = await GoalProgressCalculator.calculateDailyProgress(true)
        console.log('🔄 Force refreshed goal progress:', progress)
        return progress
    }
}