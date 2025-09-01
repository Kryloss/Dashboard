import { createClient } from '@/lib/supabase/client'
import type { User, SupabaseClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Database row types (matching the actual database schema)
interface OngoingWorkoutRow {
  id: string
  user_id: string
  type: string
  template_id: string | null
  template_name: string | null
  exercises: WorkoutExercise[]
  start_time: string
  elapsed_time: number
  is_running: boolean
  created_at: string
  updated_at: string
}

interface WorkoutTemplateRow {
  id: string
  user_id: string
  name: string
  type: string
  exercises: WorkoutExercise[]
  is_built_in: boolean
  created_at: string
  updated_at: string
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: Array<{
    id: string
    reps: string
    weight: string
    notes: string
  }>
}

export interface WorkoutTemplate {
  id: string
  name: string
  type: 'strength' | 'running' | 'yoga' | 'cycling'
  exercises: WorkoutExercise[]
  createdAt: string
  isBuiltIn?: boolean
  userId?: string
}

export interface OngoingWorkout {
  id: string
  type: 'strength' | 'running' | 'yoga' | 'cycling'
  templateId?: string
  templateName?: string
  exercises: WorkoutExercise[]
  startTime: string
  elapsedTime: number
  isRunning: boolean
  userId?: string
}

export interface SyncQueue {
  id: string
  action: 'create' | 'update' | 'delete'
  table: 'templates' | 'ongoing_workouts'
  data: WorkoutTemplate | OngoingWorkout
  timestamp: number
  retries: number
}

// Built-in templates fallback
const builtInTemplates: WorkoutTemplate[] = [
  {
    id: 'strength-push',
    name: 'Push Day',
    type: 'strength',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: 'bench-press',
        name: 'Bench Press',
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: 'Warm-up set' },
          { id: 'set-2', reps: '6-8', weight: '', notes: 'Working set' },
          { id: 'set-3', reps: '6-8', weight: '', notes: 'Working set' },
        ]
      },
      {
        id: 'shoulder-press',
        name: 'Overhead Press',
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: '' },
          { id: 'set-2', reps: '8-10', weight: '', notes: '' },
          { id: 'set-3', reps: '8-10', weight: '', notes: '' },
        ]
      },
      {
        id: 'dips',
        name: 'Dips',
        sets: [
          { id: 'set-1', reps: '10-12', weight: 'Bodyweight', notes: '' },
          { id: 'set-2', reps: '10-12', weight: 'Bodyweight', notes: '' },
          { id: 'set-3', reps: '8-10', weight: 'Bodyweight', notes: 'To failure' },
        ]
      }
    ]
  },
  {
    id: 'strength-pull',
    name: 'Pull Day',
    type: 'strength',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: 'deadlift',
        name: 'Deadlift',
        sets: [
          { id: 'set-1', reps: '5', weight: '', notes: 'Heavy set' },
          { id: 'set-2', reps: '5', weight: '', notes: 'Heavy set' },
          { id: 'set-3', reps: '5', weight: '', notes: 'Heavy set' },
        ]
      },
      {
        id: 'pull-ups',
        name: 'Pull-ups',
        sets: [
          { id: 'set-1', reps: '8-10', weight: 'Bodyweight', notes: '' },
          { id: 'set-2', reps: '8-10', weight: 'Bodyweight', notes: '' },
          { id: 'set-3', reps: '6-8', weight: 'Bodyweight', notes: '' },
        ]
      },
      {
        id: 'rows',
        name: 'Barbell Rows',
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: '' },
          { id: 'set-2', reps: '8-10', weight: '', notes: '' },
          { id: 'set-3', reps: '8-10', weight: '', notes: '' },
        ]
      }
    ]
  },
  {
    id: 'strength-legs',
    name: 'Leg Day',
    type: 'strength',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: 'squats',
        name: 'Squats',
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: 'Warm-up' },
          { id: 'set-2', reps: '6-8', weight: '', notes: 'Working set' },
          { id: 'set-3', reps: '6-8', weight: '', notes: 'Working set' },
          { id: 'set-4', reps: '6-8', weight: '', notes: 'Working set' },
        ]
      },
      {
        id: 'leg-press',
        name: 'Leg Press',
        sets: [
          { id: 'set-1', reps: '12-15', weight: '', notes: '' },
          { id: 'set-2', reps: '12-15', weight: '', notes: '' },
          { id: 'set-3', reps: '12-15', weight: '', notes: '' },
        ]
      },
      {
        id: 'calf-raises',
        name: 'Calf Raises',
        sets: [
          { id: 'set-1', reps: '15-20', weight: '', notes: '' },
          { id: 'set-2', reps: '15-20', weight: '', notes: '' },
          { id: 'set-3', reps: '15-20', weight: '', notes: '' },
        ]
      }
    ]
  }
]

export class WorkoutStorageSupabase {
  private static supabase: SupabaseClient | null = null
  private static currentUser: User | null = null
  private static isOnline: boolean = true
  private static syncQueue: SyncQueue[] = []
  private static realtimeSubscriptions: RealtimeChannel[] = []
  private static onWorkoutUpdateCallback: ((workout: OngoingWorkout | null) => void) | null = null
  private static onTemplatesUpdateCallback: ((templates: WorkoutTemplate[]) => void) | null = null
  private static lastSaveTime: number = 0
  private static isSaving: boolean = false // New flag to prevent multiple simultaneous saves

  // Initialize with user context
  static initialize(user: User | null, supabaseClient?: SupabaseClient) {
    this.currentUser = user
    if (supabaseClient) {
      this.supabase = supabaseClient
    } else if (typeof window !== 'undefined') {
      this.supabase = createClient()
    }

    // Setup online/offline detection
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processSyncQueue()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }

    // Setup real-time subscriptions if user is authenticated
    if (user && this.supabase && this.isOnline) {
      this.setupRealtimeSubscriptions()
    }

    // Process any pending sync queue
    if (this.isOnline && user) {
      this.processSyncQueue()
    }

    // Auto-migrate localStorage data on first authenticated session
    if (user && this.shouldMigrate()) {
      this.migrateLocalStorageData()
    }
  }

  // Setup real-time subscriptions for multi-device sync
  private static setupRealtimeSubscriptions() {
    if (!this.supabase || !this.currentUser) return

    // Cleanup existing subscriptions
    this.realtimeSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe()
      }
    })
    this.realtimeSubscriptions = []

    // Subscribe to ongoing workouts changes
    const ongoingWorkoutSub = this.supabase
      .channel('ongoing-workouts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ongoing_workouts',
          filter: `user_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          console.log('Ongoing workout real-time update:', payload)
          this.handleOngoingWorkoutRealtimeUpdate(payload as RealtimePostgresChangesPayload<OngoingWorkoutRow>)
        }
      )
      .subscribe()

    // Subscribe to templates changes
    const templatesSub = this.supabase
      .channel('templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_templates',
          filter: `user_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          console.log('Templates real-time update:', payload)
          this.handleTemplatesRealtimeUpdate(payload as RealtimePostgresChangesPayload<WorkoutTemplateRow>)
        }
      )
      .subscribe()

    this.realtimeSubscriptions = [ongoingWorkoutSub, templatesSub]
  }

  // Handle real-time updates for ongoing workouts
  private static async handleOngoingWorkoutRealtimeUpdate(payload: RealtimePostgresChangesPayload<OngoingWorkoutRow>) {
    console.log('Handling realtime update:', payload.eventType, payload)

    if (payload.eventType === 'DELETE') {
      // Workout was deleted/finished on another device
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ongoing-workout')
        localStorage.removeItem('supabase-cache-ongoing-workout')
      }
      if (this.onWorkoutUpdateCallback) {
        this.onWorkoutUpdateCallback(null)
      }
    } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      // Workout was created/updated on another device
      const workout: OngoingWorkout = {
        id: payload.new.id,
        type: payload.new.type as 'strength' | 'running' | 'yoga' | 'cycling',
        templateId: payload.new.template_id || undefined,
        templateName: payload.new.template_name || undefined,
        exercises: payload.new.exercises,
        startTime: payload.new.start_time,
        elapsedTime: payload.new.elapsed_time,
        isRunning: payload.new.is_running,
        userId: payload.new.user_id
      }

      // Update localStorage cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('ongoing-workout', JSON.stringify(workout))
        localStorage.setItem('supabase-cache-ongoing-workout', JSON.stringify(workout))
      }

      // Check if this is our own update by comparing with localStorage
      if (typeof window !== 'undefined') {
        const localWorkout = localStorage.getItem('ongoing-workout')
        if (localWorkout) {
          const local = JSON.parse(localWorkout)
          // If the real-time update matches our local state, skip callback to prevent loops
          const isOwnUpdate = local.id === workout.id &&
            Math.abs(local.elapsedTime - workout.elapsedTime) < 10 &&
            local.isRunning === workout.isRunning

          if (isOwnUpdate) {
            console.log('Skipping real-time callback - appears to be own update:', workout.id)
            return
          }
        }
      }

      // Process real-time update immediately without delays to prevent race conditions
      if (this.onWorkoutUpdateCallback) {
        console.log(`Real-time update triggering callback immediately with workout: ${workout.id}`)
        this.onWorkoutUpdateCallback(workout)
      }
    }
  }

  // Handle real-time updates for templates
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async handleTemplatesRealtimeUpdate(_payload: RealtimePostgresChangesPayload<WorkoutTemplateRow>) {
    try {
      // Refresh templates from Supabase
      const templates = await this.getTemplates()

      // Update localStorage cache
      if (typeof window !== 'undefined') {
        const customTemplates = templates.filter(t => !t.isBuiltIn)
        localStorage.setItem('workout-templates', JSON.stringify(customTemplates))
      }

      // Notify callback
      if (this.onTemplatesUpdateCallback) {
        this.onTemplatesUpdateCallback(templates)
      }
    } catch (error) {
      console.error('Failed to handle templates real-time update:', error)
    }
  }

  // Register callbacks for real-time updates
  static onOngoingWorkoutUpdate(callback: (workout: OngoingWorkout | null) => void) {
    this.onWorkoutUpdateCallback = callback
  }

  static onTemplatesUpdate(callback: (templates: WorkoutTemplate[]) => void) {
    this.onTemplatesUpdateCallback = callback
  }

  // Cleanup subscriptions
  static cleanup() {
    this.realtimeSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe()
      }
    })
    this.realtimeSubscriptions = []
    this.onWorkoutUpdateCallback = null
    this.onTemplatesUpdateCallback = null
  }

  // Check if migration is needed
  private static shouldMigrate(): boolean {
    if (typeof window === 'undefined') return false
    const migrated = localStorage.getItem('workout-data-migrated')
    const hasTemplates = localStorage.getItem('workout-templates') !== null
    const hasOngoing = localStorage.getItem('ongoing-workout') !== null
    return !migrated && (hasTemplates || hasOngoing)
  }

  // Migrate existing localStorage data to Supabase
  private static async migrateLocalStorageData(): Promise<void> {
    if (!this.supabase || !this.currentUser) return

    try {
      const templatesData = localStorage.getItem('workout-templates')
      const ongoingData = localStorage.getItem('ongoing-workout')

      const templates = templatesData ? JSON.parse(templatesData) : []
      const ongoing = ongoingData ? JSON.parse(ongoingData) : null

      const { data, error } = await this.supabase.rpc('migrate_user_workout_data', {
        templates_data: templates,
        ongoing_data: ongoing
      })

      if (error) throw error

      console.log('Migration completed:', data)
      localStorage.setItem('workout-data-migrated', 'true')

      // Clear old localStorage data after successful migration
      localStorage.removeItem('workout-templates')
      localStorage.removeItem('ongoing-workout')

    } catch (error) {
      console.error('Failed to migrate workout data:', error)
      // Don't mark as migrated if it failed
    }
  }

  // Hybrid storage: Try Supabase first, fallback to localStorage
  private static async withFallback<T>(
    supabaseOperation: () => Promise<T>,
    localStorageOperation: () => T,
    cacheKey?: string
  ): Promise<T> {
    if (!this.currentUser || !this.supabase || !this.isOnline) {
      return localStorageOperation()
    }

    try {
      const result = await supabaseOperation()
      // Cache to localStorage for offline access
      if (cacheKey && typeof window !== 'undefined') {
        localStorage.setItem(`supabase-cache-${cacheKey}`, JSON.stringify(result))
      }
      return result
    } catch (error) {
      console.error('Supabase operation failed, using localStorage:', error)

      // Try cached version first
      if (cacheKey && typeof window !== 'undefined') {
        const cached = localStorage.getItem(`supabase-cache-${cacheKey}`)
        if (cached) {
          return JSON.parse(cached)
        }
      }

      return localStorageOperation()
    }
  }

  // Add operation to sync queue for later retry
  private static addToSyncQueue(action: SyncQueue['action'], table: SyncQueue['table'], data: WorkoutTemplate | OngoingWorkout) {
    if (typeof window === 'undefined') return

    const queueItem: SyncQueue = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      table,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    this.syncQueue.push(queueItem)
    localStorage.setItem('workout-sync-queue', JSON.stringify(this.syncQueue))
  }

  // Process pending sync operations
  private static async processSyncQueue(): Promise<void> {
    if (!this.isOnline || !this.currentUser || !this.supabase) return

    // Load queue from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workout-sync-queue')
      if (saved) {
        this.syncQueue = JSON.parse(saved)
      }
    }

    const failedItems: SyncQueue[] = []

    for (const item of this.syncQueue) {
      try {
        await this.executeSyncOperation(item)
      } catch (error) {
        console.error('Sync operation failed:', error)
        item.retries++
        if (item.retries < 3) {
          failedItems.push(item)
        }
      }
    }

    this.syncQueue = failedItems
    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-sync-queue', JSON.stringify(this.syncQueue))
    }
  }

  // Execute individual sync operation
  private static async executeSyncOperation(item: SyncQueue): Promise<void> {
    if (!this.supabase) return

    switch (item.table) {
      case 'templates':
        if (item.action === 'create' || item.action === 'update') {
          await this.supabase.from('workout_templates').upsert(item.data)
        } else if (item.action === 'delete') {
          await this.supabase.from('workout_templates').delete().eq('id', item.data.id)
        }
        break
      case 'ongoing_workouts':
        if (item.action === 'create' || item.action === 'update') {
          await this.supabase.from('ongoing_workouts').upsert(item.data)
        } else if (item.action === 'delete') {
          await this.supabase.from('ongoing_workouts').delete().eq('id', item.data.id)
        }
        break
    }
  }

  // Template management with Supabase sync
  static async getTemplates(type?: 'strength' | 'running' | 'yoga' | 'cycling'): Promise<WorkoutTemplate[]> {
    const supabaseOperation = async () => {
      if (!this.supabase || !this.currentUser) {
        // If no user or supabase, return built-in templates only
        const filtered = type ? builtInTemplates.filter(template => template.type === type) : builtInTemplates
        return filtered.map(template => ({
          ...template,
          isBuiltIn: template.isBuiltIn || false,
          userId: template.userId || undefined
        }))
      }

      let query = this.supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query
      if (error) throw error

      // Get user-created templates from database
      const userTemplates = data?.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        exercises: item.exercises,
        createdAt: item.created_at,
        isBuiltIn: item.is_built_in,
        userId: item.user_id
      })) || []

      console.log('Loaded templates from Supabase:', {
        userTemplates: userTemplates.length,
        builtInTemplates: builtInTemplates.length,
        type: type || 'all'
      })

      // Combine built-in templates with user-created templates
      const allTemplates = [...builtInTemplates, ...userTemplates]
      const filtered = type ? allTemplates.filter(template => template.type === type) : allTemplates

      // Ensure all templates have consistent structure
      return filtered.map(template => ({
        ...template,
        isBuiltIn: template.isBuiltIn || false,
        userId: template.userId || undefined
      }))
    }

    const localStorageOperation = () => {
      const customTemplates = this.getCustomTemplatesLocal()
      const allTemplates = [...builtInTemplates, ...customTemplates]
      const filtered = type ? allTemplates.filter(template => template.type === type) : allTemplates

      console.log('Loaded templates from localStorage:', {
        customTemplates: customTemplates.length,
        builtInTemplates: builtInTemplates.length,
        total: allTemplates.length,
        filtered: filtered.length,
        type: type || 'all'
      })

      // Ensure all templates have consistent structure
      return filtered.map(template => ({
        ...template,
        isBuiltIn: template.isBuiltIn || false,
        userId: template.userId || undefined
      }))
    }

    return await this.withFallback(
      supabaseOperation,
      localStorageOperation,
      `templates-${type || 'all'}`
    )
  }

  static getCustomTemplatesLocal(): WorkoutTemplate[] {
    if (typeof window === 'undefined') return []
    const templates = localStorage.getItem('workout-templates')
    return templates ? JSON.parse(templates) : []
  }

  static async saveTemplate(template: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<WorkoutTemplate> {
    const tempId = `template-${Date.now()}`
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: tempId,
      createdAt: new Date().toISOString(),
      userId: this.currentUser?.id
    }

    // Optimistic update - update UI immediately
    const existing = this.getCustomTemplatesLocal()
    const updated = [...existing, newTemplate]
    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-templates', JSON.stringify(updated))
    }

    // Sync to Supabase
    if (this.currentUser && this.supabase && this.isOnline) {
      try {
        const { data, error } = await this.supabase
          .from('workout_templates')
          .insert({
            user_id: this.currentUser.id,
            name: template.name,
            type: template.type,
            exercises: template.exercises,
            is_built_in: template.isBuiltIn || false
          })
          .select()
          .single()

        if (error) throw error

        // Update with Supabase ID
        newTemplate.id = data.id
        newTemplate.createdAt = data.created_at

        // Update localStorage with correct ID using the stored tempId
        const updatedWithId = updated.map(t =>
          t.id === tempId ? newTemplate : t
        )
        localStorage.setItem('workout-templates', JSON.stringify(updatedWithId))

      } catch (error) {
        console.error('Failed to sync template to Supabase:', error)
        this.addToSyncQueue('create', 'templates', {
          id: tempId,
          name: template.name,
          type: template.type,
          exercises: template.exercises,
          createdAt: new Date().toISOString(),
          isBuiltIn: template.isBuiltIn || false,
          userId: this.currentUser.id
        })
      }
    }

    return newTemplate
  }

  static async deleteTemplate(templateId: string): Promise<void> {
    // Optimistic update
    const existing = this.getCustomTemplatesLocal()
    const updated = existing.filter(t => t.id !== templateId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-templates', JSON.stringify(updated))
    }

    // Sync to Supabase
    if (this.currentUser && this.supabase && this.isOnline) {
      try {
        const { error } = await this.supabase
          .from('workout_templates')
          .delete()
          .eq('id', templateId)
          .eq('user_id', this.currentUser.id)

        if (error) throw error
      } catch (error) {
        console.error('Failed to delete template from Supabase:', error)
        // For delete operations, we need a minimal template object
        const existingTemplate = this.getCustomTemplatesLocal().find(t => t.id === templateId)
        if (existingTemplate) {
          this.addToSyncQueue('delete', 'templates', existingTemplate)
        }
      }
    }
  }

  // Ongoing workout management with Supabase sync
  static async getOngoingWorkout(): Promise<OngoingWorkout | null> {
    const supabaseOperation = async () => {
      if (!this.supabase || !this.currentUser) return null

      const { data, error } = await this.supabase
        .from('ongoing_workouts')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }

      return {
        id: data.id,
        type: data.type,
        templateId: data.template_id,
        templateName: data.template_name,
        exercises: data.exercises,
        startTime: data.start_time,
        elapsedTime: data.elapsed_time,
        isRunning: data.is_running,
        userId: data.user_id
      }
    }

    const localStorageOperation = () => {
      if (typeof window === 'undefined') return null
      const workout = localStorage.getItem('ongoing-workout')
      return workout ? JSON.parse(workout) : null
    }

    return await this.withFallback(
      supabaseOperation,
      localStorageOperation,
      'ongoing-workout'
    )
  }

  static async saveOngoingWorkout(workout: OngoingWorkout): Promise<void> {
    // Prevent multiple simultaneous saves for the same workout
    if (this.isSaving) {
      console.log('Save already in progress, skipping duplicate save request')
      return
    }

    // Ensure we have user context
    if (!this.currentUser) {
      console.error('Cannot save workout: no user context available')
      return
    }

    this.isSaving = true

    try {
      // Ensure workout has proper user ID
      const workoutWithUser = {
        ...workout,
        userId: this.currentUser.id
      }

      // Optimistic update to localStorage first
      if (typeof window !== 'undefined') {
        localStorage.setItem('ongoing-workout', JSON.stringify(workoutWithUser))
        localStorage.setItem('supabase-cache-ongoing-workout', JSON.stringify(workoutWithUser))
      }

      // Sync to Supabase
      if (this.supabase && this.isOnline) {
        try {
          // Track save time for debugging
          this.lastSaveTime = Date.now()

          // Check if workout already exists to preserve start_time
          let startTime = workout.startTime
          try {
            const { data: existingWorkout } = await this.supabase
              .from('ongoing_workouts')
              .select('start_time')
              .eq('user_id', this.currentUser.id)
              .eq('type', workout.type)
              .single()

            if (existingWorkout) {
              startTime = existingWorkout.start_time
            }
          } catch {
            // Workout doesn't exist yet, use provided start time
            console.log('Creating new workout with provided start time')
          }

          // Use proper upsert with conflict resolution
          const { error } = await this.supabase
            .from('ongoing_workouts')
            .upsert({
              id: workout.id,
              user_id: this.currentUser.id,
              type: workout.type,
              template_id: workout.templateId || null,
              template_name: workout.templateName || null,
              exercises: workout.exercises,
              start_time: startTime,
              elapsed_time: workout.elapsedTime,
              is_running: workout.isRunning
            }, {
              onConflict: 'user_id,type'  // Match database constraint: UNIQUE(user_id, type)
            })

          if (error) {
            console.error('Supabase upsert failed:', error)
            throw error
          }

          console.log('Ongoing workout saved successfully:', workout.id, 'for user:', this.currentUser.id)
        } catch (error) {
          console.error('Failed to sync ongoing workout to Supabase:', error)

          // Add to sync queue for retry
          this.addToSyncQueue('update', 'ongoing_workouts', workoutWithUser)
        }
      } else if (!this.isOnline) {
        // If offline, ensure it's queued for sync
        this.addToSyncQueue('update', 'ongoing_workouts', workoutWithUser)
      }
    } finally {
      // Always reset the saving flag
      this.isSaving = false
    }
  }

  static async clearOngoingWorkout(): Promise<void> {
    // Ensure we have user context
    if (!this.currentUser) {
      console.error('Cannot clear workout: no user context available')
      return
    }

    // Optimistic update
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ongoing-workout')
      localStorage.removeItem('supabase-cache-ongoing-workout')
    }

    // Sync to Supabase
    if (this.supabase && this.isOnline) {
      try {
        const { error } = await this.supabase
          .from('ongoing_workouts')
          .delete()
          .eq('user_id', this.currentUser.id)

        if (error) throw error
        console.log('Successfully cleared ongoing workout for user:', this.currentUser.id)
      } catch (error) {
        console.error('Failed to clear ongoing workout from Supabase:', error)
        // For delete operations, we need a minimal workout object
        const existingWorkout = await this.getOngoingWorkout()
        if (existingWorkout) {
          this.addToSyncQueue('delete', 'ongoing_workouts', existingWorkout)
        }
      }
    }
  }

  static async updateOngoingWorkoutTime(elapsedTime: number, isRunning: boolean): Promise<void> {
    const workout = await this.getOngoingWorkout()
    if (workout) {
      workout.elapsedTime = elapsedTime
      workout.isRunning = isRunning
      await this.saveOngoingWorkout(workout)
    }
  }

  // Get the last used template for quick actions
  static async getLastTemplate(type: 'strength' | 'running' | 'yoga' | 'cycling'): Promise<WorkoutTemplate | null> {
    if (typeof window === 'undefined') return null

    const lastTemplateId = localStorage.getItem(`last-${type}-template`)
    if (lastTemplateId) {
      const templates = await this.getTemplates(type)
      return templates.find(t => t.id === lastTemplateId) || null
    }

    // Return first template of the type
    const templates = await this.getTemplates(type)
    return templates.find(t => t.isBuiltIn) || templates[0] || null
  }

  static setLastTemplate(templateId: string, type: 'strength' | 'running' | 'yoga' | 'cycling'): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`last-${type}-template`, templateId)
    }
  }

  // Create workout from template
  static async createWorkoutFromTemplate(template: WorkoutTemplate, customId?: string): Promise<OngoingWorkout> {
    const workout: OngoingWorkout = {
      id: customId || `workout-${Date.now()}`,
      type: template.type,
      templateId: template.id,
      templateName: template.name,
      exercises: JSON.parse(JSON.stringify(template.exercises)), // Deep clone
      startTime: new Date().toISOString(),
      elapsedTime: 0,
      isRunning: false, // Don't start the workout automatically - user must manually start
      userId: this.currentUser?.id
    }

    await this.saveOngoingWorkout(workout)
    this.setLastTemplate(template.id, template.type)
    return workout
  }
}