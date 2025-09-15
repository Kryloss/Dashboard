// Quick fix for authentication issues in set-goal-dialog.tsx
// Replace the handleSaveProfile function with this version

const handleSaveProfile = async () => {
    if (!user || !supabase) {
        notifications.warning('Sign in required', {
            description: 'Please sign in to save your profile'
        })
        return
    }

    try {
        setIsLoading(true)

        // Force refresh the session before saving
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            throw new Error('Authentication session expired. Please sign in again.')
        }

        // Ensure we're using the fresh session
        const authenticatedSupabase = createClient()

        const profileData = {
            user_id: session.user.id, // Use session user ID instead of hook user ID
            weight: profile.weight ? parseFloat(profile.weight) : null,
            age: profile.age ? parseInt(profile.age) : null,
            height: profile.height ? parseFloat(profile.height) : null,
            weight_unit: profile.weightUnit,
            height_unit: profile.heightUnit
        }

        const { error } = await authenticatedSupabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'user_id' })

        if (error) {
            throw error
        }

        notifications.success('Profile saved', {
            description: 'Your profile has been updated successfully'
        })
    } catch (error: unknown) {
        console.error('Error saving profile:', error)

        let errorMessage = 'Could not save your profile'
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMsg = (error as Error).message
            if (errorMsg.includes('permission denied')) {
                errorMessage = 'Session expired. Please refresh the page and try again.'
            } else if (errorMsg.includes('does not exist')) {
                errorMessage = 'Database table missing. Run setup SQL.'
            } else {
                errorMessage = `Error: ${errorMsg}`
            }
        }

        notifications.error('Save failed', {
            description: errorMessage
        })
    } finally {
        setIsLoading(false)
    }
}

// Similar fix for handleSaveGoals
const handleSaveGoals = async () => {
    if (!user || !supabase) {
        notifications.warning('Sign in required', {
            description: 'Please sign in to save your goals'
        })
        return
    }

    try {
        setIsLoading(true)

        // Force refresh the session before saving
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            throw new Error('Authentication session expired. Please sign in again.')
        }

        // Ensure we're using the fresh session
        const authenticatedSupabase = createClient()

        const goalsData = {
            user_id: session.user.id, // Use session user ID instead of hook user ID
            daily_exercise_minutes: goals.dailyExerciseMinutes ? parseInt(goals.dailyExerciseMinutes) : 30,
            weekly_exercise_sessions: goals.weeklyExerciseSessions ? parseInt(goals.weeklyExerciseSessions) : 3,
            daily_calories: goals.dailyCalories ? parseInt(goals.dailyCalories) : 2000,
            activity_level: goals.activityLevel,
            sleep_hours: goals.sleepHours ? parseFloat(goals.sleepHours) : 8.0,
            recovery_minutes: goals.recoveryMinutes ? parseInt(goals.recoveryMinutes) : 60,
            starting_weight: goals.startingWeight ? parseFloat(goals.startingWeight) : null,
            goal_weight: goals.goalWeight ? parseFloat(goals.goalWeight) : null,
            diet_type: goals.dietType
        }

        const { error } = await authenticatedSupabase
            .from('user_goals')
            .upsert(goalsData, { onConflict: 'user_id' })

        if (error) {
            throw error
        }

        notifications.success('Goals saved', {
            description: 'Your goals have been updated successfully'
        })
    } catch (error: unknown) {
        console.error('Error saving goals:', error)

        let errorMessage = 'Could not save your goals'
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMsg = (error as Error).message
            if (errorMsg.includes('permission denied')) {
                errorMessage = 'Session expired. Please refresh the page and try again.'
            } else if (errorMsg.includes('does not exist')) {
                errorMessage = 'Database table missing. Run setup SQL.'
            } else {
                errorMessage = `Error: ${errorMsg}`
            }
        }

        notifications.error('Save failed', {
            description: errorMessage
        })
    } finally {
        setIsLoading(false)
    }
}