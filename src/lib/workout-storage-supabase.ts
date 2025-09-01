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
  description?: string
  category?: string // e.g., 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'
  targetMuscles?: string[] // e.g., ['pectorals', 'anterior deltoids', 'triceps']
  equipment?: string // e.g., 'barbell', 'dumbbell', 'bodyweight', 'machine'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  restTime?: number // rest time in seconds between sets
  sets: Array<{
    id: string
    reps: string
    weight: string
    notes: string
    completed?: boolean
    restTime?: number // specific rest time for this set
  }>
  instructions?: string[] // step-by-step instructions
  tips?: string[] // form tips and cues
  alternatives?: string[] // alternative exercises
  createdAt?: string
  updatedAt?: string
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
        description: 'Classic chest exercise performed lying on a bench',
        category: 'chest',
        targetMuscles: ['pectorals', 'anterior deltoids', 'triceps'],
        equipment: 'barbell',
        difficulty: 'intermediate',
        restTime: 120,
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: 'Warm-up set', completed: false, restTime: 60 },
          { id: 'set-2', reps: '6-8', weight: '', notes: 'Working set', completed: false, restTime: 120 },
          { id: 'set-3', reps: '6-8', weight: '', notes: 'Working set', completed: false, restTime: 120 },
        ],
        instructions: [
          'Lie flat on a bench with your feet firmly planted on the ground',
          'Grip the barbell with hands slightly wider than shoulder-width',
          'Lower the bar to your chest with control',
          'Press the bar up explosively until arms are fully extended'
        ],
        tips: [
          'Keep your core tight throughout the movement',
          'Don\'t bounce the bar off your chest',
          'Maintain a slight arch in your back'
        ],
        alternatives: ['Dumbbell Bench Press', 'Incline Bench Press', 'Push-ups']
      },
      {
        id: 'shoulder-press',
        name: 'Overhead Press',
        description: 'Shoulder exercise performed standing or seated',
        category: 'shoulders',
        targetMuscles: ['anterior deltoids', 'medial deltoids', 'triceps'],
        equipment: 'barbell',
        difficulty: 'intermediate',
        restTime: 90,
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: '', completed: false, restTime: 90 },
          { id: 'set-2', reps: '8-10', weight: '', notes: '', completed: false, restTime: 90 },
          { id: 'set-3', reps: '8-10', weight: '', notes: '', completed: false, restTime: 90 },
        ],
        instructions: [
          'Stand with feet hip-width apart',
          'Hold the barbell at shoulder level with palms facing forward',
          'Press the bar straight up overhead',
          'Lower with control back to starting position'
        ],
        tips: [
          'Keep your core engaged',
          'Don\'t arch your back excessively',
          'Press straight up, not forward'
        ],
        alternatives: ['Dumbbell Shoulder Press', 'Arnold Press', 'Pike Push-ups']
      },
      {
        id: 'dips',
        name: 'Dips',
        description: 'Bodyweight exercise targeting chest and triceps',
        category: 'chest',
        targetMuscles: ['pectorals', 'triceps', 'anterior deltoids'],
        equipment: 'bodyweight',
        difficulty: 'intermediate',
        restTime: 60,
        sets: [
          { id: 'set-1', reps: '10-12', weight: 'Bodyweight', notes: '', completed: false, restTime: 60 },
          { id: 'set-2', reps: '10-12', weight: 'Bodyweight', notes: '', completed: false, restTime: 60 },
          { id: 'set-3', reps: '8-10', weight: 'Bodyweight', notes: 'To failure', completed: false, restTime: 60 },
        ],
        instructions: [
          'Support yourself on parallel bars with arms fully extended',
          'Lower your body by bending your elbows',
          'Descend until shoulders are below elbows',
          'Press back up to starting position'
        ],
        tips: [
          'Lean slightly forward to target chest more',
          'Keep your core tight',
          'Don\'t go too deep if you feel shoulder discomfort'
        ],
        alternatives: ['Bench Dips', 'Diamond Push-ups', 'Assisted Dips']
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
        description: 'Compound exercise targeting the posterior chain',
        category: 'back',
        targetMuscles: ['erector spinae', 'glutes', 'hamstrings', 'lats', 'traps'],
        equipment: 'barbell',
        difficulty: 'advanced',
        restTime: 180,
        sets: [
          { id: 'set-1', reps: '5', weight: '', notes: 'Heavy set', completed: false, restTime: 180 },
          { id: 'set-2', reps: '5', weight: '', notes: 'Heavy set', completed: false, restTime: 180 },
          { id: 'set-3', reps: '5', weight: '', notes: 'Heavy set', completed: false, restTime: 180 },
        ],
        instructions: [
          'Stand with feet hip-width apart, bar over mid-foot',
          'Bend at hips and knees to grip the bar',
          'Keep chest up and back straight',
          'Drive through heels to lift the bar',
          'Stand up tall, squeezing glutes at the top'
        ],
        tips: [
          'Keep the bar close to your body throughout the lift',
          'Don\'t round your back',
          'Engage your lats before lifting'
        ],
        alternatives: ['Romanian Deadlift', 'Trap Bar Deadlift', 'Sumo Deadlift']
      },
      {
        id: 'pull-ups',
        name: 'Pull-ups',
        description: 'Bodyweight exercise for upper body pulling strength',
        category: 'back',
        targetMuscles: ['lats', 'rhomboids', 'middle traps', 'biceps'],
        equipment: 'bodyweight',
        difficulty: 'intermediate',
        restTime: 90,
        sets: [
          { id: 'set-1', reps: '8-10', weight: 'Bodyweight', notes: '', completed: false, restTime: 90 },
          { id: 'set-2', reps: '8-10', weight: 'Bodyweight', notes: '', completed: false, restTime: 90 },
          { id: 'set-3', reps: '6-8', weight: 'Bodyweight', notes: '', completed: false, restTime: 90 },
        ],
        instructions: [
          'Hang from a pull-up bar with overhand grip',
          'Engage your lats and pull your shoulder blades down',
          'Pull your body up until chin clears the bar',
          'Lower with control to full arm extension'
        ],
        tips: [
          'Don\'t swing or use momentum',
          'Focus on pulling with your back, not just arms',
          'Keep your core tight throughout'
        ],
        alternatives: ['Assisted Pull-ups', 'Lat Pulldowns', 'Inverted Rows']
      },
      {
        id: 'rows',
        name: 'Barbell Rows',
        description: 'Horizontal pulling exercise for back development',
        category: 'back',
        targetMuscles: ['lats', 'rhomboids', 'middle traps', 'rear delts', 'biceps'],
        equipment: 'barbell',
        difficulty: 'intermediate',
        restTime: 90,
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: '', completed: false, restTime: 90 },
          { id: 'set-2', reps: '8-10', weight: '', notes: '', completed: false, restTime: 90 },
          { id: 'set-3', reps: '8-10', weight: '', notes: '', completed: false, restTime: 90 },
        ],
        instructions: [
          'Stand with feet hip-width apart, slight bend in knees',
          'Hinge at hips to lean forward, keeping back straight',
          'Pull the bar to your lower chest/upper abdomen',
          'Squeeze shoulder blades together at the top',
          'Lower with control to full arm extension'
        ],
        tips: [
          'Keep your chest up and core engaged',
          'Pull with your elbows, not your hands',
          'Don\'t use momentum or swing the weight'
        ],
        alternatives: ['Dumbbell Rows', 'Cable Rows', 'T-Bar Rows']
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
        description: 'King of all exercises - compound lower body movement',
        category: 'legs',
        targetMuscles: ['quadriceps', 'glutes', 'hamstrings', 'calves', 'core'],
        equipment: 'barbell',
        difficulty: 'intermediate',
        restTime: 120,
        sets: [
          { id: 'set-1', reps: '8-10', weight: '', notes: 'Warm-up', completed: false, restTime: 60 },
          { id: 'set-2', reps: '6-8', weight: '', notes: 'Working set', completed: false, restTime: 120 },
          { id: 'set-3', reps: '6-8', weight: '', notes: 'Working set', completed: false, restTime: 120 },
          { id: 'set-4', reps: '6-8', weight: '', notes: 'Working set', completed: false, restTime: 120 },
        ],
        instructions: [
          'Stand with feet shoulder-width apart, toes slightly pointed out',
          'Place barbell on upper back, not neck',
          'Keep chest up and core tight',
          'Lower by pushing hips back and bending knees',
          'Descend until thighs are parallel to floor',
          'Drive through heels to return to standing'
        ],
        tips: [
          'Keep your knees tracking over your toes',
          'Don\'t let your knees cave inward',
          'Maintain a neutral spine throughout'
        ],
        alternatives: ['Goblet Squats', 'Front Squats', 'Bulgarian Split Squats']
      },
      {
        id: 'leg-press',
        name: 'Leg Press',
        description: 'Machine-based exercise for quadriceps and glutes',
        category: 'legs',
        targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: 'machine',
        difficulty: 'beginner',
        restTime: 90,
        sets: [
          { id: 'set-1', reps: '12-15', weight: '', notes: '', completed: false, restTime: 90 },
          { id: 'set-2', reps: '12-15', weight: '', notes: '', completed: false, restTime: 90 },
          { id: 'set-3', reps: '12-15', weight: '', notes: '', completed: false, restTime: 90 },
        ],
        instructions: [
          'Sit in the leg press machine with back flat against pad',
          'Place feet shoulder-width apart on the platform',
          'Lower the weight by bending knees to 90 degrees',
          'Press through heels to extend legs',
          'Don\'t lock out knees completely'
        ],
        tips: [
          'Keep your knees in line with your toes',
          'Don\'t let your lower back come off the pad',
          'Control the weight on both the way down and up'
        ],
        alternatives: ['Hack Squats', 'Lunges', 'Step-ups']
      },
      {
        id: 'calf-raises',
        name: 'Calf Raises',
        description: 'Isolation exercise for calf muscles',
        category: 'legs',
        targetMuscles: ['gastrocnemius', 'soleus'],
        equipment: 'bodyweight',
        difficulty: 'beginner',
        restTime: 60,
        sets: [
          { id: 'set-1', reps: '15-20', weight: '', notes: '', completed: false, restTime: 60 },
          { id: 'set-2', reps: '15-20', weight: '', notes: '', completed: false, restTime: 60 },
          { id: 'set-3', reps: '15-20', weight: '', notes: '', completed: false, restTime: 60 },
        ],
        instructions: [
          'Stand on edge of step or platform with heels hanging off',
          'Rise up onto your toes as high as possible',
          'Hold the contraction briefly at the top',
          'Lower slowly until you feel a stretch in your calves',
          'Repeat for desired reps'
        ],
        tips: [
          'Use full range of motion',
          'Control the movement, don\'t bounce',
          'You can add weight by holding dumbbells'
        ],
        alternatives: ['Seated Calf Raises', 'Single-leg Calf Raises', 'Donkey Calf Raises']
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
    // Ensure we have user context
    if (!this.currentUser) {
      console.error('Cannot save template: no user context available')
      throw new Error('No user context available for template saving')
    }

    // Validate template data
    if (!template.name?.trim()) {
      throw new Error('Template name is required')
    }

    if (!template.type) {
      throw new Error('Template type is required')
    }

    if (!template.exercises || template.exercises.length === 0) {
      throw new Error('Template must contain at least one exercise')
    }

    // Validate and enhance exercise data
    const enhancedExercises = template.exercises.map(exercise => {
      // Ensure all required fields are present
      const enhancedExercise: WorkoutExercise = {
        id: exercise.id || `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: exercise.name?.trim() || 'Unnamed Exercise',
        description: exercise.description || '',
        category: exercise.category || 'general',
        targetMuscles: exercise.targetMuscles || [],
        equipment: exercise.equipment || 'bodyweight',
        difficulty: exercise.difficulty || 'beginner',
        restTime: exercise.restTime || 60, // default 60 seconds
        sets: exercise.sets?.map(set => ({
          id: set.id || `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          reps: set.reps || '',
          weight: set.weight || '',
          notes: set.notes || '',
          completed: set.completed || false,
          restTime: set.restTime || exercise.restTime || 60
        })) || [],
        instructions: exercise.instructions || [],
        tips: exercise.tips || [],
        alternatives: exercise.alternatives || [],
        createdAt: exercise.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Ensure at least one set exists
      if (enhancedExercise.sets.length === 0) {
        enhancedExercise.sets = [{
          id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          reps: '',
          weight: '',
          notes: '',
          completed: false,
          restTime: enhancedExercise.restTime
        }]
      }

      return enhancedExercise
    })

    const tempId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: tempId,
      name: template.name.trim(),
      exercises: enhancedExercises,
      createdAt: new Date().toISOString(),
      userId: this.currentUser.id
    }

    console.log('Saving enhanced template to database:', {
      tempId,
      name: newTemplate.name,
      type: newTemplate.type,
      exerciseCount: newTemplate.exercises.length,
      userId: this.currentUser.id,
      exercises: newTemplate.exercises.map(e => ({
        id: e.id,
        name: e.name,
        setCount: e.sets.length,
        category: e.category,
        equipment: e.equipment,
        difficulty: e.difficulty,
        hasDescription: !!e.description,
        hasInstructions: (e.instructions?.length || 0) > 0,
        hasTips: (e.tips?.length || 0) > 0
      }))
    })

    // Optimistic update - update UI immediately
    const existing = this.getCustomTemplatesLocal()
    const updated = [...existing, newTemplate]
    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-templates', JSON.stringify(updated))
    }

    // Sync to Supabase
    if (this.supabase && this.isOnline) {
      try {
        const { data, error } = await this.supabase
          .from('workout_templates')
          .insert({
            user_id: this.currentUser.id,
            name: newTemplate.name,
            type: newTemplate.type,
            exercises: newTemplate.exercises, // This now contains all enhanced exercise data
            is_built_in: newTemplate.isBuiltIn || false
          })
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error)
          throw error
        }

        console.log('Enhanced template saved to Supabase successfully:', {
          id: data.id,
          name: data.name,
          exerciseCount: data.exercises.length,
          userId: data.user_id,
          exerciseDetails: data.exercises.map((e: WorkoutExercise) => ({
            name: e.name,
            category: e.category,
            equipment: e.equipment,
            setCount: e.sets?.length || 0
          }))
        })

        // Update with Supabase ID and timestamp
        newTemplate.id = data.id
        newTemplate.createdAt = data.created_at

        // Update localStorage with correct ID using the stored tempId
        const updatedWithId = updated.map(t =>
          t.id === tempId ? newTemplate : t
        )
        localStorage.setItem('workout-templates', JSON.stringify(updatedWithId))

        // Clear any cached templates to force refresh
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase-cache-templates-strength')
          localStorage.removeItem('supabase-cache-templates-all')
        }

      } catch (error) {
        console.error('Failed to sync enhanced template to Supabase:', error)
        this.addToSyncQueue('create', 'templates', newTemplate)
      }
    } else if (!this.isOnline) {
      console.log('Offline mode: enhanced template queued for sync when online')
      this.addToSyncQueue('create', 'templates', newTemplate)
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