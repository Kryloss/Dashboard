// User data storage with Supabase integration and localStorage fallback
// Following the same pattern as WorkoutStorage for consistency
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
    id: string
    userId: string
    weight?: number
    age?: number
    height?: number
    weightUnit: string
    heightUnit: string
    createdAt: string
    updatedAt: string
}

export interface UserGoals {
    id: string
    userId: string
    dailyExerciseMinutes: number
    weeklyExerciseSessions: number
    dailyCalories: number
    activityLevel: string
    sleepHours: number
    recoveryMinutes: number
    startingWeight?: number
    goalWeight?: number
    dietType: string
    createdAt: string
    updatedAt: string
}

export interface SleepSession {
    id: string
    startTime: number // minutes from midnight (0-720 for 12am-12pm)
    endTime: number
    wakeUps: number
    type: 'main' | 'nap'
}

export interface SleepData {
    id: string
    userId: string
    date: string // YYYY-MM-DD format
    sessions: SleepSession[]
    qualityRating: number // 1-5 rating
    totalMinutes: number
    totalWakeUps: number
    createdAt: string
    updatedAt: string
}

interface DatabaseUserProfile {
    id: string
    user_id: string
    weight: number | null
    age: number | null
    height: number | null
    weight_unit: string
    height_unit: string
    created_at: string
    updated_at: string
}

interface DatabaseUserGoals {
    id: string
    user_id: string
    daily_exercise_minutes: number
    weekly_exercise_sessions: number
    daily_calories: number
    activity_level: string
    sleep_hours: number
    recovery_minutes: number
    starting_weight: number | null
    goal_weight: number | null
    diet_type: string
    created_at: string
    updated_at: string
}

interface DatabaseSleepData {
    id: string
    user_id: string
    date: string
    sessions: string // JSON string of SleepSession[]
    quality_rating: number
    total_minutes: number
    total_wake_ups: number
    created_at: string
    updated_at: string
}

interface SyncOperation {
    action: 'upsert' | 'insert' | 'delete'
    table: 'user_profiles' | 'user_goals' | 'sleep_data'
    data: UserProfile | UserGoals | SleepData | string | null
    timestamp: number
    retryCount?: number
    maxRetries?: number
}

export class UserDataStorage {
    private static supabase: SupabaseClient | null = null
    private static currentUser: User | null = null

    // Dynamic keys that include user context for isolation
    private static get PROFILE_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-user-profile${userSuffix}`
    }

    private static get GOALS_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-user-goals${userSuffix}`
    }

    private static get SYNC_QUEUE_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-user-sync-queue${userSuffix}`
    }

    private static get SLEEP_DATA_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-sleep-data${userSuffix}`
    }

    // Real-time synchronization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static realtimeChannel: any = null
    private static profileListeners: Array<(profile: UserProfile | null) => void> = []
    private static goalsListeners: Array<(goals: UserGoals | null) => void> = []

    // Initialize with user and supabase client
    static initialize(user: User | null, supabaseClient?: SupabaseClient) {
        console.log('UserDataStorage.initialize - User:', user?.id, user?.email)
        console.log('UserDataStorage.initialize - Has supabaseClient:', !!supabaseClient)

        this.currentUser = user
        if (supabaseClient) {
            this.supabase = supabaseClient
        } else if (typeof window !== 'undefined') {
            this.supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
        }

        // Verify the supabase client has the correct auth context
        if (this.supabase) {
            this.supabase.auth.getUser().then(({ data: authUser, error }) => {
                console.log('UserDataStorage.initialize - Supabase auth context:', {
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

            // Set up automatic sync on connection recovery
            this.onConnectionChange((online) => {
                if (online && this.currentUser && this.supabase) {
                    console.log('Connection restored, processing user data sync queue')
                    this.processSyncQueue()
                }
            })
        }
    }

    // ============================================================================
    // USER PROFILE MANAGEMENT
    // ============================================================================

    static async getUserProfile(): Promise<UserProfile | null> {
        console.log('UserDataStorage.getUserProfile - Current user:', this.currentUser?.id, this.currentUser?.email)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                // Debug: Check current auth user in Supabase
                const { data: authUser } = await this.supabase.auth.getUser()
                console.log('UserDataStorage.getUserProfile - Supabase auth user:', authUser.user?.id, authUser.user?.email)

                if (!authUser.user) {
                    console.warn('UserDataStorage.getUserProfile - No authenticated user in Supabase context')
                    return this.getUserProfileFromLocalStorage()
                }

                // Explicit user_id filter with null check for security
                const { data, error } = await this.supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .single()

                console.log('UserDataStorage.getUserProfile - Query result:', { data, error })

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No profile found in database
                        console.log('UserDataStorage.getUserProfile - No profile found in database')
                        return null
                    }
                    throw error
                }

                // Convert database format to app format
                return this.convertDbProfileToApp(data)
            } catch (error) {
                console.error('Error fetching user profile from Supabase:', error)
                // Fall back to localStorage
            }
        }

        // Fallback to localStorage
        console.log('UserDataStorage.getUserProfile - Falling back to localStorage')
        return this.getUserProfileFromLocalStorage()
    }

    static async saveUserProfile(profileData: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save profile')
        }

        // Always save to localStorage first for immediate feedback
        const localProfile = this.getUserProfileFromLocalStorage()
        const updatedProfile: UserProfile = {
            id: localProfile?.id || `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser.id,
            weightUnit: 'kg',
            heightUnit: 'cm',
            createdAt: localProfile?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...profileData
        }

        this.saveUserProfileToLocalStorage(updatedProfile)

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbProfile = this.convertAppProfileToDb(updatedProfile)

                // Check if profile exists for this user and update/insert accordingly
                const { data: existingProfile } = await this.supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .single()

                let error: Error | null = null

                if (existingProfile) {
                    // Update existing profile
                    const updateResult = await this.supabase
                        .from('user_profiles')
                        .update({
                            ...dbProfile,
                        })
                        .eq('user_id', this.currentUser.id)
                        .not('user_id', 'is', null)
                    error = updateResult.error
                } else {
                    // Insert new profile
                    const insertResult = await this.supabase
                        .from('user_profiles')
                        .insert({
                            ...dbProfile,
                            user_id: this.currentUser.id
                        })
                    error = insertResult.error
                }

                if (error) throw error

                console.log('User profile saved to Supabase:', updatedProfile.id)
            } catch (error) {
                console.error('Error saving user profile to Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'upsert',
                    table: 'user_profiles',
                    data: updatedProfile,
                    timestamp: Date.now()
                })
            }
        }

        return updatedProfile
    }

    // ============================================================================
    // USER GOALS MANAGEMENT
    // ============================================================================

    static async getUserGoals(): Promise<UserGoals | null> {
        console.log('UserDataStorage.getUserGoals - Current user:', this.currentUser?.id, this.currentUser?.email)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                // Debug: Check current auth user in Supabase
                const { data: authUser } = await this.supabase.auth.getUser()
                console.log('UserDataStorage.getUserGoals - Supabase auth user:', authUser.user?.id, authUser.user?.email)

                if (!authUser.user) {
                    console.warn('UserDataStorage.getUserGoals - No authenticated user in Supabase context')
                    return this.getUserGoalsFromLocalStorage()
                }

                // Explicit user_id filter with null check for security
                const { data, error } = await this.supabase
                    .from('user_goals')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .single()

                console.log('UserDataStorage.getUserGoals - Query result:', { data, error })

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No goals found in database
                        console.log('UserDataStorage.getUserGoals - No goals found in database')
                        return null
                    }
                    throw error
                }

                // Convert database format to app format
                return this.convertDbGoalsToApp(data)
            } catch (error) {
                console.error('Error fetching user goals from Supabase:', error)
                // Fall back to localStorage
            }
        }

        // Fallback to localStorage
        console.log('UserDataStorage.getUserGoals - Falling back to localStorage')
        return this.getUserGoalsFromLocalStorage()
    }

    static async saveUserGoals(goalsData: Partial<Omit<UserGoals, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserGoals> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save goals')
        }

        // Always save to localStorage first for immediate feedback
        const localGoals = this.getUserGoalsFromLocalStorage()
        const updatedGoals: UserGoals = {
            id: localGoals?.id || `goals-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser.id,
            dailyExerciseMinutes: 30,
            weeklyExerciseSessions: 3,
            dailyCalories: 2000,
            activityLevel: 'moderate',
            sleepHours: 8.0,
            recoveryMinutes: 60,
            dietType: 'maintenance',
            createdAt: localGoals?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...goalsData
        }

        this.saveUserGoalsToLocalStorage(updatedGoals)

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbGoals = this.convertAppGoalsToDb(updatedGoals)

                // Check if goals exist for this user and update/insert accordingly
                const { data: existingGoals } = await this.supabase
                    .from('user_goals')
                    .select('id')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .single()

                let error: Error | null = null

                if (existingGoals) {
                    // Update existing goals
                    const updateResult = await this.supabase
                        .from('user_goals')
                        .update({
                            ...dbGoals,
                        })
                        .eq('user_id', this.currentUser.id)
                        .not('user_id', 'is', null)
                    error = updateResult.error
                } else {
                    // Insert new goals
                    const insertResult = await this.supabase
                        .from('user_goals')
                        .insert({
                            ...dbGoals,
                            user_id: this.currentUser.id
                        })
                    error = insertResult.error
                }

                if (error) throw error

                console.log('User goals saved to Supabase:', updatedGoals.id)
            } catch (error) {
                console.error('Error saving user goals to Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'upsert',
                    table: 'user_goals',
                    data: updatedGoals,
                    timestamp: Date.now()
                })
            }
        }

        return updatedGoals
    }

    // ============================================================================
    // SLEEP DATA MANAGEMENT
    // ============================================================================

    static async getSleepData(date?: string): Promise<SleepData | null> {
        const targetDate = date || new Date().toISOString().split('T')[0]
        console.log('UserDataStorage.getSleepData - Date:', targetDate, 'User:', this.currentUser?.id)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                const { data: authUser } = await this.supabase.auth.getUser()
                console.log('UserDataStorage.getSleepData - Supabase auth user:', authUser.user?.id)

                if (!authUser.user) {
                    console.warn('UserDataStorage.getSleepData - No authenticated user in Supabase context')
                    return this.getSleepDataFromLocalStorage(targetDate)
                }

                const { data, error } = await this.supabase
                    .from('sleep_data')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .eq('date', targetDate)
                    .not('user_id', 'is', null)
                    .single()

                console.log('UserDataStorage.getSleepData - Query result:', { data, error })

                if (error) {
                    if (error.code === 'PGRST116') {
                        console.log('UserDataStorage.getSleepData - No sleep data found for date')
                        return null
                    }
                    throw error
                }

                return this.convertDbSleepToApp(data)
            } catch (error) {
                console.error('Error fetching sleep data from Supabase:', error)
            }
        }

        console.log('UserDataStorage.getSleepData - Falling back to localStorage')
        return this.getSleepDataFromLocalStorage(targetDate)
    }

    static async saveSleepData(sleepData: Omit<SleepData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SleepData> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save sleep data')
        }

        const localSleepData = this.getSleepDataFromLocalStorage(sleepData.date)
        const updatedSleepData: SleepData = {
            id: localSleepData?.id || `sleep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser.id,
            createdAt: localSleepData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...sleepData
        }

        this.saveSleepDataToLocalStorage(updatedSleepData)

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbSleepData = this.convertAppSleepToDb(updatedSleepData)

                // Check if sleep data exists for this user and date
                const { data: existingSleepData } = await this.supabase
                    .from('sleep_data')
                    .select('id')
                    .eq('user_id', this.currentUser.id)
                    .eq('date', sleepData.date)
                    .not('user_id', 'is', null)
                    .single()

                let error: Error | null = null

                if (existingSleepData) {
                    // Update existing sleep data
                    const updateResult = await this.supabase
                        .from('sleep_data')
                        .update({
                            ...dbSleepData,
                        })
                        .eq('user_id', this.currentUser.id)
                        .eq('date', sleepData.date)
                        .not('user_id', 'is', null)
                    error = updateResult.error
                } else {
                    // Insert new sleep data
                    const insertResult = await this.supabase
                        .from('sleep_data')
                        .insert({
                            ...dbSleepData,
                            user_id: this.currentUser.id
                        })
                    error = insertResult.error
                }

                if (error) throw error

                console.log('Sleep data saved to Supabase:', updatedSleepData.id)
            } catch (error) {
                console.error('Error saving sleep data to Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'upsert',
                    table: 'sleep_data',
                    data: updatedSleepData,
                    timestamp: Date.now()
                })
            }
        }

        return updatedSleepData
    }

    static async getSleepDataRange(startDate: string, endDate: string): Promise<SleepData[]> {
        if (!this.currentUser) return []

        // Try Supabase first if user is authenticated
        if (this.supabase) {
            try {
                const { data: authUser } = await this.supabase.auth.getUser()
                if (!authUser.user) {
                    return this.getSleepDataRangeFromLocalStorage(startDate, endDate)
                }

                const { data, error } = await this.supabase
                    .from('sleep_data')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .gte('date', startDate)
                    .lte('date', endDate)
                    .not('user_id', 'is', null)
                    .order('date', { ascending: false })

                if (error) throw error

                return data.map(item => this.convertDbSleepToApp(item))
            } catch (error) {
                console.error('Error fetching sleep data range from Supabase:', error)
            }
        }

        return this.getSleepDataRangeFromLocalStorage(startDate, endDate)
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private static getUserProfileFromLocalStorage(): UserProfile | null {
        if (typeof window === 'undefined') return null

        try {
            const stored = localStorage.getItem(this.PROFILE_KEY)
            if (!stored) return null

            const profile = JSON.parse(stored) as UserProfile

            // Security check: ensure profile belongs to current user
            if (this.currentUser && profile.userId && profile.userId !== this.currentUser.id) {
                console.warn('Clearing localStorage profile that belongs to different user')
                localStorage.removeItem(this.PROFILE_KEY)
                return null
            }

            return profile
        } catch (error) {
            console.error('Error loading user profile from localStorage:', error)
            return null
        }
    }

    private static saveUserProfileToLocalStorage(profile: UserProfile): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile))
        } catch (error) {
            console.error('Error saving user profile to localStorage:', error)
        }
    }

    private static getUserGoalsFromLocalStorage(): UserGoals | null {
        if (typeof window === 'undefined') return null

        try {
            const stored = localStorage.getItem(this.GOALS_KEY)
            if (!stored) return null

            const goals = JSON.parse(stored) as UserGoals

            // Security check: ensure goals belong to current user
            if (this.currentUser && goals.userId && goals.userId !== this.currentUser.id) {
                console.warn('Clearing localStorage goals that belong to different user')
                localStorage.removeItem(this.GOALS_KEY)
                return null
            }

            return goals
        } catch (error) {
            console.error('Error loading user goals from localStorage:', error)
            return null
        }
    }

    private static saveUserGoalsToLocalStorage(goals: UserGoals): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(this.GOALS_KEY, JSON.stringify(goals))
        } catch (error) {
            console.error('Error saving user goals to localStorage:', error)
        }
    }

    private static getSleepDataFromLocalStorage(date: string): SleepData | null {
        if (typeof window === 'undefined') return null

        try {
            const stored = localStorage.getItem(`${this.SLEEP_DATA_KEY}-${date}`)
            if (!stored) return null

            const sleepData = JSON.parse(stored) as SleepData

            // Security check: ensure sleep data belongs to current user
            if (this.currentUser && sleepData.userId && sleepData.userId !== this.currentUser.id) {
                console.warn('Clearing localStorage sleep data that belongs to different user')
                localStorage.removeItem(`${this.SLEEP_DATA_KEY}-${date}`)
                return null
            }

            return sleepData
        } catch (error) {
            console.error('Error loading sleep data from localStorage:', error)
            return null
        }
    }

    private static saveSleepDataToLocalStorage(sleepData: SleepData): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(`${this.SLEEP_DATA_KEY}-${sleepData.date}`, JSON.stringify(sleepData))
        } catch (error) {
            console.error('Error saving sleep data to localStorage:', error)
        }
    }

    private static getSleepDataRangeFromLocalStorage(startDate: string, endDate: string): SleepData[] {
        if (typeof window === 'undefined') return []

        try {
            const sleepDataArray: SleepData[] = []
            const start = new Date(startDate)
            const end = new Date(endDate)

            // Iterate through each date in the range
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const dateString = date.toISOString().split('T')[0]
                const sleepData = this.getSleepDataFromLocalStorage(dateString)
                if (sleepData) {
                    sleepDataArray.push(sleepData)
                }
            }

            return sleepDataArray.sort((a, b) => b.date.localeCompare(a.date))
        } catch (error) {
            console.error('Error loading sleep data range from localStorage:', error)
            return []
        }
    }

    // Convert between database and app formats
    private static convertDbProfileToApp(db: DatabaseUserProfile): UserProfile {
        return {
            id: db.id,
            userId: db.user_id,
            weight: db.weight || undefined,
            age: db.age || undefined,
            height: db.height || undefined,
            weightUnit: db.weight_unit,
            heightUnit: db.height_unit,
            createdAt: db.created_at,
            updatedAt: db.updated_at
        }
    }

    private static convertAppProfileToDb(app: UserProfile): Omit<DatabaseUserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            weight: app.weight || null,
            age: app.age || null,
            height: app.height || null,
            weight_unit: app.weightUnit,
            height_unit: app.heightUnit
        }
    }

    private static convertDbGoalsToApp(db: DatabaseUserGoals): UserGoals {
        return {
            id: db.id,
            userId: db.user_id,
            dailyExerciseMinutes: db.daily_exercise_minutes,
            weeklyExerciseSessions: db.weekly_exercise_sessions,
            dailyCalories: db.daily_calories,
            activityLevel: db.activity_level,
            sleepHours: db.sleep_hours,
            recoveryMinutes: db.recovery_minutes,
            startingWeight: db.starting_weight || undefined,
            goalWeight: db.goal_weight || undefined,
            dietType: db.diet_type,
            createdAt: db.created_at,
            updatedAt: db.updated_at
        }
    }

    private static convertAppGoalsToDb(app: UserGoals): Omit<DatabaseUserGoals, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            daily_exercise_minutes: app.dailyExerciseMinutes,
            weekly_exercise_sessions: app.weeklyExerciseSessions,
            daily_calories: app.dailyCalories,
            activity_level: app.activityLevel,
            sleep_hours: app.sleepHours,
            recovery_minutes: app.recoveryMinutes,
            starting_weight: app.startingWeight || null,
            goal_weight: app.goalWeight || null,
            diet_type: app.dietType
        }
    }

    private static convertDbSleepToApp(db: DatabaseSleepData): SleepData {
        return {
            id: db.id,
            userId: db.user_id,
            date: db.date,
            sessions: JSON.parse(db.sessions),
            qualityRating: db.quality_rating,
            totalMinutes: db.total_minutes,
            totalWakeUps: db.total_wake_ups,
            createdAt: db.created_at,
            updatedAt: db.updated_at
        }
    }

    private static convertAppSleepToDb(app: SleepData): Omit<DatabaseSleepData, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            date: app.date,
            sessions: JSON.stringify(app.sessions),
            quality_rating: app.qualityRating,
            total_minutes: app.totalMinutes,
            total_wake_ups: app.totalWakeUps
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
            console.log('Added operation to user data sync queue:', operation.action, operation.table)
        } catch (error) {
            console.error('Error adding to user data sync queue:', error)
        }
    }

    private static async processSyncQueue(): Promise<void> {
        if (typeof window === 'undefined' || !this.supabase || !this.currentUser) return

        try {
            const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]')
            if (queue.length === 0) return

            console.log(`Processing ${queue.length} queued user data sync operations`)

            const failedOperations: SyncOperation[] = []

            for (const operation of queue) {
                try {
                    await this.processSyncOperation(operation)
                    console.log('Successfully processed user data sync operation:', operation.action, operation.table)
                } catch (error) {
                    console.error('Error processing user data sync operation:', error)

                    // Increment retry count
                    operation.retryCount = (operation.retryCount || 0) + 1

                    // Add back to failed operations if under max retries
                    if (operation.retryCount < operation.maxRetries) {
                        failedOperations.push(operation)
                        console.log(`Retry ${operation.retryCount}/${operation.maxRetries} for user data operation:`, operation.action)
                    } else {
                        console.warn('Max retries exceeded for user data operation:', operation.action, operation.table)
                    }
                }
            }

            // Update queue with only failed operations that can be retried
            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(failedOperations))

            if (failedOperations.length > 0) {
                console.log(`${failedOperations.length} user data operations remain in sync queue for retry`)
            }
        } catch (error) {
            console.error('Error processing user data sync queue:', error)
        }
    }

    private static async processSyncOperation(operation: SyncOperation): Promise<void> {
        if (!this.supabase || !this.currentUser) {
            throw new Error('Supabase client or user not available')
        }

        switch (operation.table) {
            case 'user_profiles':
                await this.processSyncProfile(operation)
                break
            case 'user_goals':
                await this.processSyncGoals(operation)
                break
            case 'sleep_data':
                await this.processSyncSleep(operation)
                break
            default:
                throw new Error(`Unknown sync table: ${operation.table}`)
        }
    }

    private static async processSyncProfile(operation: SyncOperation): Promise<void> {
        switch (operation.action) {
            case 'upsert':
                if (typeof operation.data === 'object' && operation.data !== null && 'userId' in operation.data) {
                    const dbProfile = this.convertAppProfileToDb(operation.data as UserProfile)

                    // Check if profile exists for this user and update/insert accordingly
                    const { data: existingProfile } = await this.supabase!
                        .from('user_profiles')
                        .select('id')
                        .eq('user_id', this.currentUser!.id)
                        .not('user_id', 'is', null)
                        .single()

                    if (existingProfile) {
                        // Update existing profile
                        const { error: updateError } = await this.supabase!
                            .from('user_profiles')
                            .update({
                                ...dbProfile,
                            })
                            .eq('user_id', this.currentUser!.id)
                            .not('user_id', 'is', null)
                        if (updateError) throw updateError
                    } else {
                        // Insert new profile
                        const { error: insertError } = await this.supabase!
                            .from('user_profiles')
                            .insert({
                                ...dbProfile,
                                user_id: this.currentUser!.id
                            })
                        if (insertError) throw insertError
                    }
                }
                break

            default:
                throw new Error(`Unknown sync action for user_profiles: ${operation.action}`)
        }
    }

    private static async processSyncGoals(operation: SyncOperation): Promise<void> {
        switch (operation.action) {
            case 'upsert':
                if (typeof operation.data === 'object' && operation.data !== null && 'userId' in operation.data) {
                    const dbGoals = this.convertAppGoalsToDb(operation.data as UserGoals)

                    // Check if goals exist for this user and update/insert accordingly
                    const { data: existingGoals } = await this.supabase!
                        .from('user_goals')
                        .select('id')
                        .eq('user_id', this.currentUser!.id)
                        .not('user_id', 'is', null)
                        .single()

                    if (existingGoals) {
                        // Update existing goals
                        const { error: updateError } = await this.supabase!
                            .from('user_goals')
                            .update({
                                ...dbGoals,
                            })
                            .eq('user_id', this.currentUser!.id)
                            .not('user_id', 'is', null)
                        if (updateError) throw updateError
                    } else {
                        // Insert new goals
                        const { error: insertError } = await this.supabase!
                            .from('user_goals')
                            .insert({
                                ...dbGoals,
                                user_id: this.currentUser!.id
                            })
                        if (insertError) throw insertError
                    }
                }
                break

            default:
                throw new Error(`Unknown sync action for user_goals: ${operation.action}`)
        }
    }

    private static async processSyncSleep(operation: SyncOperation): Promise<void> {
        switch (operation.action) {
            case 'upsert':
                if (typeof operation.data === 'object' && operation.data !== null && 'userId' in operation.data) {
                    const sleepData = operation.data as SleepData
                    const dbSleepData = this.convertAppSleepToDb(sleepData)

                    // Check if sleep data exists for this user and date
                    const { data: existingSleepData } = await this.supabase!
                        .from('sleep_data')
                        .select('id')
                        .eq('user_id', this.currentUser!.id)
                        .eq('date', sleepData.date)
                        .not('user_id', 'is', null)
                        .single()

                    if (existingSleepData) {
                        // Update existing sleep data
                        const { error: updateError } = await this.supabase!
                            .from('sleep_data')
                            .update({
                                ...dbSleepData,
                            })
                            .eq('user_id', this.currentUser!.id)
                            .eq('date', sleepData.date)
                            .not('user_id', 'is', null)
                        if (updateError) throw updateError
                    } else {
                        // Insert new sleep data
                        const { error: insertError } = await this.supabase!
                            .from('sleep_data')
                            .insert({
                                ...dbSleepData,
                                user_id: this.currentUser!.id
                            })
                        if (insertError) throw insertError
                    }
                }
                break

            default:
                throw new Error(`Unknown sync action for sleep_data: ${operation.action}`)
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
                console.warn(`User data operation attempt ${attempt}/${maxRetries} failed:`, error)

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay * attempt))
                }
            }
        }

        throw lastError
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
            .channel(`user-data-${this.currentUser.id}`)
            .on(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                'postgres_changes' as any,
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_profiles',
                    filter: `user_id=eq.${this.currentUser.id}`
                },
                this.handleProfileChange.bind(this)
            )
            .on(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                'postgres_changes' as any,
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_goals',
                    filter: `user_id=eq.${this.currentUser.id}`
                },
                this.handleGoalsChange.bind(this)
            )
            .subscribe((status) => {
                console.log('User data realtime subscription status:', status)
            })
    }

    private static async handleProfileChange(payload: { eventType: string; new?: DatabaseUserProfile; old?: DatabaseUserProfile }): Promise<void> {
        console.log('User profile changed:', payload)

        let profile: UserProfile | null = null

        if (payload.eventType === 'DELETE') {
            profile = null
        } else if (payload.new) {
            profile = this.convertDbProfileToApp(payload.new)
        }

        // Update localStorage to stay in sync
        if (profile) {
            this.saveUserProfileToLocalStorage(profile)
        } else {
            localStorage.removeItem(this.PROFILE_KEY)
        }

        // Notify all listeners
        this.profileListeners.forEach(listener => {
            try {
                listener(profile)
            } catch (error) {
                console.error('Error in profile listener:', error)
            }
        })
    }

    private static async handleGoalsChange(payload: { eventType: string; new?: DatabaseUserGoals; old?: DatabaseUserGoals }): Promise<void> {
        console.log('User goals changed:', payload)

        let goals: UserGoals | null = null

        if (payload.eventType === 'DELETE') {
            goals = null
        } else if (payload.new) {
            goals = this.convertDbGoalsToApp(payload.new)
        }

        // Update localStorage to stay in sync
        if (goals) {
            this.saveUserGoalsToLocalStorage(goals)
        } else {
            localStorage.removeItem(this.GOALS_KEY)
        }

        // Notify all listeners
        this.goalsListeners.forEach(listener => {
            try {
                listener(goals)
            } catch (error) {
                console.error('Error in goals listener:', error)
            }
        })
    }

    // Public methods for components to subscribe to changes
    static subscribeToProfile(callback: (profile: UserProfile | null) => void): () => void {
        this.profileListeners.push(callback)

        // Return unsubscribe function
        return () => {
            const index = this.profileListeners.indexOf(callback)
            if (index > -1) {
                this.profileListeners.splice(index, 1)
            }
        }
    }

    static subscribeToGoals(callback: (goals: UserGoals | null) => void): () => void {
        this.goalsListeners.push(callback)

        // Return unsubscribe function
        return () => {
            const index = this.goalsListeners.indexOf(callback)
            if (index > -1) {
                this.goalsListeners.splice(index, 1)
            }
        }
    }

    static cleanup(): void {
        if (this.realtimeChannel && this.supabase) {
            this.supabase.removeChannel(this.realtimeChannel)
            this.realtimeChannel = null
        }

        this.profileListeners = []
        this.goalsListeners = []
    }
}
