// Simple workout data types for local state management only

export interface WorkoutExercise {
    id: string
    name: string
    description?: string
    category?: string
    targetMuscles?: string[]
    equipment?: string
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    restTime?: number
    sets: Array<{
        id: string
        reps: string
        weight: string
        notes: string
        completed?: boolean
        restTime?: number
    }>
    instructions?: string[]
    tips?: string[]
    alternatives?: string[]
    createdAt?: string
    updatedAt?: string
}

export interface OngoingWorkout {
    id: string
    type: 'strength' | 'running' | 'yoga' | 'cycling'
    name?: string
    exercises: WorkoutExercise[]
    startTime: string
    elapsedTime: number
    isRunning: boolean
    lastActive: string
}

export class WorkoutStorage {
    // Simple storage class for local state management with localStorage persistence
    private static readonly ONGOING_WORKOUT_KEY = 'ongoing-workout'

    // Ongoing workout management
    static getOngoingWorkout(): OngoingWorkout | null {
        if (typeof window === 'undefined') return null
        
        try {
            const stored = localStorage.getItem(this.ONGOING_WORKOUT_KEY)
            return stored ? JSON.parse(stored) : null
        } catch (error) {
            console.error('Error loading ongoing workout:', error)
            return null
        }
    }

    static saveOngoingWorkout(workout: OngoingWorkout): void {
        if (typeof window === 'undefined') return
        
        try {
            workout.lastActive = new Date().toISOString()
            localStorage.setItem(this.ONGOING_WORKOUT_KEY, JSON.stringify(workout))
        } catch (error) {
            console.error('Error saving ongoing workout:', error)
        }
    }

    static clearOngoingWorkout(): void {
        if (typeof window === 'undefined') return
        localStorage.removeItem(this.ONGOING_WORKOUT_KEY)
    }

    static createWorkout(type: OngoingWorkout['type'], id?: string): OngoingWorkout {
        return {
            id: id || `${type}-${Date.now()}`,
            type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`,
            exercises: [],
            startTime: new Date().toISOString(),
            elapsedTime: 0,
            isRunning: false,
            lastActive: new Date().toISOString()
        }
    }

    static updateWorkoutTime(elapsedTime: number, isRunning: boolean): void {
        const workout = this.getOngoingWorkout()
        if (workout) {
            workout.elapsedTime = elapsedTime
            workout.isRunning = isRunning
            this.saveOngoingWorkout(workout)
        }
    }

    // Exercise utilities
    static createEmptyExercise(): WorkoutExercise {
        return {
            id: `exercise-${Date.now()}`,
            name: '',
            description: '',
            category: 'general',
            targetMuscles: [],
            equipment: 'bodyweight',
            difficulty: 'beginner',
            restTime: 60,
            sets: [{
                id: `set-${Date.now()}`,
                reps: '',
                weight: '',
                notes: '',
                completed: false,
                restTime: 60
            }],
            instructions: [],
            tips: [],
            alternatives: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }

    static createEmptySet(): WorkoutExercise['sets'][0] {
        return {
            id: `set-${Date.now()}`,
            reps: '',
            weight: '',
            notes: '',
            completed: false,
            restTime: 60
        }
    }
}