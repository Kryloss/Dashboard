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

        const isToday = workoutDate >= startOfDay && workoutDate <= endOfDay

        // Debug logging for date comparison (only for activities that are close to today)
        const timeDiffFromNow = Math.abs(Date.now() - workoutDate.getTime())
        const isWithin24Hours = timeDiffFromNow < 24 * 60 * 60 * 1000

        if (isWithin24Hours || isToday) {
            console.log('🔍 Debug isWorkoutToday:', {
                completedAt,
                workoutDate: workoutDate.toISOString(),
                startOfDay: startOfDay.toISOString(),
                endOfDay: endOfDay.toISOString(),
                isToday,
                timeDiffFromNow: Math.round(timeDiffFromNow / (60 * 60 * 1000)) + ' hours'
            })
        }

        return isToday
    }

    // Get daily workout summary similar to how sleep data works
    static async getDailyWorkoutSummary(date: string): Promise<DailyWorkoutSummary | null> {
        try {
            // Get all activities and filter for the specific date
            const allActivities = await WorkoutStorage.getWorkoutActivities(100, 0)

            // Filter activities for the specific date
            const dateActivities = allActivities.filter(activity => {
                // Use the same date logic as sleep data
                const activityDate = new Date(activity.completedAt).toISOString().split('T')[0]
                return activityDate === date
            })

            console.log('📊 Daily workout summary calculation:', {
                requestedDate: date,
                totalActivities: allActivities.length,
                dateActivities: dateActivities.length,
                allActivitiesDetails: allActivities.map(a => ({
                    id: a.id,
                    name: a.name,
                    type: a.workoutType,
                    completedAt: a.completedAt,
                    completedAtDate: new Date(a.completedAt).toISOString().split('T')[0],
                    duration: Math.round(a.durationSeconds / 60),
                    userId: a.userId,
                    matchesDate: new Date(a.completedAt).toISOString().split('T')[0] === date
                })),
                filteredActivities: dateActivities.map(a => ({
                    id: a.id,
                    name: a.name,
                    type: a.workoutType,
                    completedAt: a.completedAt,
                    duration: Math.round(a.durationSeconds / 60)
                }))
            })

            if (dateActivities.length === 0) {
                return null
            }

            // Calculate totals
            const totalMinutes = dateActivities.reduce((sum, activity) => {
                return sum + Math.round(activity.durationSeconds / 60)
            }, 0)

            const sessionCount = dateActivities.length

            // Create activity summaries
            const activities = dateActivities.map(activity => ({
                id: activity.id,
                duration: Math.round(activity.durationSeconds / 60),
                type: activity.workoutType,
                completedAt: activity.completedAt,
                name: activity.name
            }))

            return {
                date,
                totalMinutes,
                sessionCount,
                activities
            }
        } catch (error) {
            console.error('Error getting daily workout summary:', error)
            return null
        }
    }

    // Calculate exercise progress from today's completed workouts
    static async calculateExerciseProgress(userGoals: UserGoals, includeOngoingWorkout = false): Promise<DailyGoalProgress['exercise']> {
        try {
            // Get today's workout summary (similar to how sleep data works)
            const todayDate = this.getTodayDateString()
            const workoutSummary = await this.getDailyWorkoutSummary(todayDate)

            console.log('🔍 GoalProgress Debug - Exercise calculation with summary approach:', {
                todayDate,
                workoutSummary: workoutSummary ? {
                    totalMinutes: workoutSummary.totalMinutes,
                    sessionCount: workoutSummary.sessionCount,
                    activities: workoutSummary.activities.length
                } : 'NO_SUMMARY_FOUND'
            })

            let totalMinutes = workoutSummary?.totalMinutes || 0
            let sessionCount = workoutSummary?.sessionCount || 0

            // Fallback to old method if summary approach fails
            if (!workoutSummary) {
                console.log('📋 Falling back to individual activity calculation...')
                const allActivities = await WorkoutStorage.getWorkoutActivities(50, 0)

                // Filter for today's workouts using the old method
                const todayWorkouts = allActivities.filter(activity =>
                    this.isWorkoutToday(activity.completedAt)
                )

                console.log('🎯 Fallback - Today\'s workouts found:', {
                    count: todayWorkouts.length,
                    workouts: todayWorkouts.map(w => ({
                        id: w.id,
                        name: w.name,
                        type: w.workoutType,
                        minutes: Math.round(w.durationSeconds / 60),
                        completedAt: w.completedAt
                    }))
                })

                // Calculate totals from individual activities
                totalMinutes = todayWorkouts.reduce((sum, workout) => {
                    return sum + Math.round(workout.durationSeconds / 60)
                }, 0)
                sessionCount = todayWorkouts.length
            }

            // Include ongoing workout time if requested (but avoid double-counting)
            if (includeOngoingWorkout) {
                const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (ongoingWorkout && ongoingWorkout.isRunning) {
                    // Check if this ongoing workout might already be logged as a completed activity
                    const ongoingStartTime = new Date(ongoingWorkout.startTime)
                    const activitiesToCheck = workoutSummary?.activities || []

                    const potentialDuplicate = activitiesToCheck.find(activity => {
                        const activityTime = new Date(activity.completedAt)
                        // Consider it a duplicate if completed within 5 minutes of ongoing workout start
                        const timeDiff = Math.abs(activityTime.getTime() - ongoingStartTime.getTime())
                        return timeDiff < 5 * 60 * 1000 // 5 minutes
                    })

                    if (potentialDuplicate) {
                        console.log('⚠️ GoalProgress: Ongoing workout might be duplicate of completed activity', {
                            ongoingWorkout: ongoingWorkout.id,
                            ongoingStartTime: ongoingWorkout.startTime,
                            potentialDuplicate: {
                                id: potentialDuplicate.id,
                                completedAt: potentialDuplicate.completedAt,
                                duration: potentialDuplicate.duration
                            }
                        })
                        // Skip adding ongoing workout to avoid double-counting
                    } else {
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
            }

            const targetMinutes = userGoals.dailyExerciseMinutes
            const progress = Math.min(totalMinutes / targetMinutes, 1.0)

            console.log('💪 GoalProgress Debug - Exercise calculation result:', {
                sessionsCount: sessionCount,
                totalMinutesFromWorkouts: totalMinutes,
                targetMinutes,
                progress: Math.round(progress * 100) + '%',
                includeOngoingWorkout,
                usedSummaryApproach: !!workoutSummary
            })

            // Create session data for ring segments
            const sessions = workoutSummary?.activities.map(activity => ({
                duration: activity.duration,
                type: activity.type,
                completedAt: activity.completedAt
            })) || []

            // Add ongoing workout session if included and not already counted
            if (includeOngoingWorkout) {
                const ongoingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (ongoingWorkout && ongoingWorkout.isRunning) {
                    // Check if we should include it (not already counted as duplicate)
                    const ongoingStartTime = new Date(ongoingWorkout.startTime)
                    const activitiesToCheck = workoutSummary?.activities || []

                    const isDuplicate = activitiesToCheck.find(activity => {
                        const activityTime = new Date(activity.completedAt)
                        const timeDiff = Math.abs(activityTime.getTime() - ongoingStartTime.getTime())
                        return timeDiff < 5 * 60 * 1000
                    })

                    if (!isDuplicate) {
                        // Use real-time elapsed time for accurate session duration
                        const realTimeElapsedSeconds = WorkoutStorage.getBackgroundElapsedTime()
                        sessions.push({
                            duration: Math.round(realTimeElapsedSeconds / 60),
                            type: ongoingWorkout.type,
                            completedAt: ongoingWorkout.startTime // Use start time for ongoing workouts
                        })
                    }
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
}

// Make debug functions available globally for browser console debugging
if (typeof window !== 'undefined') {
    const globalWindow = window as typeof window & {
        debugGoalProgress?: () => Promise<void>
        debugLocalStorage?: () => void
        forceRefreshRings?: () => Promise<DailyGoalProgress | null>
        testExerciseCalculation?: () => Promise<{ userGoals: unknown; activities: unknown }>
        testWorkoutSummary?: () => Promise<DailyWorkoutSummary | null>
        testLocalStorageActivities?: () => Promise<{ rawData: unknown; activities: unknown }>
    }

    globalWindow.debugGoalProgress = () => GoalProgressCalculator.debugProgress()
    globalWindow.debugLocalStorage = () => GoalProgressCalculator.debugLocalStorageData()
    globalWindow.forceRefreshRings = async () => {
        GoalProgressCalculator.invalidateCache()
        const progress = await GoalProgressCalculator.calculateDailyProgress(true)
        console.log('🔄 Force refreshed goal progress:', progress)
        return progress
    }

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
        console.log('🧪 Testing workout summary approach...')

        const todayDate = GoalProgressCalculator.getTodayDateString()
        console.log('Today date:', todayDate)

        const summary = await GoalProgressCalculator.getDailyWorkoutSummary(todayDate)
        console.log('Workout summary:', summary)

        return summary
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
}