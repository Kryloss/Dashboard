// This file is kept for backward compatibility but the main implementation is in workout-storage-supabase.ts

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

// Built-in templates
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

export class WorkoutStorage {
  // Template management
  static getTemplates(type?: 'strength' | 'running' | 'yoga' | 'cycling'): WorkoutTemplate[] {
    const customTemplates = this.getCustomTemplates()
    const allTemplates = [...builtInTemplates, ...customTemplates]

    if (type) {
      return allTemplates.filter(template => template.type === type)
    }
    return allTemplates
  }

  static getCustomTemplates(): WorkoutTemplate[] {
    if (typeof window === 'undefined') return []
    const templates = localStorage.getItem('workout-templates')
    return templates ? JSON.parse(templates) : []
  }

  static saveTemplate(template: Omit<WorkoutTemplate, 'id' | 'createdAt'>): WorkoutTemplate {
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString()
    }

    const existing = this.getCustomTemplates()
    const updated = [...existing, newTemplate]

    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-templates', JSON.stringify(updated))
    }

    return newTemplate
  }

  static deleteTemplate(templateId: string): void {
    const existing = this.getCustomTemplates()
    const updated = existing.filter(t => t.id !== templateId)

    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-templates', JSON.stringify(updated))
    }
  }

  // Ongoing workout management
  static getOngoingWorkout(): OngoingWorkout | null {
    if (typeof window === 'undefined') return null
    const workout = localStorage.getItem('ongoing-workout')
    return workout ? JSON.parse(workout) : null
  }

  static saveOngoingWorkout(workout: OngoingWorkout): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ongoing-workout', JSON.stringify(workout))
    }
  }

  static clearOngoingWorkout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ongoing-workout')
    }
  }

  static updateOngoingWorkoutTime(elapsedTime: number, isRunning: boolean): void {
    const workout = this.getOngoingWorkout()
    if (workout) {
      workout.elapsedTime = elapsedTime
      workout.isRunning = isRunning
      this.saveOngoingWorkout(workout)
    }
  }

  // Get the last used template for quick actions
  static getLastTemplate(type: 'strength' | 'running' | 'yoga' | 'cycling'): WorkoutTemplate | null {
    if (typeof window === 'undefined') return null
    const lastTemplateId = localStorage.getItem(`last-${type}-template`)
    if (lastTemplateId) {
      const templates = this.getTemplates(type)
      return templates.find(t => t.id === lastTemplateId) || null
    }
    // Return first built-in template if no last template
    const builtInTemplate = builtInTemplates.find(t => t.type === type)
    return builtInTemplate || null
  }

  static setLastTemplate(templateId: string, type: 'strength' | 'running' | 'yoga' | 'cycling'): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`last-${type}-template`, templateId)
    }
  }

  // Create workout from template
  static createWorkoutFromTemplate(template: WorkoutTemplate): OngoingWorkout {
    const workout: OngoingWorkout = {
      id: `workout-${Date.now()}`,
      type: template.type,
      templateId: template.id,
      templateName: template.name,
      exercises: JSON.parse(JSON.stringify(template.exercises)), // Deep clone
      startTime: new Date().toISOString(),
      elapsedTime: 0,
      isRunning: false
    }

    this.saveOngoingWorkout(workout)
    this.setLastTemplate(template.id, template.type)
    return workout
  }
}