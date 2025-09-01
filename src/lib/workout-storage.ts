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

export class WorkoutStorage {
    // Simple storage class for local state management
    // No persistence, templates, or database integration

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