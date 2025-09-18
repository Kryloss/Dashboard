// Supabase-integrated workout storage with localStorage fallback
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'
import { UnifiedWorkoutStorage } from './unified-storage'

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
    workoutId: string // The URL-friendly ID (e.g., "strength-1234567890")
    name?: string
    exercises: WorkoutExercise[]
    startTime: string
    elapsedTime: number
    isRunning: boolean
    userId?: string
}

export interface WorkoutTemplate {
    id: string
    name: string
    type: 'strength' | 'running' | 'yoga' | 'cycling'
    exercises: WorkoutExercise[]
    isBuiltIn?: boolean
    createdAt: string
    userId?: string
}

export interface WorkoutActivity {
    id: string
    workoutType: 'strength' | 'running' | 'yoga' | 'cycling'
    name?: string
    exercises: WorkoutExercise[]
    durationSeconds: number
    notes?: string
    completedAt: string
    createdAt: string
    updatedAt: string
    userId?: string
}

interface DatabaseOngoingWorkout {
    id: string
    user_id: string
    workout_id: string
    type: string
    name: string | null
    exercises: WorkoutExercise[]
    start_time: string
    elapsed_time: number
    is_running: boolean
    created_at: string
    updated_at: string
}

interface DatabaseWorkoutTemplate {
    id: string
    user_id: string | null
    name: string
    type: string
    exercises: WorkoutExercise[]
    is_built_in: boolean
    created_at: string
    updated_at: string
}

interface DatabaseWorkoutActivity {
    id: string
    user_id: string
    workout_type: string
    name: string | null
    exercises: WorkoutExercise[]
    duration_seconds: number
    notes: string | null
    completed_at: string
    created_at: string
    updated_at: string
}

interface SyncOperation {
    action: 'upsert' | 'insert' | 'delete'
    table: 'ongoing_workouts' | 'workout_templates' | 'workout_activities'
    data: OngoingWorkout | WorkoutTemplate | WorkoutActivity | string | null
    timestamp: number
    retryCount?: number
    maxRetries?: number
}

export class WorkoutStorage {
    private static supabase: SupabaseClient | null = null
    private static currentUser: User | null = null
    private static unifiedStorage: UnifiedWorkoutStorage | null = null
    // Dynamic keys that include user context for isolation
    private static get ONGOING_WORKOUT_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-ongoing-workout${userSuffix}`
    }

    private static get TEMPLATES_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-workout-templates${userSuffix}`
    }

    private static get ACTIVITIES_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-workout-activities${userSuffix}`
    }

    private static get SYNC_QUEUE_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-sync-queue${userSuffix}`
    }

    // Real-time synchronization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static realtimeChannel: any = null
    private static ongoingWorkoutListeners: Array<(workout: OngoingWorkout | null) => void> = []
    private static templatesListeners: Array<(templates: WorkoutTemplate[]) => void> = []

    // Initialize with user and supabase client
    static initialize(user: User | null, supabaseClient?: SupabaseClient) {
        console.log('WorkoutStorage.initialize - User:', user?.id, user?.email)
        console.log('WorkoutStorage.initialize - Has supabaseClient:', !!supabaseClient)

        this.currentUser = user
        if (supabaseClient) {
            this.supabase = supabaseClient
        } else if (typeof window !== 'undefined') {
            this.supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
        }

        // Initialize unified storage for coordinated operations
        if (user && this.supabase) {
            try {
                // Dispose previous instance if exists
                if (this.unifiedStorage) {
                    this.unifiedStorage.dispose()
                }

                this.unifiedStorage = new UnifiedWorkoutStorage(user, this.supabase, {
                    maxRetries: 3,
                    syncInterval: 30000, // 30 seconds
                    offlineQueueLimit: 100
                })

                console.log('✅ UnifiedWorkoutStorage initialized for user:', user.id)
            } catch (error) {
                console.error('❌ Failed to initialize UnifiedWorkoutStorage:', error)
            }
        }

        // Verify the supabase client has the correct auth context
        if (this.supabase) {
            this.supabase.auth.getUser().then(({ data: authUser, error }) => {
                console.log('WorkoutStorage.initialize - Supabase auth context:', {
                    userId: authUser.user?.id,
                    email: authUser.user?.email,
                    matchesPassedUser: authUser.user?.id === user?.id,
                    error
                })
            })
        }

        // Sync any queued operations when initializing
        if (this.currentUser && this.supabase) {
            this.processSyncQueue()
            this.setupRealtimeSync()
            this.startBackgroundSync() // Start background timer sync

            // Debug database connection and RLS (remove this in production)
            this.debugDatabaseConnection()

            // Set up automatic sync on connection recovery
            this.onConnectionChange((online) => {
                if (online && this.currentUser && this.supabase) {
                    console.log('Connection restored, processing sync queue')
                    this.processSyncQueue()
                }
            })
        }
    }

    // Helper methods for creating workout components
    static createEmptyExercise(): WorkoutExercise {
        return {
            id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '',
            description: '',
            category: 'general',
            targetMuscles: [],
            equipment: 'bodyweight',
            difficulty: 'beginner',
            restTime: 60,
            sets: [{
                id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
            id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            reps: '',
            weight: '',
            notes: '',
            completed: false,
            restTime: 60
        }
    }

    // ============================================================================
    // ONGOING WORKOUT MANAGEMENT
    // ============================================================================

    static async getOngoingWorkout(): Promise<OngoingWorkout | null> {
        // Debug: Log current user information
        console.log('WorkoutStorage.getOngoingWorkout - Current user:', this.currentUser?.id, this.currentUser?.email)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                // Debug: Check current auth user in Supabase
                const { data: authUser } = await this.supabase.auth.getUser()
                console.log('WorkoutStorage.getOngoingWorkout - Supabase auth user:', authUser.user?.id, authUser.user?.email)

                if (!authUser.user) {
                    console.warn('WorkoutStorage.getOngoingWorkout - No authenticated user in Supabase context')
                    return this.getOngoingWorkoutFromLocalStorage()
                }

                // Explicit user_id filter with null check for security
                const { data, error } = await this.supabase
                    .from('ongoing_workouts')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .single()

                console.log('WorkoutStorage.getOngoingWorkout - Query result:', { data, error })

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No ongoing workout found in database
                        console.log('WorkoutStorage.getOngoingWorkout - No ongoing workout found in database')
                        return null
                    }
                    throw error
                }

                // Convert database format to app format
                return this.convertDbOngoingWorkoutToApp(data)
            } catch (error) {
                console.error('Error fetching ongoing workout from Supabase:', error)
                // Fall back to localStorage
            }
        }

        // Fallback to localStorage
        console.log('WorkoutStorage.getOngoingWorkout - Falling back to localStorage')
        return this.getOngoingWorkoutFromLocalStorage()
    }

    static async saveOngoingWorkout(workout: OngoingWorkout): Promise<void> {
        // Always save to localStorage first for immediate feedback
        this.saveOngoingWorkoutToLocalStorage(workout)

        // Try to save to Supabase if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                const dbWorkout = this.convertAppOngoingWorkoutToDb(workout)

                // Check if ongoing workout exists for this user and update/insert accordingly
                const { data: existingWorkout } = await this.supabase
                    .from('ongoing_workouts')
                    .select('id')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .single()

                let error: Error | null = null

                if (existingWorkout) {
                    // Update existing workout with security check
                    const updateResult = await this.supabase
                        .from('ongoing_workouts')
                        .update({
                            ...dbWorkout,
                        })
                        .eq('user_id', this.currentUser.id)
                        .not('user_id', 'is', null)
                    error = updateResult.error
                } else {
                    // Insert new workout
                    const insertResult = await this.supabase
                        .from('ongoing_workouts')
                        .insert({
                            ...dbWorkout,
                            user_id: this.currentUser.id
                        })
                    error = insertResult.error
                }

                if (error) throw error

                console.log('Ongoing workout saved to Supabase:', workout.workoutId)
            } catch (error) {
                console.error('Error saving ongoing workout to Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'upsert',
                    table: 'ongoing_workouts',
                    data: workout,
                    timestamp: Date.now()
                })
            }
        }
    }

    static async clearOngoingWorkout(): Promise<void> {
        // Clear from localStorage immediately
        this.clearOngoingWorkoutFromLocalStorage()

        // Try to clear from Supabase
        if (this.currentUser && this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('ongoing_workouts')
                    .delete()
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)

                if (error) throw error

                console.log('Ongoing workout cleared from Supabase')
            } catch (error) {
                console.error('Error clearing ongoing workout from Supabase:', error)
                // Add to sync queue
                this.addToSyncQueue({
                    action: 'delete',
                    table: 'ongoing_workouts',
                    data: null,
                    timestamp: Date.now()
                })
            }
        }
    }

    static updateWorkoutTime(elapsedTime: number, isRunning: boolean): void {
        // Update localStorage immediately
        const workout = this.getOngoingWorkoutFromLocalStorage()
        if (workout) {
            workout.elapsedTime = elapsedTime
            workout.isRunning = isRunning
            // When starting/resuming, adjust start time so elapsed time calculation works correctly
            if (isRunning) {
                // Set startTime to current time minus elapsed time for accurate real-time calculation
                workout.startTime = new Date(Date.now() - (elapsedTime * 1000)).toISOString()
            }
            this.saveOngoingWorkoutToLocalStorage(workout)

            // Debounce Supabase updates for time (every 10 seconds)
            this.debouncedSaveOngoingWorkout(workout)
        }
    }

    // Calculate real-time elapsed time for running workouts
    static getCurrentElapsedTime(): number {
        const workout = this.getOngoingWorkoutFromLocalStorage()
        if (!workout) return 0

        // Security check: ensure workout belongs to current user
        if (this.currentUser && workout.userId && workout.userId !== this.currentUser.id) {
            console.warn('Workout data belongs to different user, returning 0')
            return 0
        }

        if (!workout.isRunning) {
            // If paused, return the stored elapsed time (no real-time calculation)
            return workout.elapsedTime
        }

        // If running, calculate real-time elapsed time based on startTime
        const now = Date.now()
        const startTime = new Date(workout.startTime).getTime()
        const realTimeElapsed = Math.floor((now - startTime) / 1000)

        // Return the calculated elapsed time (should match or be slightly ahead of stored elapsedTime)
        return Math.max(realTimeElapsed, workout.elapsedTime)
    }

    // Get background elapsed time for workouts that were running when page was closed
    static getBackgroundElapsedTime(): number {
        const workout = this.getOngoingWorkoutFromLocalStorage()
        if (!workout) return 0

        // Security check: ensure workout belongs to current user
        if (this.currentUser && workout.userId && workout.userId !== this.currentUser.id) {
            console.warn('Workout data belongs to different user, returning 0')
            return 0
        }

        if (!workout.isRunning) {
            // If paused, return the stored elapsed time
            return workout.elapsedTime
        }

        // If running, calculate real-time elapsed time based on startTime
        // This handles the case where the workout was running when the page was closed
        const now = Date.now()
        const startTime = new Date(workout.startTime).getTime()

        // Validate startTime is not in the future or too far in the past
        if (startTime > now) {
            console.warn('Workout startTime is in the future, using stored elapsedTime')
            return workout.elapsedTime
        }

        const realTimeElapsed = Math.floor((now - startTime) / 1000)

        // Debug logging for troubleshooting
        console.log('🕐 Background elapsed time calculation:', {
            startTime: new Date(startTime).toISOString(),
            now: new Date(now).toISOString(),
            realTimeElapsed,
            storedElapsedTime: workout.elapsedTime,
            workoutType: workout.type,
            isRunning: workout.isRunning
        })

        // Return the calculated elapsed time, ensuring it's not less than stored time
        return Math.max(realTimeElapsed, workout.elapsedTime)
    }

    // ============================================================================
    // WORKOUT TEMPLATES MANAGEMENT
    // ============================================================================

    static async getTemplates(type?: 'strength' | 'running' | 'yoga' | 'cycling'): Promise<WorkoutTemplate[]> {
        // Debug: Log current user information
        console.log('WorkoutStorage.getTemplates - Current user:', this.currentUser?.id, this.currentUser?.email, 'Type:', type)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                // Debug: Check current auth user in Supabase
                const { data: authUser } = await this.supabase.auth.getUser()
                console.log('WorkoutStorage.getTemplates - Supabase auth user:', authUser.user?.id, authUser.user?.email)

                if (!authUser.user) {
                    console.warn('WorkoutStorage.getTemplates - No authenticated user in Supabase context')
                    return this.getTemplatesFromLocalStorage(type)
                }

                // Build secure query with explicit auth checks
                let query = this.supabase
                    .from('workout_templates')
                    .select('*')
                    .or(`and(user_id.eq.${this.currentUser.id},user_id.not.is.null),and(is_built_in.eq.true,user_id.is.null)`)
                    .order('is_built_in', { ascending: false }) // Built-in templates first
                    .order('created_at', { ascending: false })

                if (type) {
                    query = query.eq('type', type)
                }

                const { data, error } = await query

                console.log('WorkoutStorage.getTemplates - Query result:', {
                    dataCount: data?.length || 0,
                    error,
                    sampleData: data?.slice(0, 2).map(t => ({ id: t.id, name: t.name, user_id: t.user_id, is_built_in: t.is_built_in }))
                })

                if (error) throw error

                return (data || []).map(this.convertDbTemplateToApp)
            } catch (error) {
                console.error('Error fetching templates from Supabase:', error)
                // Fall back to localStorage
            }
        }

        // Fallback to localStorage (will have limited built-in templates)
        console.log('WorkoutStorage.getTemplates - Falling back to localStorage')
        return this.getTemplatesFromLocalStorage(type)
    }

    static async saveTemplate(template: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<WorkoutTemplate> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save templates')
        }

        const newTemplate: WorkoutTemplate = {
            ...template,
            id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            userId: this.currentUser.id
        }

        // Save to localStorage immediately
        this.saveTemplateToLocalStorage(newTemplate)

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbTemplate = this.convertAppTemplateToDb(newTemplate)

                const { data, error } = await this.supabase
                    .from('workout_templates')
                    .insert({
                        ...dbTemplate,
                        user_id: this.currentUser.id
                    })
                    .select()
                    .single()

                if (error) throw error

                // Update with Supabase-generated ID
                newTemplate.id = data.id
                newTemplate.createdAt = data.created_at

                console.log('Template saved to Supabase:', newTemplate.name)
            } catch (error) {
                console.error('Error saving template to Supabase:', error)
                // Add to sync queue
                this.addToSyncQueue({
                    action: 'insert',
                    table: 'workout_templates',
                    data: newTemplate,
                    timestamp: Date.now()
                })
            }
        }

        return newTemplate
    }

    static async deleteTemplate(templateId: string): Promise<void> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to delete templates')
        }

        // Remove from localStorage
        this.deleteTemplateFromLocalStorage(templateId)

        // Try to delete from Supabase
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('workout_templates')
                    .delete()
                    .eq('id', templateId)
                    .eq('user_id', this.currentUser.id) // Ensure user can only delete their own
                    .not('user_id', 'is', null)
                    .eq('is_built_in', false) // Prevent deletion of built-in templates

                if (error) throw error

                console.log('Template deleted from Supabase:', templateId)
            } catch (error) {
                console.error('Error deleting template from Supabase:', error)
                // Add to sync queue
                this.addToSyncQueue({
                    action: 'delete',
                    table: 'workout_templates',
                    data: templateId,
                    timestamp: Date.now()
                })
            }
        }
    }

    // ============================================================================
    // WORKOUT ACTIVITIES MANAGEMENT
    // ============================================================================

    static async saveWorkoutActivity(activity: Omit<WorkoutActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutActivity> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save workout activities')
        }

        const newActivity: WorkoutActivity = {
            ...activity,
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: this.currentUser.id
        }

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbActivity = this.convertAppActivityToDb(newActivity)

                console.log('💾 Saving workout activity to Supabase:', {
                    type: newActivity.workoutType,
                    name: newActivity.name,
                    duration: Math.round(newActivity.durationSeconds / 60),
                    userId: this.currentUser.id,
                    dbData: dbActivity
                })

                const { data, error } = await this.supabase
                    .from('workout_activities')
                    .insert({
                        ...dbActivity,
                        user_id: this.currentUser.id
                    })
                    .select()
                    .single()

                if (error) throw error

                // Update with Supabase-generated data
                newActivity.id = data.id
                newActivity.createdAt = data.created_at
                newActivity.updatedAt = data.updated_at

                console.log('✅ Workout activity saved to Supabase successfully:', newActivity.name)

            } catch (error) {
                console.error('Error saving workout activity to Supabase:', error)
                // Add to sync queue
                this.addToSyncQueue({
                    action: 'insert',
                    table: 'workout_activities',
                    data: newActivity,
                    timestamp: Date.now()
                })
            }
        }

        // Always save to localStorage for offline access and quick retrieval
        this.saveActivityToLocalStorage(newActivity)

        // Trigger a custom event for same-tab detection
        try {
            window.dispatchEvent(new CustomEvent('workoutCompleted', {
                detail: { activityId: newActivity.id, timestamp: Date.now() }
            }))
        } catch (error) {
            console.warn('Could not trigger workout completion event:', error)
        }

        return newActivity
    }

    // NEW: Unified storage method for workout activities
    static async saveWorkoutActivityUnified(activity: Omit<WorkoutActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutActivity> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save workout activities')
        }

        const newActivity: WorkoutActivity = {
            ...activity,
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: this.currentUser.id
        }

        // Use unified storage for coordinated save
        if (this.unifiedStorage) {
            try {
                await this.unifiedStorage.save('activity', newActivity, 'create')
                console.log('✅ Workout activity saved via unified storage:', newActivity.name)
            } catch (error) {
                console.error('❌ Unified storage failed, falling back to legacy method:', error)
                // Fallback to direct localStorage save
                try {
                    const existing = localStorage.getItem(this.ACTIVITIES_KEY)
                    const activities = existing ? JSON.parse(existing) : []
                    activities.unshift(newActivity)
                    localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(activities))
                } catch (localError) {
                    console.error('Failed to save to localStorage:', localError)
                }
            }
        } else {
            // Fallback to direct localStorage save if unified storage not available
            console.warn('Unified storage not available, using direct localStorage save')
            try {
                const existing = localStorage.getItem(this.ACTIVITIES_KEY)
                const activities = existing ? JSON.parse(existing) : []
                activities.unshift(newActivity)
                localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(activities))
            } catch (localError) {
                console.error('Failed to save to localStorage:', localError)
            }
        }

        // Trigger completion event for UI updates
        try {
            window.dispatchEvent(new CustomEvent('workoutCompleted', {
                detail: { activityId: newActivity.id, timestamp: Date.now() }
            }))
        } catch (error) {
            console.warn('Could not trigger workout completion event:', error)
        }

        return newActivity
    }

    // NEW: Unified storage method for loading workout activities
    static async getWorkoutActivitiesUnified(
        limit: number = 50,
        offset: number = 0,
        type?: 'strength' | 'running' | 'yoga' | 'cycling'
    ): Promise<WorkoutActivity[]> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to get workout activities')
        }

        // Use unified storage for coordinated load
        if (this.unifiedStorage) {
            try {
                const activities = await this.unifiedStorage.load('activity')
                console.log('✅ Workout activities loaded via unified storage:', activities.length)

                // Apply filtering and pagination
                let filtered = activities
                if (type) {
                    filtered = activities.filter(activity => activity.workoutType === type)
                }

                // Apply pagination
                const paginated = filtered.slice(offset, offset + limit)

                return paginated.map(activity => this.convertDbActivityToApp(activity as unknown as DatabaseWorkoutActivity))
            } catch (error) {
                console.error('❌ Unified storage load failed, falling back to legacy method:', error)
                // Fallback to legacy method
                return this.getWorkoutActivities(limit, offset, type)
            }
        } else {
            // Fallback to legacy method if unified storage not available
            console.warn('Unified storage not available, using legacy load method')
            return this.getWorkoutActivities(limit, offset, type)
        }
    }

    // NEW: Get unified storage sync status for debugging
    static getStorageSyncStatus(): { pending: number; failed: number; online: boolean } | null {
        if (!this.unifiedStorage) {
            return null
        }
        return this.unifiedStorage.getSyncStatus()
    }

    // NEW: Force sync all pending operations
    static async forceSyncAll(): Promise<void> {
        if (this.unifiedStorage) {
            await this.unifiedStorage.forceSyncAll()
            console.log('🔄 Force sync completed')
        } else {
            console.warn('Unified storage not available for force sync')
        }
    }

    static async getWorkoutActivities(
        limit: number = 50,
        offset: number = 0,
        type?: 'strength' | 'running' | 'yoga' | 'cycling'
    ): Promise<WorkoutActivity[]> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to get workout activities')
        }

        // Try Supabase first
        if (this.supabase) {
            try {
                let query = this.supabase
                    .from('workout_activities')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .order('completed_at', { ascending: false })
                    .range(offset, offset + limit - 1)

                if (type) {
                    query = query.eq('workout_type', type)
                }

                const { data, error } = await query

                if (error) throw error

                console.log('🗂️ Supabase activities debug:', {
                    totalSupabaseActivities: data?.length || 0,
                    activities: (data || []).map(a => ({
                        id: a.id,
                        name: a.name,
                        type: a.workout_type,
                        completedAt: a.completed_at,
                        duration: Math.round(a.duration_seconds / 60),
                        userId: a.user_id
                    }))
                })

                return (data || []).map(this.convertDbActivityToApp)
            } catch (error) {
                console.error('Error fetching workout activities from Supabase:', error)
            }
        }

        // Fallback to localStorage
        console.log('WorkoutStorage.getWorkoutActivities - Falling back to localStorage')
        const localActivities = this.getActivitiesFromLocalStorage()

        console.log('🗂️ localStorage activities debug:', {
            totalLocalActivities: localActivities.length,
            activities: localActivities.map(a => ({
                id: a.id,
                name: a.name,
                type: a.workoutType,
                completedAt: a.completedAt,
                duration: Math.round(a.durationSeconds / 60),
                userId: a.userId,
                hasUserId: !!a.userId
            }))
        })

        // Apply filtering and pagination to localStorage data
        let filteredActivities = localActivities
        if (type) {
            filteredActivities = localActivities.filter(activity => activity.workoutType === type)
        }

        // Sort by completed_at descending
        filteredActivities.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

        // Apply pagination
        return filteredActivities.slice(offset, offset + limit)
    }

    static async getRecentActivities(limit: number = 3): Promise<WorkoutActivity[]> {
        return this.getWorkoutActivities(limit, 0)
    }

    static async updateWorkoutActivity(activityId: string, updates: Partial<Omit<WorkoutActivity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to update workout activities')
        }

        // Try to update in Supabase
        if (this.supabase) {
            try {
                const updateData: Record<string, unknown> = {}

                if (updates.workoutType) updateData.workout_type = updates.workoutType
                if (updates.name !== undefined) updateData.name = updates.name || null
                if (updates.exercises) updateData.exercises = updates.exercises
                if (updates.durationSeconds !== undefined) updateData.duration_seconds = updates.durationSeconds
                if (updates.notes !== undefined) updateData.notes = updates.notes || null
                if (updates.completedAt) updateData.completed_at = updates.completedAt

                const { error } = await this.supabase
                    .from('workout_activities')
                    .update(updateData)
                    .eq('id', activityId)

                if (error) throw error

                console.log('Workout activity updated in Supabase:', activityId)
            } catch (error) {
                console.error('Error updating workout activity in Supabase:', error)
                // Add to sync queue
                this.addToSyncQueue({
                    action: 'upsert',
                    table: 'workout_activities',
                    data: { id: activityId, ...updates } as WorkoutActivity,
                    timestamp: Date.now()
                })
            }
        }

        // Update in localStorage
        try {
            const activities = this.getActivitiesFromLocalStorage()
            const activityIndex = activities.findIndex(a => a.id === activityId)
            if (activityIndex !== -1) {
                const updatedActivity = {
                    ...activities[activityIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                }
                this.saveActivityToLocalStorage(updatedActivity)
            }
        } catch (error) {
            console.error('Error updating activity in localStorage:', error)
        }
    }

    static async deleteWorkoutActivity(activityId: string): Promise<void> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to delete workout activities')
        }

        // Try to delete from Supabase
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('workout_activities')
                    .delete()
                    .eq('id', activityId)

                if (error) throw error

                console.log('Workout activity deleted from Supabase:', activityId)
            } catch (error) {
                console.error('Error deleting workout activity from Supabase:', error)
                // Add to sync queue
                this.addToSyncQueue({
                    action: 'delete',
                    table: 'workout_activities',
                    data: activityId,
                    timestamp: Date.now()
                })
            }
        }

        // Delete from localStorage
        this.deleteActivityFromLocalStorage(activityId)
    }

    static async getWorkoutActivityStats(): Promise<{
        totalWorkouts: number
        totalDurationSeconds: number
        workoutTypes: Record<string, number>
        thisWeekWorkouts: number
        thisMonthWorkouts: number
    }> {
        if (!this.currentUser || !this.supabase) {
            return {
                totalWorkouts: 0,
                totalDurationSeconds: 0,
                workoutTypes: {},
                thisWeekWorkouts: 0,
                thisMonthWorkouts: 0
            }
        }

        try {
            const { data, error } = await this.supabase
                .rpc('get_workout_activity_stats')

            if (error) throw error

            const stats = data?.[0] || {}
            return {
                totalWorkouts: stats.total_workouts || 0,
                totalDurationSeconds: stats.total_duration_seconds || 0,
                workoutTypes: stats.workout_types || {},
                thisWeekWorkouts: stats.this_week_workouts || 0,
                thisMonthWorkouts: stats.this_month_workouts || 0
            }
        } catch (error) {
            console.error('Error getting workout activity stats:', error)
            return {
                totalWorkouts: 0,
                totalDurationSeconds: 0,
                workoutTypes: {},
                thisWeekWorkouts: 0,
                thisMonthWorkouts: 0
            }
        }
    }

    // ============================================================================
    // CONVENIENCE METHODS
    // ============================================================================

    static createWorkout(type: 'strength' | 'running' | 'yoga' | 'cycling', workoutId: string): OngoingWorkout {
        const workout: OngoingWorkout = {
            id: `db-${Date.now()}`, // Will be replaced by Supabase UUID
            workoutId,
            type,
            exercises: [],
            startTime: new Date().toISOString(),
            elapsedTime: 0,
            isRunning: false,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`,
            userId: this.currentUser?.id
        }

        // Don't auto-save here, let the component save when needed
        return workout
    }

    static async getLastTemplate(type: 'strength' | 'running' | 'yoga' | 'cycling'): Promise<WorkoutTemplate | null> {
        const templates = await this.getTemplates(type)
        return templates.find(t => t.isBuiltIn) || templates[0] || null
    }

    static async createWorkoutFromTemplate(template: WorkoutTemplate, workoutId: string): Promise<OngoingWorkout> {
        const workout: OngoingWorkout = {
            id: `db-${Date.now()}`,
            workoutId,
            type: template.type,
            name: template.name,
            exercises: JSON.parse(JSON.stringify(template.exercises)), // Deep clone
            startTime: new Date().toISOString(),
            elapsedTime: 0,
            isRunning: false,
            userId: this.currentUser?.id
        }

        await this.saveOngoingWorkout(workout)
        return workout
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private static getOngoingWorkoutFromLocalStorage(): OngoingWorkout | null {
        if (typeof window === 'undefined') return null

        try {
            const stored = localStorage.getItem(this.ONGOING_WORKOUT_KEY)
            if (!stored) return null

            const workout = JSON.parse(stored) as OngoingWorkout

            // Security check: ensure workout belongs to current user
            if (this.currentUser && workout.userId && workout.userId !== this.currentUser.id) {
                console.warn('Clearing localStorage workout that belongs to different user')
                localStorage.removeItem(this.ONGOING_WORKOUT_KEY)
                return null
            }

            return workout
        } catch (error) {
            console.error('Error loading ongoing workout from localStorage:', error)
            return null
        }
    }

    private static saveOngoingWorkoutToLocalStorage(workout: OngoingWorkout): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(this.ONGOING_WORKOUT_KEY, JSON.stringify(workout))
        } catch (error) {
            console.error('Error saving ongoing workout to localStorage:', error)
        }
    }

    private static clearOngoingWorkoutFromLocalStorage(): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.removeItem(this.ONGOING_WORKOUT_KEY)
        } catch (error) {
            console.error('Error clearing ongoing workout from localStorage:', error)
        }
    }

    private static getTemplatesFromLocalStorage(type?: string): WorkoutTemplate[] {
        if (typeof window === 'undefined') return []

        try {
            const stored = localStorage.getItem(this.TEMPLATES_KEY)
            const templates: WorkoutTemplate[] = stored ? JSON.parse(stored) : []
            return type ? templates.filter(t => t.type === type) : templates
        } catch (error) {
            console.error('Error loading templates from localStorage:', error)
            return []
        }
    }

    private static saveTemplateToLocalStorage(template: WorkoutTemplate): void {
        if (typeof window === 'undefined') return

        try {
            const existing = this.getTemplatesFromLocalStorage()
            const updated = [...existing, template]
            localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Error saving template to localStorage:', error)
        }
    }

    private static deleteTemplateFromLocalStorage(templateId: string): void {
        if (typeof window === 'undefined') return

        try {
            const existing = this.getTemplatesFromLocalStorage()
            const updated = existing.filter(t => t.id !== templateId)
            localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Error deleting template from localStorage:', error)
        }
    }

    private static getActivitiesFromLocalStorage(): WorkoutActivity[] {
        if (typeof window === 'undefined') return []

        try {
            const stored = localStorage.getItem(this.ACTIVITIES_KEY)
            if (!stored) return []

            const activities = JSON.parse(stored) as WorkoutActivity[]

            // Security check: filter activities for current user
            if (this.currentUser) {
                return activities.filter(activity => !activity.userId || activity.userId === this.currentUser!.id)
            }

            return activities
        } catch (error) {
            console.error('Error loading activities from localStorage:', error)
            return []
        }
    }

    private static saveActivityToLocalStorage(activity: WorkoutActivity): void {
        if (typeof window === 'undefined') return

        try {
            const existing = this.getActivitiesFromLocalStorage()
            const updated = [activity, ...existing.filter(a => a.id !== activity.id)]
            localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Error saving activity to localStorage:', error)
        }
    }

    private static deleteActivityFromLocalStorage(activityId: string): void {
        if (typeof window === 'undefined') return

        try {
            const existing = this.getActivitiesFromLocalStorage()
            const updated = existing.filter(a => a.id !== activityId)
            localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Error deleting activity from localStorage:', error)
        }
    }

    // Convert between database and app formats
    private static convertDbOngoingWorkoutToApp(db: DatabaseOngoingWorkout): OngoingWorkout {
        return {
            id: db.id,
            workoutId: db.workout_id,
            type: db.type as OngoingWorkout['type'],
            name: db.name || undefined,
            exercises: db.exercises,
            startTime: db.start_time,
            elapsedTime: db.elapsed_time,
            isRunning: db.is_running,
            userId: db.user_id
        }
    }

    private static convertAppOngoingWorkoutToDb(app: OngoingWorkout): Omit<DatabaseOngoingWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            workout_id: app.workoutId,
            type: app.type,
            name: app.name || null,
            exercises: app.exercises,
            start_time: app.startTime,
            elapsed_time: app.elapsedTime,
            is_running: app.isRunning
        }
    }

    private static convertDbTemplateToApp(db: DatabaseWorkoutTemplate): WorkoutTemplate {
        return {
            id: db.id,
            name: db.name,
            type: db.type as WorkoutTemplate['type'],
            exercises: db.exercises,
            isBuiltIn: db.is_built_in,
            createdAt: db.created_at,
            userId: db.user_id || undefined
        }
    }

    private static convertAppTemplateToDb(app: WorkoutTemplate): Omit<DatabaseWorkoutTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            name: app.name,
            type: app.type,
            exercises: app.exercises,
            is_built_in: app.isBuiltIn || false
        }
    }

    private static convertDbActivityToApp(db: DatabaseWorkoutActivity): WorkoutActivity {
        return {
            id: db.id,
            workoutType: db.workout_type as WorkoutActivity['workoutType'],
            name: db.name || undefined,
            exercises: db.exercises,
            durationSeconds: db.duration_seconds,
            notes: db.notes || undefined,
            completedAt: db.completed_at,
            createdAt: db.created_at,
            updatedAt: db.updated_at,
            userId: db.user_id
        }
    }

    private static convertAppActivityToDb(app: WorkoutActivity): Omit<DatabaseWorkoutActivity, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            workout_type: app.workoutType,
            name: app.name || null,
            exercises: app.exercises,
            duration_seconds: app.durationSeconds,
            notes: app.notes || null,
            completed_at: app.completedAt
        }
    }

    // ============================================================================
    // SYNC QUEUE AND ERROR HANDLING
    // ============================================================================

    private static addToSyncQueue(operation: SyncOperation): void {
        if (typeof window === 'undefined') return

        try {
            const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]')
            queue.push({
                ...operation,
                retryCount: 0,
                maxRetries: 3
            })
            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue))
            console.log('Added operation to sync queue:', operation.action, operation.table)
        } catch (error) {
            console.error('Error adding to sync queue:', error)
        }
    }

    private static async processSyncQueue(): Promise<void> {
        if (typeof window === 'undefined' || !this.supabase || !this.currentUser) return

        try {
            const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]')
            if (queue.length === 0) return

            console.log(`Processing ${queue.length} queued sync operations`)

            const failedOperations: SyncOperation[] = []

            for (const operation of queue) {
                try {
                    await this.processSyncOperation(operation)
                    console.log('Successfully processed sync operation:', operation.action, operation.table)
                } catch (error) {
                    console.error('Error processing sync operation:', error)

                    // Increment retry count
                    operation.retryCount = (operation.retryCount || 0) + 1

                    // Add back to failed operations if under max retries
                    if (operation.retryCount < operation.maxRetries) {
                        failedOperations.push(operation)
                        console.log(`Retry ${operation.retryCount}/${operation.maxRetries} for operation:`, operation.action)
                    } else {
                        console.warn('Max retries exceeded for operation:', operation.action, operation.table)
                    }
                }
            }

            // Update queue with only failed operations that can be retried
            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(failedOperations))

            if (failedOperations.length > 0) {
                console.log(`${failedOperations.length} operations remain in sync queue for retry`)
            }
        } catch (error) {
            console.error('Error processing sync queue:', error)
        }
    }

    private static async processSyncOperation(operation: SyncOperation): Promise<void> {
        if (!this.supabase || !this.currentUser) {
            throw new Error('Supabase client or user not available')
        }

        switch (operation.table) {
            case 'ongoing_workouts':
                await this.processSyncOngoingWorkout(operation)
                break
            case 'workout_templates':
                await this.processSyncTemplate(operation)
                break
            case 'workout_activities':
                await this.processSyncWorkoutActivity(operation)
                break
            default:
                throw new Error(`Unknown sync table: ${operation.table}`)
        }
    }

    private static async processSyncOngoingWorkout(operation: SyncOperation): Promise<void> {
        switch (operation.action) {
            case 'upsert':
                if (typeof operation.data === 'object' && operation.data !== null && 'workoutId' in operation.data) {
                    const dbWorkout = this.convertAppOngoingWorkoutToDb(operation.data as OngoingWorkout)

                    // Check if ongoing workout exists for this user and update/insert accordingly
                    const { data: existingWorkout } = await this.supabase!
                        .from('ongoing_workouts')
                        .select('id')
                        .eq('user_id', this.currentUser!.id)
                        .not('user_id', 'is', null)
                        .single()

                    if (existingWorkout) {
                        // Update existing workout
                        const { error: updateError } = await this.supabase!
                            .from('ongoing_workouts')
                            .update({
                                ...dbWorkout,
                            })
                            .eq('user_id', this.currentUser!.id)
                            .not('user_id', 'is', null)
                        if (updateError) throw updateError
                    } else {
                        // Insert new workout
                        const { error: insertError } = await this.supabase!
                            .from('ongoing_workouts')
                            .insert({
                                ...dbWorkout,
                                user_id: this.currentUser!.id
                            })
                        if (insertError) throw insertError
                    }
                }
                break

            case 'delete':
                const { error: deleteError } = await this.supabase!
                    .from('ongoing_workouts')
                    .delete()
                    .eq('user_id', this.currentUser!.id)
                    .not('user_id', 'is', null)
                if (deleteError) throw deleteError
                break

            default:
                throw new Error(`Unknown sync action for ongoing_workouts: ${operation.action}`)
        }
    }

    private static async processSyncTemplate(operation: SyncOperation): Promise<void> {
        switch (operation.action) {
            case 'insert':
                if (typeof operation.data === 'object' && operation.data !== null && 'name' in operation.data) {
                    const dbTemplate = this.convertAppTemplateToDb(operation.data as WorkoutTemplate)
                    const { error: insertError } = await this.supabase!
                        .from('workout_templates')
                        .insert({
                            ...dbTemplate,
                            user_id: this.currentUser!.id
                        })
                    if (insertError) throw insertError
                }
                break

            case 'delete':
                if (typeof operation.data === 'string') {
                    const { error: deleteError } = await this.supabase!
                        .from('workout_templates')
                        .delete()
                        .eq('id', operation.data)
                        .eq('user_id', this.currentUser!.id)
                        .not('user_id', 'is', null)
                        .eq('is_built_in', false)
                    if (deleteError) throw deleteError
                }
                break

            default:
                throw new Error(`Unknown sync action for workout_templates: ${operation.action}`)
        }
    }

    private static async processSyncWorkoutActivity(operation: SyncOperation): Promise<void> {
        switch (operation.action) {
            case 'insert':
                if (typeof operation.data === 'object' && operation.data !== null && 'workoutType' in operation.data) {
                    const dbActivity = this.convertAppActivityToDb(operation.data as WorkoutActivity)
                    const { error: insertError } = await this.supabase!
                        .from('workout_activities')
                        .insert({
                            ...dbActivity,
                            user_id: this.currentUser!.id
                        })
                    if (insertError) throw insertError
                }
                break

            case 'upsert':
                if (typeof operation.data === 'object' && operation.data !== null && 'workoutType' in operation.data) {
                    const activity = operation.data as WorkoutActivity
                    const updateData: Record<string, unknown> = {}

                    if (activity.workoutType) updateData.workout_type = activity.workoutType
                    if (activity.name !== undefined) updateData.name = activity.name || null
                    if (activity.exercises) updateData.exercises = activity.exercises
                    if (activity.durationSeconds !== undefined) updateData.duration_seconds = activity.durationSeconds
                    if (activity.notes !== undefined) updateData.notes = activity.notes || null
                    if (activity.completedAt) updateData.completed_at = activity.completedAt

                    const { error: updateError } = await this.supabase!
                        .from('workout_activities')
                        .update(updateData)
                        .eq('id', activity.id)
                    if (updateError) throw updateError
                }
                break

            case 'delete':
                if (typeof operation.data === 'string') {
                    const { error: deleteError } = await this.supabase!
                        .from('workout_activities')
                        .delete()
                        .eq('id', operation.data)
                    if (deleteError) throw deleteError
                }
                break

            default:
                throw new Error(`Unknown sync action for workout_activities: ${operation.action}`)
        }
    }

    // Connection status monitoring
    static isOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true
    }

    static onConnectionChange(callback: (online: boolean) => void): () => void {
        if (typeof window === 'undefined') return () => { }

        const handleOnline = () => callback(true)
        const handleOffline = () => callback(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }

    // Enhanced error handling
    static async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 1000
    ): Promise<T> {
        let lastError: Error = new Error('Unknown error')

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation()
            } catch (error) {
                lastError = error as Error
                console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error)

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt))
                }
            }
        }

        throw lastError
    }

    // Debug utility to check database connection and RLS
    static async debugDatabaseConnection(): Promise<void> {
        if (!this.supabase || !this.currentUser) {
            console.log('🔍 Debug: No supabase client or user available')
            return
        }

        console.log('🔍 Debug: Checking database connection and RLS...')

        try {
            // Check current auth user
            const { data: authUser, error: authError } = await this.supabase.auth.getUser()
            console.log('🔍 Auth user:', {
                id: authUser.user?.id,
                email: authUser.user?.email,
                error: authError
            })

            // Check if we can query tables (should respect RLS)
            const { data: workouts, error: workoutsError } = await this.supabase
                .from('ongoing_workouts')
                .select('id, user_id')
                .not('user_id', 'is', null)
                .limit(10)

            console.log('🔍 Ongoing workouts query result:', {
                count: workouts?.length || 0,
                userIds: workouts?.map(w => w.user_id).slice(0, 3),
                error: workoutsError
            })

            const { data: templates, error: templatesError } = await this.supabase
                .from('workout_templates')
                .select('id, user_id, name, is_built_in')
                .limit(10)

            console.log('🔍 Templates query result:', {
                count: templates?.length || 0,
                sample: templates?.slice(0, 3).map(t => ({
                    name: t.name,
                    user_id: t.user_id,
                    is_built_in: t.is_built_in
                })),
                error: templatesError
            })

            // Test explicit user filter
            const { data: userWorkouts, error: userWorkoutsError } = await this.supabase
                .from('ongoing_workouts')
                .select('id, user_id')
                .eq('user_id', this.currentUser.id)
                .not('user_id', 'is', null)

            console.log('🔍 User-specific workouts:', {
                count: userWorkouts?.length || 0,
                error: userWorkoutsError
            })

        } catch (error) {
            console.error('🔍 Debug error:', error)
        }
    }

    // Debounced save for frequent updates like timer
    private static saveTimeout: NodeJS.Timeout | null = null
    private static debouncedSaveOngoingWorkout(workout: OngoingWorkout): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout)
        }

        this.saveTimeout = setTimeout(() => {
            this.saveOngoingWorkout(workout)
        }, 10000) // Save to Supabase every 10 seconds for timer updates
    }

    // Background timer sync - saves running workout state periodically
    private static backgroundSyncInterval: NodeJS.Timeout | null = null
    private static startBackgroundSync(): void {
        if (this.backgroundSyncInterval) {
            clearInterval(this.backgroundSyncInterval)
        }

        this.backgroundSyncInterval = setInterval(() => {
            const workout = this.getOngoingWorkoutFromLocalStorage()
            if (workout && workout.isRunning) {
                // Update elapsed time for running workouts
                const currentElapsedTime = this.getCurrentElapsedTime()
                if (currentElapsedTime > workout.elapsedTime) {
                    const updatedWorkout = {
                        ...workout,
                        elapsedTime: currentElapsedTime
                    }
                    this.saveOngoingWorkoutToLocalStorage(updatedWorkout)
                    this.debouncedSaveOngoingWorkout(updatedWorkout)
                }
            }
        }, 30000) // Sync every 30 seconds
    }

    private static stopBackgroundSync(): void {
        if (this.backgroundSyncInterval) {
            clearInterval(this.backgroundSyncInterval)
            this.backgroundSyncInterval = null
        }
    }

    // ============================================================================
    // REAL-TIME SYNCHRONIZATION
    // ============================================================================

    private static setupRealtimeSync(): void {
        if (!this.supabase || !this.currentUser) return

        // Clean up existing channel
        if (this.realtimeChannel) {
            this.supabase.removeChannel(this.realtimeChannel)
        }

        // Create new channel for user's data
        this.realtimeChannel = this.supabase
            .channel(`user-workouts-${this.currentUser.id}`)
            .on(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                'postgres_changes' as any,
                {
                    event: '*',
                    schema: 'public',
                    table: 'ongoing_workouts',
                    filter: `user_id=eq.${this.currentUser.id}`
                },
                this.handleOngoingWorkoutChange.bind(this)
            )
            .on(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                'postgres_changes' as any,
                {
                    event: '*',
                    schema: 'public',
                    table: 'workout_templates',
                    filter: `user_id=eq.${this.currentUser.id}`
                },
                this.handleTemplateChange.bind(this)
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
            })
    }

    private static async handleOngoingWorkoutChange(payload: { eventType: string; new?: DatabaseOngoingWorkout; old?: DatabaseOngoingWorkout }): Promise<void> {
        console.log('Ongoing workout changed:', payload)

        let workout: OngoingWorkout | null = null

        if (payload.eventType === 'DELETE') {
            workout = null
        } else if (payload.new) {
            workout = this.convertDbOngoingWorkoutToApp(payload.new)
        }

        // Update localStorage to stay in sync
        if (workout) {
            this.saveOngoingWorkoutToLocalStorage(workout)
        } else {
            this.clearOngoingWorkoutFromLocalStorage()
        }

        // Notify all listeners
        this.ongoingWorkoutListeners.forEach(listener => {
            try {
                listener(workout)
            } catch (error) {
                console.error('Error in ongoing workout listener:', error)
            }
        })
    }

    private static async handleTemplateChange(payload: { eventType: string; new?: DatabaseWorkoutTemplate; old?: DatabaseWorkoutTemplate }): Promise<void> {
        console.log('Template changed:', payload)

        // Refresh templates from database and notify listeners
        try {
            const templates = await this.getTemplates()
            this.templatesListeners.forEach(listener => {
                try {
                    listener(templates)
                } catch (error) {
                    console.error('Error in template listener:', error)
                }
            })
        } catch (error) {
            console.error('Error refreshing templates after change:', error)
        }
    }

    // Public methods for components to subscribe to changes
    static subscribeToOngoingWorkout(callback: (workout: OngoingWorkout | null) => void): () => void {
        this.ongoingWorkoutListeners.push(callback)

        // Return unsubscribe function
        return () => {
            const index = this.ongoingWorkoutListeners.indexOf(callback)
            if (index > -1) {
                this.ongoingWorkoutListeners.splice(index, 1)
            }
        }
    }

    static subscribeToTemplates(callback: (templates: WorkoutTemplate[]) => void): () => void {
        this.templatesListeners.push(callback)

        // Return unsubscribe function
        return () => {
            const index = this.templatesListeners.indexOf(callback)
            if (index > -1) {
                this.templatesListeners.splice(index, 1)
            }
        }
    }

    static cleanup(): void {
        if (this.realtimeChannel && this.supabase) {
            this.supabase.removeChannel(this.realtimeChannel)
            this.realtimeChannel = null
        }

        this.ongoingWorkoutListeners = []
        this.templatesListeners = []

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout)
            this.saveTimeout = null
        }

        this.stopBackgroundSync()
    }
}