import { createClient } from '@/lib/supabase/client'
import type { User, SupabaseClient } from '@supabase/supabase-js'

// Workout data types for Supabase integration
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
    userId?: string
}

// Database row type (matches Supabase schema)
interface OngoingWorkoutRow {
    id: string
    user_id: string
    type: string
    name: string | null
    exercises: WorkoutExercise[]
    start_time: string
    elapsed_time: number
    is_running: boolean
    last_active: string
    created_at: string
    updated_at: string
}

export class WorkoutStorage {
    private static supabase: SupabaseClient | null = null
    private static currentUser: User | null = null

    // Initialize with user context
    static initialize(user: User | null, supabaseClient?: SupabaseClient) {
        this.currentUser = user
        if (supabaseClient) {
            this.supabase = supabaseClient
        } else if (typeof window !== 'undefined') {
            this.supabase = createClient()
        }
    }

    // Get ongoing workout from Supabase (user-scoped)
    static async getOngoingWorkout(): Promise<OngoingWorkout | null> {
        if (!this.supabase || !this.currentUser) {
            console.warn('No Supabase client or user - falling back to localStorage')
            return this.getOngoingWorkoutFromLocalStorage()
        }

        try {
            const { data, error } = await this.supabase
                .from('ongoing_workouts')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .maybeSingle()

            if (error) {
                console.error('Error fetching ongoing workout:', error)
                // Fallback to localStorage
                return this.getOngoingWorkoutFromLocalStorage()
            }

            if (!data) return null

            // Convert database row to OngoingWorkout interface
            return this.dbRowToWorkout(data)

        } catch (error) {
            console.error('Supabase query failed:', error)
            // Fallback to localStorage
            return this.getOngoingWorkoutFromLocalStorage()
        }
    }

    // Save ongoing workout to Supabase (user-scoped)
    static async saveOngoingWorkout(workout: OngoingWorkout): Promise<void> {
        if (!this.supabase || !this.currentUser) {
            console.warn('No Supabase client or user - falling back to localStorage')
            this.saveOngoingWorkoutToLocalStorage(workout)
            return
        }

        try {
            workout.lastActive = new Date().toISOString()
            workout.userId = this.currentUser.id

            const dbRow = this.workoutToDbRow(workout)

            const { error } = await this.supabase
                .from('ongoing_workouts')
                .upsert(dbRow, { 
                    onConflict: 'user_id',
                    ignoreDuplicates: false 
                })

            if (error) {
                console.error('Error saving ongoing workout:', error)
                // Fallback to localStorage
                this.saveOngoingWorkoutToLocalStorage(workout)
                return
            }

            // Also save to localStorage as backup
            this.saveOngoingWorkoutToLocalStorage(workout)

        } catch (error) {
            console.error('Supabase upsert failed:', error)
            // Fallback to localStorage
            this.saveOngoingWorkoutToLocalStorage(workout)
        }
    }

    // Clear ongoing workout from Supabase (user-scoped)
    static async clearOngoingWorkout(): Promise<void> {
        if (this.supabase && this.currentUser) {
            try {
                const { error } = await this.supabase
                    .from('ongoing_workouts')
                    .delete()
                    .eq('user_id', this.currentUser.id)

                if (error) {
                    console.error('Error clearing ongoing workout:', error)
                }
            } catch (error) {
                console.error('Supabase delete failed:', error)
            }
        }

        // Also clear from localStorage
        this.clearOngoingWorkoutFromLocalStorage()
    }

    // Update workout time (optimized for frequent updates)
    static async updateWorkoutTime(elapsedTime: number, isRunning: boolean): Promise<void> {
        if (!this.supabase || !this.currentUser) {
            // Update localStorage only
            const workout = this.getOngoingWorkoutFromLocalStorage()
            if (workout) {
                workout.elapsedTime = elapsedTime
                workout.isRunning = isRunning
                this.saveOngoingWorkoutToLocalStorage(workout)
            }
            return
        }

        try {
            const { error } = await this.supabase
                .from('ongoing_workouts')
                .update({
                    elapsed_time: elapsedTime,
                    is_running: isRunning,
                    last_active: new Date().toISOString()
                })
                .eq('user_id', this.currentUser.id)

            if (error) {
                console.error('Error updating workout time:', error)
            }

            // Also update localStorage
            const workout = this.getOngoingWorkoutFromLocalStorage()
            if (workout) {
                workout.elapsedTime = elapsedTime
                workout.isRunning = isRunning
                this.saveOngoingWorkoutToLocalStorage(workout)
            }

        } catch (error) {
            console.error('Supabase time update failed:', error)
        }
    }

    // Create new workout
    static createWorkout(type: OngoingWorkout['type'], id?: string): OngoingWorkout {
        return {
            id: id || `${type}-${Date.now()}`,
            type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`,
            exercises: [],
            startTime: new Date().toISOString(),
            elapsedTime: 0,
            isRunning: false,
            lastActive: new Date().toISOString(),
            userId: this.currentUser?.id
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

    // Private helper methods for localStorage fallback
    private static readonly ONGOING_WORKOUT_KEY = 'ongoing-workout'

    private static getOngoingWorkoutFromLocalStorage(): OngoingWorkout | null {
        if (typeof window === 'undefined') return null
        
        try {
            const stored = localStorage.getItem(this.ONGOING_WORKOUT_KEY)
            return stored ? JSON.parse(stored) : null
        } catch (error) {
            console.error('Error loading from localStorage:', error)
            return null
        }
    }

    private static saveOngoingWorkoutToLocalStorage(workout: OngoingWorkout): void {
        if (typeof window === 'undefined') return
        
        try {
            workout.lastActive = new Date().toISOString()
            localStorage.setItem(this.ONGOING_WORKOUT_KEY, JSON.stringify(workout))
        } catch (error) {
            console.error('Error saving to localStorage:', error)
        }
    }

    private static clearOngoingWorkoutFromLocalStorage(): void {
        if (typeof window === 'undefined') return
        localStorage.removeItem(this.ONGOING_WORKOUT_KEY)
    }

    // Database conversion helpers
    private static dbRowToWorkout(row: OngoingWorkoutRow): OngoingWorkout {
        return {
            id: row.id,
            type: row.type as OngoingWorkout['type'],
            name: row.name || undefined,
            exercises: row.exercises,
            startTime: row.start_time,
            elapsedTime: row.elapsed_time,
            isRunning: row.is_running,
            lastActive: row.last_active,
            userId: row.user_id
        }
    }

    private static workoutToDbRow(workout: OngoingWorkout): Omit<OngoingWorkoutRow, 'created_at' | 'updated_at'> {
        return {
            id: workout.id,
            user_id: workout.userId || this.currentUser?.id || '',
            type: workout.type,
            name: workout.name || null,
            exercises: workout.exercises,
            start_time: workout.startTime,
            elapsed_time: workout.elapsedTime,
            is_running: workout.isRunning,
            last_active: workout.lastActive
        }
    }
}