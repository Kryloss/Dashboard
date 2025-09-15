// Enhanced authentication debugging for set-goal-dialog.tsx
// Replace the save functions with these versions to debug auth issues

const handleSaveProfileDebug = async () => {
    console.log('=== PROFILE SAVE DEBUG START ===')

    if (!user || !supabase) {
        console.log('❌ Missing user or supabase:', { user: !!user, supabase: !!supabase })
        notifications.warning('Sign in required', {
            description: 'Please sign in to save your profile'
        })
        return
    }

    try {
        setIsLoading(true)

        // Debug: Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('📋 Current session:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            sessionError
        })

        if (!session?.user) {
            throw new Error('No active session found. Please sign in again.')
        }

        // Debug: Verify auth context
        console.log('🔐 Auth context:', {
            hookUserId: user.id,
            sessionUserId: session.user.id,
            match: user.id === session.user.id
        })

        const profileData = {
            user_id: user.id,
            weight: profile.weight ? parseFloat(profile.weight) : null,
            age: profile.age ? parseInt(profile.age) : null,
            height: profile.height ? parseFloat(profile.height) : null,
            weight_unit: profile.weightUnit,
            height_unit: profile.heightUnit
        }

        console.log('💾 Attempting to save profile data:', profileData)

        const { data, error } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'user_id' })

        console.log('📤 Upsert result:', { data, error })

        if (error) {
            console.log('❌ Supabase error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            throw error
        }

        console.log('✅ Profile saved successfully')
        notifications.success('Profile saved', {
            description: 'Your profile has been updated successfully'
        })
    } catch (error: unknown) {
        console.error('💥 Profile save error:', error)

        let errorMessage = 'Could not save your profile'
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMsg = (error as Error).message
            console.log('🔍 Error analysis:', errorMsg)

            if (errorMsg.includes('permission denied') || errorMsg.includes('RLS')) {
                errorMessage = 'Permission denied. Database policies may need fixing.'
            } else if (errorMsg.includes('JWT')) {
                errorMessage = 'Authentication expired. Please sign in again.'
            } else if (errorMsg.includes('does not exist')) {
                errorMessage = 'Database table missing. Contact support.'
            } else {
                errorMessage = `Database error: ${errorMsg}`
            }
        }

        notifications.error('Save failed', {
            description: errorMessage
        })
    } finally {
        setIsLoading(false)
        console.log('=== PROFILE SAVE DEBUG END ===')
    }
}

const handleSaveGoalsDebug = async () => {
    console.log('=== GOALS SAVE DEBUG START ===')

    if (!user || !supabase) {
        console.log('❌ Missing user or supabase:', { user: !!user, supabase: !!supabase })
        notifications.warning('Sign in required', {
            description: 'Please sign in to save your goals'
        })
        return
    }

    try {
        setIsLoading(true)

        // Debug: Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('📋 Current session:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            sessionError
        })

        if (!session?.user) {
            throw new Error('No active session found. Please sign in again.')
        }

        const goalsData = {
            user_id: user.id,
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

        console.log('💾 Attempting to save goals data:', goalsData)

        const { data, error } = await supabase
            .from('user_goals')
            .upsert(goalsData, { onConflict: 'user_id' })

        console.log('📤 Upsert result:', { data, error })

        if (error) {
            console.log('❌ Supabase error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            throw error
        }

        console.log('✅ Goals saved successfully')
        notifications.success('Goals saved', {
            description: 'Your goals have been updated successfully'
        })
    } catch (error: unknown) {
        console.error('💥 Goals save error:', error)

        let errorMessage = 'Could not save your goals'
        if (error && typeof error === 'object' && 'message' in error) {
            const errorMsg = (error as Error).message
            console.log('🔍 Error analysis:', errorMsg)

            if (errorMsg.includes('permission denied') || errorMsg.includes('RLS')) {
                errorMessage = 'Permission denied. Database policies may need fixing.'
            } else if (errorMsg.includes('JWT')) {
                errorMessage = 'Authentication expired. Please sign in again.'
            } else if (errorMsg.includes('does not exist')) {
                errorMessage = 'Database table missing. Contact support.'
            } else {
                errorMessage = `Database error: ${errorMsg}`
            }
        }

        notifications.error('Save failed', {
            description: errorMessage
        })
    } finally {
        setIsLoading(false)
        console.log('=== GOALS SAVE DEBUG END ===')
    }
}