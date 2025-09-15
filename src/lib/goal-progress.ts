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
    private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    // Get today's date in user's local timezone
    static getTodayDateString(): string {
        const today = new Date()
        return today.toLocaleDateString('en-CA') // YYYY-MM-DD format
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
                    const ongoingMinutes = Math.round(ongoingWorkout.elapsedTime / 60)
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
                    sessions.push({
                        duration: Math.round(ongoingWorkout.elapsedTime / 60),
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

    // Calculate recovery progress (placeholder for now)
    static calculateRecoveryProgress(userGoals: UserGoals): DailyGoalProgress['recovery'] {
        // Placeholder logic using sleep hours goal
        const targetHours = userGoals.sleepHours

        // For now, return a placeholder progress based on time of day
        // This assumes users sleep at night and recover during the day
        const now = new Date()
        const hoursIntoDay = now.getHours() + (now.getMinutes() / 60)

        // Simple logic: if it's morning (6-12), show previous night's sleep
        // If it's afternoon/evening (12-24), show accumulating recovery
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
                return this.cache!.data
            }

            // Get user goals
            const userGoals = await UserDataStorage.getUserGoals()
            if (!userGoals) {
                console.warn('No user goals found for progress calculation')
                return null
            }

            // Calculate each ring's progress
            const exercise = await this.calculateExerciseProgress(userGoals, includeOngoingWorkout)
            const nutrition = this.calculateNutritionProgress(userGoals)
            const recovery = this.calculateRecoveryProgress(userGoals)

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
        const progress = await this.calculateDailyProgress()
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
}