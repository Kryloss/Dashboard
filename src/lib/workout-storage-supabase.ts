import { createClient } from '@/lib/supabase/client'
import type { User, SupabaseClient } from '@supabase/supabase-js'

// Database row types (matching the actual database schema) - kept for future use
// interface OngoingWorkoutRow {
//     id: string
//     user_id: string
//     type: string
//     template_id: string | null
//     template_name: string | null
//     exercises: WorkoutExercise[]
//     start_time: string
//     elapsed_time: number
//     is_running: boolean
//     created_at: string
//     updated_at: string
// }

// interface WorkoutTemplateRow {
//     id: string
//     user_id: string
//     name: string
//     type: string
//     exercises: WorkoutExercise[]
//     is_built_in: boolean
//     created_at: string
//     updated_at: string
// }

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

    // Initialize with user context - NO localStorage functionality
    static initialize(user: User | null, supabaseClient?: SupabaseClient) {
        this.currentUser = user
        if (supabaseClient) {
            this.supabase = supabaseClient
        } else if (typeof window !== 'undefined') {
            this.supabase = createClient()
        }
    }

    // Template management with Supabase sync - NO localStorage functionality
    static async getTemplates(type?: 'strength' | 'running' | 'yoga' | 'cycling'): Promise<WorkoutTemplate[]> {
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

        const tempId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newTemplate: WorkoutTemplate = {
            ...template,
            id: tempId,
            name: template.name.trim(),
            exercises: template.exercises,
            createdAt: new Date().toISOString(),
            userId: this.currentUser.id
        }

        // Sync to Supabase
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('workout_templates')
                    .insert({
                        user_id: this.currentUser.id,
                        name: newTemplate.name,
                        type: newTemplate.type,
                        exercises: newTemplate.exercises,
                        is_built_in: newTemplate.isBuiltIn || false
                    })
                    .select()
                    .single()

                if (error) {
                    console.error('Supabase insert error:', error)
                    throw error
                }

                // Update with Supabase ID and timestamp
                newTemplate.id = data.id
                newTemplate.createdAt = data.created_at

            } catch (error) {
                console.error('Failed to sync template to Supabase:', error)
                throw error
            }
        }

        return newTemplate
    }

    static async deleteTemplate(templateId: string): Promise<void> {
        if (this.currentUser && this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('workout_templates')
                    .delete()
                    .eq('id', templateId)
                    .eq('user_id', this.currentUser.id)

                if (error) throw error
            } catch (error) {
                console.error('Failed to delete template from Supabase:', error)
                throw error
            }
        }
    }

    // Ongoing workout management with Supabase sync - NO localStorage functionality
    static async getOngoingWorkout(): Promise<OngoingWorkout | null> {
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

    static async saveOngoingWorkout(workout: OngoingWorkout): Promise<void> {
        // Ensure we have user context
        if (!this.currentUser) {
            console.error('Cannot save workout: no user context available')
            return
        }

        // Sync to Supabase
        if (this.supabase) {
            try {
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
                throw error
            }
        }
    }

    static async clearOngoingWorkout(): Promise<void> {
        // Ensure we have user context
        if (!this.currentUser) {
            console.error('Cannot clear workout: no user context available')
            return
        }

        // Sync to Supabase
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('ongoing_workouts')
                    .delete()
                    .eq('user_id', this.currentUser.id)

                if (error) throw error
                console.log('Successfully cleared ongoing workout for user:', this.currentUser.id)
            } catch (error) {
                console.error('Failed to clear ongoing workout from Supabase:', error)
                throw error
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

    // Get the last used template for quick actions - NO localStorage functionality
    static async getLastTemplate(type: 'strength' | 'running' | 'yoga' | 'cycling'): Promise<WorkoutTemplate | null> {
        // Return first template of the type
        const templates = await this.getTemplates(type)
        return templates.find(t => t.isBuiltIn) || templates[0] || null
    }

    static setLastTemplate(_templateId: string, _type: 'strength' | 'running' | 'yoga' | 'cycling'): void {
        // No localStorage functionality - do nothing
    }

    // Create workout from template - NO localStorage functionality
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
        return workout
    }
}
