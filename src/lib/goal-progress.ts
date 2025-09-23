// Goal progress calculation logic for daily fitness rings
import { WorkoutStorage } from './workout-storage'
import { UserDataStorage, UserGoals } from './user-data-storage'

export interface DailyWorkoutSummary {
    date: string // YYYY-MM-DD format
    totalMinutes: number
    sessionCount: number
    activities: Array<{
        id: string
        duration: number // minutes
        type: string
        completedAt: string
        name?: string
    }>
}

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

// User-specific cache manager to prevent data leakage between users
class UserCacheManager {
    private static caches = new Map<string, ProgressCache>()
    private static readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for more responsive updates

    static getCache(userId: string): ProgressCache | null {
        return this.caches.get(userId) || null
    }

    static setCache(userId: string, cache: ProgressCache): void {
        this.caches.set(userId, cache)
    }

    static invalidateUser(userId: string): void {
        this.caches.delete(userId)
    }

    static isCacheValid(userId: string, todayDate: string): boolean {
        const cache = this.getCache(userId)
        if (!cache) return false

        const now = Date.now()
        const isExpired = now - cache.timestamp > this.CACHE_DURATION
        const isDifferentDay = cache.date !== todayDate

        return !isExpired && !isDifferentDay
    }

    static clearAll(): void {
        this.caches.clear()
    }
}

export class GoalProgressCalculator {
    private static readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for more responsive updates

    // Format Date to YYYY-MM-DD in the user's local timezone (not UTC)
    private static formatDateLocal(date: Date): string {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Get today's date in user's local timezone
    static getTodayDateString(): string {
        const today = new Date()
        return this.formatDateLocal(today) // YYYY-MM-DD format in local time
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
        const workoutDateLocal = this.formatDateLocal(new Date(completedAt))
        const todayDate = this.getTodayDateString()
        return workoutDateLocal === todayDate
    }


    // Calculate exercise progress from today's completed workouts
    static async calculateExerciseProgress(userGoals: UserGoals, includeOngoingWorkout = false): Promise<DailyGoalProgress['exercise']> {
        try {
            // Get all activities and filter for today
            const allActivities = await WorkoutStorage.getWorkoutActivities(50, 0)
            const todayDate = this.getTodayDateString()
            const todayWorkouts = allActivities.filter(activity => {
                const workoutDateLocal = this.formatDateLocal(new Date(activity.completedAt))
                return workoutDateLocal === todayDate
            })


            let totalMinutes = todayWorkouts.reduce((sum, workout) => {
                return sum + Math.round(workout.durationSeconds / 60)
            }, 0)

            let sessionCount = todayWorkouts.length

            // Include ongoing workout if requested
            if (includeOngoingWorkout) {
                const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (ongoingWorkout && ongoingWorkout.isRunning) {
                    const realTimeElapsedSeconds = WorkoutStorage.getBackgroundElapsedTime()
                    const ongoingMinutes = Math.round(realTimeElapsedSeconds / 60)
                    totalMinutes += ongoingMinutes
                    sessionCount += 1
                }
            }

            const targetMinutes = userGoals.dailyExerciseMinutes
            const progress = Math.min(totalMinutes / targetMinutes, 1.0)

            // Create sessions for ring segments
            const sessions = todayWorkouts.map(workout => ({
                duration: Math.round(workout.durationSeconds / 60),
                type: workout.workoutType,
                completedAt: workout.completedAt
            }))

            // Add ongoing workout session if included
            if (includeOngoingWorkout) {
                const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (ongoingWorkout && ongoingWorkout.isRunning) {
                    const realTimeElapsedSeconds = WorkoutStorage.getBackgroundElapsedTime()
                    sessions.push({
                        duration: Math.round(realTimeElapsedSeconds / 60),
                        type: ongoingWorkout.type,
                        completedAt: ongoingWorkout.startTime
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

    // Calculate recovery progress using actual sleep data (resets daily like exercise)
    static async calculateRecoveryProgress(userGoals: UserGoals): Promise<DailyGoalProgress['recovery']> {
        const targetHours = userGoals.sleepHours

        try {
            // Get today's sleep data only
            const todayDate = this.getTodayDateString()
            const sleepData = await UserDataStorage.getSleepData(todayDate)

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

            // No sleep data for today - start at 0 (like exercise ring)
            return {
                progress: 0,
                currentHours: 0,
                targetHours,
                placeholder: false
            }
        } catch (error) {
            console.error('Error calculating recovery progress:', error)

            // Return 0 on error (like exercise ring)
            return {
                progress: 0,
                currentHours: 0,
                targetHours,
                placeholder: false
            }
        }
    }

    // Main function to calculate all daily progress with caching
    static async calculateDailyProgress(forceRefresh = false, includeOngoingWorkout = false, userId?: string): Promise<DailyGoalProgress | null> {
        try {
            // Require userId for proper user isolation
            if (!userId) {
                console.warn('GoalProgressCalculator: userId not provided, cache disabled')
                // Continue without caching for backward compatibility
            }

            const todayDate = this.getTodayDateString()

            // Return cached data if valid and not forcing refresh
            if (!forceRefresh && !includeOngoingWorkout && userId && UserCacheManager.isCacheValid(userId, todayDate)) {
                const cachedData = UserCacheManager.getCache(userId)
                if (cachedData) {
                    return cachedData.data
                }
            }

            // Get user goals
            let userGoals = await UserDataStorage.getUserGoals()

            // If no goals exist, create default goals automatically
            if (!userGoals) {
                try {
                    userGoals = await UserDataStorage.saveUserGoals({
                        dailyExerciseMinutes: 30,
                        weeklyExerciseSessions: 3,
                        dailyCalories: 2000,
                        activityLevel: 'moderate',
                        sleepHours: 8.0,
                        recoveryMinutes: 60,
                        dietType: 'maintenance'
                    })
                } catch (error) {
                    console.error('Failed to create default goals:', error)
                    return null
                }
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

            // Update cache with user-specific data
            if (userId) {
                UserCacheManager.setCache(userId, {
                    date: todayDate,
                    data: result,
                    timestamp: Date.now()
                })
            }

            return result
        } catch (error) {
            console.error('Error calculating daily progress:', error)
            return null
        }
    }

    // Invalidate cache (call when workout data changes)
    static invalidateCache(userId?: string): void {
        if (userId) {
            UserCacheManager.invalidateUser(userId)
        } else {
            // Fallback: clear all caches if no userId provided
            console.warn('GoalProgressCalculator: invalidateCache called without userId, clearing all caches')
            UserCacheManager.clearAll()
        }
    }

    // Refresh progress and notify listeners (for real-time updates)
    static async refreshProgress(userId?: string): Promise<DailyGoalProgress | null> {
        return this.calculateDailyProgress(true, false, userId) // Force refresh for real-time updates
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

        // Check workout activities using correct key format
        const currentUser = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user
        const userSuffix = currentUser?.id ? `-${currentUser.id.slice(-8)}` : '-anonymous'
        const workoutKey = `healss-workout-activities${userSuffix}`
        const workoutData = localStorage.getItem(workoutKey)
        console.log('Workout activities key:', workoutKey)
        console.log('Workout activities:', workoutData ? JSON.parse(workoutData) : 'NOT_FOUND')

        // Also check old legacy key in case it exists
        const legacyKey = 'WorkoutStorage-activities'
        const legacyData = localStorage.getItem(legacyKey)
        console.log('Legacy workout activities:', legacyData ? JSON.parse(legacyData) : 'NOT_FOUND')
    }

    // Debug function to check all activities
    static async debugAllActivities() {
        console.log('🔍 Debugging all activities...')
        try {
            const { WorkoutStorage } = await import('./workout-storage')
            const activities = await WorkoutStorage.getWorkoutActivities(50, 0)
            console.log('📋 All activities:', activities.map(a => ({
                id: a.id,
                name: a.name,
                type: a.workoutType,
                completedAt: a.completedAt,
                completedAtDate: new Date(a.completedAt).toISOString().split('T')[0],
                duration: Math.round(a.durationSeconds / 60),
                userId: a.userId
            })))
            return activities
        } catch (error) {
            console.error('❌ Debug activities failed:', error)
            return { error: error instanceof Error ? error.message : String(error) }
        }
    }
}

// Make debug functions available globally for browser console debugging
if (typeof window !== 'undefined') {
    const globalWindow = window as typeof window & {
        debugGoalProgress?: () => Promise<void>
        debugLocalStorage?: () => void
        forceRefreshRings?: () => Promise<DailyGoalProgress | null>
        testExerciseCalculation?: () => Promise<{ userGoals: unknown; activities: unknown }>
        testWorkoutSummary?: () => Promise<unknown>
        testLocalStorageActivities?: () => Promise<{ rawData: unknown; activities: unknown }>
        quickDebugRings?: () => Promise<unknown>
        debugAllActivities?: () => Promise<unknown>
    }

    globalWindow.debugGoalProgress = () => GoalProgressCalculator.debugProgress()
    globalWindow.debugLocalStorage = () => GoalProgressCalculator.debugLocalStorageData()
    globalWindow.forceRefreshRings = async () => {
        GoalProgressCalculator.invalidateCache()
        const progress = await GoalProgressCalculator.calculateDailyProgress(true)
        console.log('🔄 Force refreshed goal progress:', progress)
        return progress
    }
    globalWindow.debugAllActivities = () => GoalProgressCalculator.debugAllActivities()

    globalWindow.testExerciseCalculation = async () => {
        const { UserDataStorage } = await import('./user-data-storage')
        const { WorkoutStorage } = await import('./workout-storage')

        console.log('🧪 Testing exercise calculation...')

        // Get user goals
        const userGoals = await UserDataStorage.getUserGoals()
        console.log('User goals:', userGoals)

        // Get all activities
        const activities = await WorkoutStorage.getWorkoutActivities(50, 0)
        console.log('All activities:', activities)

        // Test exercise calculation
        if (userGoals) {
            const exerciseResult = await GoalProgressCalculator.calculateExerciseProgress(userGoals, false)
            console.log('Exercise calculation result:', exerciseResult)
        }

        return { userGoals, activities }
    }

    globalWindow.testWorkoutSummary = async () => {
        console.log('🧪 Testing workout calculation...')

        const todayDate = GoalProgressCalculator.getTodayDateString()
        console.log('Today date:', todayDate)

        const progress = await GoalProgressCalculator.calculateDailyProgress(true)
        console.log('Progress:', progress?.exercise)

        return progress?.exercise
    }

    globalWindow.testLocalStorageActivities = async () => {
        const { WorkoutStorage } = await import('./workout-storage')

        console.log('🧪 Testing localStorage activities retrieval...')

        // Test direct localStorage access
        const currentUser = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user
        const userSuffix = currentUser?.id ? `-${currentUser.id.slice(-8)}` : '-anonymous'
        const activitiesKey = `healss-workout-activities${userSuffix}`
        const rawData = localStorage.getItem(activitiesKey)

        console.log('Raw localStorage data:', {
            key: activitiesKey,
            hasData: !!rawData,
            dataLength: rawData ? JSON.parse(rawData).length : 0,
            data: rawData ? JSON.parse(rawData) : null
        })

        // Test WorkoutStorage method
        const activities = await WorkoutStorage.getWorkoutActivities(50, 0)
        console.log('WorkoutStorage.getWorkoutActivities result:', activities)

        return { rawData: rawData ? JSON.parse(rawData) : null, activities }
    }

    globalWindow.quickDebugRings = async () => {
        console.log('🔥 QUICK DEBUG - Testing ring data immediately...')

        try {
            // 1. Check what date we're looking for
            const todayDate = GoalProgressCalculator.getTodayDateString()
            console.log('1. Today date:', todayDate)

            // 2. Force cache invalidation
            GoalProgressCalculator.invalidateCache()

            // 3. Get goal progress (should trigger all debug logs)
            const progress = await GoalProgressCalculator.calculateDailyProgress(true, false)
            console.log('2. Goal progress result:', progress)

            // 4. Check exercise data
            const exerciseData = progress?.exercise
            console.log('3. Exercise data:', exerciseData)

            // 5. Summary of findings
            console.log('🎯 SUMMARY:', {
                todayDate,
                hasProgress: !!progress,
                exerciseMinutes: progress?.exercise.currentMinutes || 0,
                exerciseProgress: progress?.exercise.progress || 0,
                sessionCount: progress?.exercise.sessionCount || 0
            })

            return { todayDate, progress, exerciseData }
        } catch (error) {
            console.error('❌ Quick debug failed:', error)
            return { error: error instanceof Error ? error.message : String(error) }
        }
    }
}