// Comprehensive validation schema for workout inputs
// Prevents corrupt data from entering the system

export interface ValidationResult {
    isValid: boolean
    message?: string
    sanitizedValue?: string | number
}

export class WorkoutValidation {
    // Duration validation
    static duration = {
        hours: (value: string): ValidationResult => {
            if (value === '') return { isValid: true, sanitizedValue: 0 }

            const num = parseInt(value, 10)
            if (isNaN(num)) {
                return { isValid: false, message: 'Hours must be a number' }
            }
            if (num < 0) {
                return { isValid: false, message: 'Hours cannot be negative' }
            }
            if (num > 24) {
                return { isValid: false, message: 'Hours cannot exceed 24' }
            }
            return { isValid: true, sanitizedValue: num }
        },

        minutes: (value: string): ValidationResult => {
            if (value === '') return { isValid: true, sanitizedValue: 0 }

            const num = parseInt(value, 10)
            if (isNaN(num)) {
                return { isValid: false, message: 'Minutes must be a number' }
            }
            if (num < 0) {
                return { isValid: false, message: 'Minutes cannot be negative' }
            }
            if (num > 59) {
                return { isValid: false, message: 'Minutes cannot exceed 59' }
            }
            return { isValid: true, sanitizedValue: num }
        },

        totalSeconds: (seconds: number): ValidationResult => {
            if (seconds <= 0) {
                return { isValid: false, message: 'Workout duration must be greater than 0' }
            }
            if (seconds > 24 * 60 * 60) { // 24 hours
                return { isValid: false, message: 'Workout duration cannot exceed 24 hours' }
            }
            return { isValid: true, sanitizedValue: seconds }
        }
    }

    // Exercise validation
    static exercise = {
        name: (value: string): ValidationResult => {
            const trimmed = value.trim()
            if (trimmed.length === 0) {
                return { isValid: false, message: 'Exercise name is required' }
            }
            if (trimmed.length > 100) {
                return { isValid: false, message: 'Exercise name cannot exceed 100 characters' }
            }
            // Remove any potentially harmful characters
            const sanitized = trimmed.replace(/[<>]/g, '')
            return { isValid: true, sanitizedValue: sanitized }
        },

        weight: (value: string): ValidationResult => {
            if (value === '') return { isValid: true, sanitizedValue: '' }

            // Allow decimal numbers with optional unit
            const weightRegex = /^(\d+(?:\.\d{1,2})?)\s*(lbs?|kg|pounds?|kilograms?)?$/i
            const match = value.trim().match(weightRegex)

            if (!match) {
                return { isValid: false, message: 'Enter weight as number (e.g., 135 or 135.5)' }
            }

            const num = parseFloat(match[1])
            if (num < 0) {
                return { isValid: false, message: 'Weight cannot be negative' }
            }
            if (num > 2000) {
                return { isValid: false, message: 'Weight cannot exceed 2000' }
            }

            // Return just the number part for storage
            return { isValid: true, sanitizedValue: match[1] }
        },

        reps: (value: string): ValidationResult => {
            if (value === '') return { isValid: true, sanitizedValue: '' }

            const num = parseInt(value, 10)
            if (isNaN(num)) {
                return { isValid: false, message: 'Reps must be a whole number' }
            }
            if (num < 0) {
                return { isValid: false, message: 'Reps cannot be negative' }
            }
            if (num > 999) {
                return { isValid: false, message: 'Reps cannot exceed 999' }
            }
            return { isValid: true, sanitizedValue: num.toString() }
        },

        notes: (value: string): ValidationResult => {
            const trimmed = value.trim()
            if (trimmed.length > 500) {
                return { isValid: false, message: 'Notes cannot exceed 500 characters' }
            }
            // Remove potentially harmful characters
            const sanitized = trimmed.replace(/[<>]/g, '')
            return { isValid: true, sanitizedValue: sanitized }
        }
    }

    // Workout validation
    static workout = {
        name: (value: string): ValidationResult => {
            const trimmed = value.trim()
            if (trimmed.length > 200) {
                return { isValid: false, message: 'Workout name cannot exceed 200 characters' }
            }
            // Remove potentially harmful characters
            const sanitized = trimmed.replace(/[<>]/g, '')
            return { isValid: true, sanitizedValue: sanitized }
        },

        date: (value: string): ValidationResult => {
            const date = new Date(value)
            if (isNaN(date.getTime())) {
                return { isValid: false, message: 'Invalid date format' }
            }

            const now = new Date()
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

            if (date < oneYearAgo) {
                return { isValid: false, message: 'Date cannot be more than 1 year ago' }
            }
            if (date > tomorrow) {
                return { isValid: false, message: 'Date cannot be in the future' }
            }

            return { isValid: true, sanitizedValue: date.toISOString() }
        }
    }

    // Template validation
    static template = {
        name: (value: string): ValidationResult => {
            const trimmed = value.trim()
            if (trimmed.length === 0) {
                return { isValid: false, message: 'Template name is required' }
            }
            if (trimmed.length > 100) {
                return { isValid: false, message: 'Template name cannot exceed 100 characters' }
            }
            // Remove potentially harmful characters
            const sanitized = trimmed.replace(/[<>]/g, '')
            return { isValid: true, sanitizedValue: sanitized }
        }
    }

    // Utility function to validate multiple fields
    static validateFields(validations: Array<{ field: string; value: string; validator: (value: string) => ValidationResult }>): { isValid: boolean; errors: Record<string, string>; sanitizedValues: Record<string, string | number> } {
        const errors: Record<string, string> = {}
        const sanitizedValues: Record<string, string | number> = {}
        let isValid = true

        for (const { field, value, validator } of validations) {
            const result = validator(value)
            if (!result.isValid) {
                errors[field] = result.message || 'Invalid value'
                isValid = false
            } else if (result.sanitizedValue !== undefined) {
                sanitizedValues[field] = result.sanitizedValue
            }
        }

        return { isValid, errors, sanitizedValues }
    }

    // Input sanitization for immediate feedback
    static sanitizeInput = {
        weight: (value: string): string => {
            // Allow only numbers, decimal point, and common units
            return value.replace(/[^0-9.\s]/g, '').substring(0, 10)
        },

        reps: (value: string): string => {
            // Allow only numbers
            return value.replace(/[^0-9]/g, '').substring(0, 3)
        },

        duration: (value: string): string => {
            // Allow only numbers
            return value.replace(/[^0-9]/g, '').substring(0, 2)
        }
    }
}

// Export convenience functions for common validations
export const validateWeight = WorkoutValidation.exercise.weight
export const validateReps = WorkoutValidation.exercise.reps
export const validateExerciseName = WorkoutValidation.exercise.name
export const validateWorkoutName = WorkoutValidation.workout.name
export const validateDuration = WorkoutValidation.duration.totalSeconds
export const sanitizeWeightInput = WorkoutValidation.sanitizeInput.weight
export const sanitizeRepsInput = WorkoutValidation.sanitizeInput.reps
export const sanitizeDurationInput = WorkoutValidation.sanitizeInput.duration