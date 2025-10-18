import type { WorkoutActivity, WorkoutTemplate } from './workout-storage'

const MINUTES_PER_EXERCISE_ESTIMATE = 5

const toLocalDateKey = (date: Date): string => {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
}

const normalizeDate = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const addDays = (date: Date, amount: number): Date => {
    const cloned = new Date(date)
    cloned.setDate(cloned.getDate() + amount)
    return cloned
}

export interface WeeklyWorkoutStats {
    currentMinutes: number
    previousMinutes: number
    currentSessions: number
    previousSessions: number
}

export const calculateWorkoutStreak = (activities: WorkoutActivity[], referenceDate: Date = new Date()): number => {
    if (activities.length === 0) return 0

    const activityDates = new Set(
        activities.map(activity => toLocalDateKey(new Date(activity.completedAt)))
    )

    let streak = 0
    let cursor = normalizeDate(referenceDate)

    while (activityDates.has(toLocalDateKey(cursor))) {
        streak += 1
        cursor = addDays(cursor, -1)
    }

    return streak
}

export const calculateWeeklyWorkoutStats = (
    activities: WorkoutActivity[],
    referenceDate: Date = new Date()
): WeeklyWorkoutStats => {
    if (activities.length === 0) {
        return {
            currentMinutes: 0,
            previousMinutes: 0,
            currentSessions: 0,
            previousSessions: 0
        }
    }

    const endOfCurrent = normalizeDate(referenceDate)
    const startOfCurrent = addDays(endOfCurrent, -6)
    const endOfPrevious = addDays(startOfCurrent, -1)
    const startOfPrevious = addDays(startOfCurrent, -7)

    return activities.reduce<WeeklyWorkoutStats>((stats, activity) => {
        const activityDate = normalizeDate(new Date(activity.completedAt))
        const minutes = Math.round((activity.durationSeconds || 0) / 60)

        if (activityDate >= startOfCurrent && activityDate <= endOfCurrent) {
            stats.currentMinutes += minutes
            stats.currentSessions += 1
        } else if (activityDate >= startOfPrevious && activityDate <= endOfPrevious) {
            stats.previousMinutes += minutes
            stats.previousSessions += 1
        }

        return stats
    }, {
        currentMinutes: 0,
        previousMinutes: 0,
        currentSessions: 0,
        previousSessions: 0
    })
}

export const formatWorkoutDuration = (totalMinutes: number): string => {
    if (totalMinutes <= 0) return '0m'
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
}

export const summarizeTemplate = (template: WorkoutTemplate) => {
    const exerciseCount = template.exercises.length
    const estimatedMinutes = Math.max(10, exerciseCount * MINUTES_PER_EXERCISE_ESTIMATE)
    return {
        exerciseCount,
        estimatedMinutes,
        durationLabel: formatWorkoutDuration(estimatedMinutes)
    }
}

