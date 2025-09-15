"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import ProgressImageUpload from '@/components/progress-image-upload'
import ProgressGalleryCompact from '@/components/progress-gallery-compact'
import { User, Target, Weight, Moon, Flame, Dumbbell, Camera } from "lucide-react"

interface SetGoalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface UserProfile {
    weight: string
    age: string
    height: string
    weightUnit: string
    heightUnit: string
}

interface Goals {
    dailyExerciseMinutes: string
    weeklyExerciseSessions: string
    dailyCalories: string
    activityLevel: string
    sleepHours: string
    recoveryMinutes: string
    startingWeight: string
    goalWeight: string
    dietType: string
}

export function SetGoalDialog({ open, onOpenChange }: SetGoalDialogProps) {
    const { user, supabase } = useAuth()
    const notifications = useNotifications()
    const [activeTab, setActiveTab] = useState("account")
    const [refreshKey, setRefreshKey] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const [profile, setProfile] = useState<UserProfile>({
        weight: "",
        age: "",
        height: "",
        weightUnit: "kg",
        heightUnit: "cm"
    })

    const [goals, setGoals] = useState<Goals>({
        dailyExerciseMinutes: "30",
        weeklyExerciseSessions: "3",
        dailyCalories: "2000",
        activityLevel: "moderate",
        sleepHours: "8",
        recoveryMinutes: "60",
        startingWeight: "",
        goalWeight: "",
        dietType: "maintenance"
    })

    // Detect if user is on mobile device
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                window.innerWidth <= 768 ||
                ('ontouchstart' in window)
            setIsMobile(isMobileDevice)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const loadUserData = useCallback(async () => {
        if (!user || !supabase) return

        try {
            setIsLoading(true)

            // Load user profile
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error loading profile:', profileError)
            } else if (profileData) {
                setProfile({
                    weight: profileData.weight?.toString() || "",
                    age: profileData.age?.toString() || "",
                    height: profileData.height?.toString() || "",
                    weightUnit: profileData.weight_unit || "kg",
                    heightUnit: profileData.height_unit || "cm"
                })
            }

            // Load user goals
            const { data: goalsData, error: goalsError } = await supabase
                .from('user_goals')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (goalsError && goalsError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error loading goals:', goalsError)
            } else if (goalsData) {
                setGoals({
                    dailyExerciseMinutes: goalsData.daily_exercise_minutes?.toString() || "30",
                    weeklyExerciseSessions: goalsData.weekly_exercise_sessions?.toString() || "3",
                    dailyCalories: goalsData.daily_calories?.toString() || "2000",
                    activityLevel: goalsData.activity_level || "moderate",
                    sleepHours: goalsData.sleep_hours?.toString() || "8",
                    recoveryMinutes: goalsData.recovery_minutes?.toString() || "60",
                    startingWeight: goalsData.starting_weight?.toString() || "",
                    goalWeight: goalsData.goal_weight?.toString() || "",
                    dietType: goalsData.diet_type || "maintenance"
                })
            }
        } catch (error) {
            console.error('Error loading user data:', error)
            notifications.error('Load failed', {
                description: 'Could not load your profile data'
            })
        } finally {
            setIsLoading(false)
        }
    }, [user, supabase, notifications])

    // Load existing profile and goals data when dialog opens
    useEffect(() => {
        if (open && user && supabase) {
            loadUserData()
        }
    }, [open, user, supabase, loadUserData])

    // Handle numeric input with validation - prevents letters including 'e' and limits digits
    const handleNumericInput = (value: string, maxDigits: number, allowDecimal: boolean = false) => {
        // Remove any non-numeric characters (including 'e', '+', '-')
        let cleanValue = value.replace(/[^0-9.]/g, '')

        // Handle decimal places
        if (allowDecimal) {
            const parts = cleanValue.split('.')
            if (parts.length > 2) {
                // Only allow one decimal point
                cleanValue = parts[0] + '.' + parts.slice(1).join('')
            }
            // Limit decimal places to 1
            if (parts[1] && parts[1].length > 1) {
                cleanValue = parts[0] + '.' + parts[1].substring(0, 1)
            }
        } else {
            // Remove decimal points if not allowed
            cleanValue = cleanValue.replace(/\./g, '')
        }

        // Limit total digits (before decimal point)
        const wholePart = cleanValue.split('.')[0]
        if (wholePart.length > maxDigits) {
            const decimalPart = cleanValue.includes('.') ? '.' + cleanValue.split('.')[1] : ''
            cleanValue = wholePart.substring(0, maxDigits) + decimalPart
        }

        return cleanValue
    }

    // Mobile-friendly select component
    const MobileSelect = ({ value, onValueChange, options, className }: {
        value: string
        onValueChange: (value: string) => void
        options: { value: string; label: string }[]
        className?: string
    }) => {
        if (isMobile) {
            return (
                <select
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    className={`${className} bg-[#0E0F13] border-[#212227] text-[#F3F4F6] rounded-md`}
                    style={{ fontSize: '16px' }} // Prevent zoom on iOS
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#0E0F13] text-[#F3F4F6]">
                            {option.label}
                        </option>
                    ))}
                </select>
            )
        }

        return (
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className={className}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121318] border-[#212227] z-[9999] max-h-[200px] overflow-auto">
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31] cursor-pointer">
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    const handleSaveProfile = async () => {
        // Step 1: Comprehensive validation
        if (!user || !supabase) {
            notifications.warning('Authentication Required', {
                description: 'Please sign in to save your profile',
                duration: 5000
            })
            return
        }

        // Step 2: Validate profile data
        const errors = []
        if (profile.weight && (isNaN(parseFloat(profile.weight)) || parseFloat(profile.weight) <= 0)) {
            errors.push('Weight must be a positive number')
        }
        if (profile.age && (isNaN(parseInt(profile.age)) || parseInt(profile.age) <= 0 || parseInt(profile.age) > 150)) {
            errors.push('Age must be between 1 and 150')
        }
        if (profile.height && (isNaN(parseFloat(profile.height)) || parseFloat(profile.height) <= 0)) {
            errors.push('Height must be a positive number')
        }

        if (errors.length > 0) {
            notifications.error('Invalid Data', {
                description: errors.join('\n'),
                duration: 6000
            })
            return
        }

        setIsLoading(true)
        console.log('🔄 Starting profile save operation...')

        try {
            // Step 3: Prepare data with explicit typing
            const profileData = {
                user_id: user.id,
                weight: profile.weight ? parseFloat(profile.weight) : null,
                age: profile.age ? parseInt(profile.age) : null,
                height: profile.height ? parseFloat(profile.height) : null,
                weight_unit: profile.weightUnit || 'kg',
                height_unit: profile.heightUnit || 'cm',
                updated_at: new Date().toISOString()
            }

            console.log('📝 Profile data prepared:', profileData)

            // Step 4: Test database connection first
            console.log('🔍 Testing database connection...')
            const { data: testData, error: testError } = await supabase
                .from('user_profiles')
                .select('id')
                .limit(1)

            if (testError) {
                console.error('❌ Database connection test failed:', testError)
                throw new Error(`Database connection failed: ${testError.message}`)
            }

            console.log('✅ Database connection successful')

            // Step 5: Check if profile exists
            console.log('🔍 Checking if profile exists...')
            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profiles')
                .select('id, user_id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (checkError) {
                console.error('❌ Profile check failed:', checkError)
                throw new Error(`Profile check failed: ${checkError.message}`)
            }

            console.log('📊 Existing profile check:', existingProfile ? 'Found' : 'Not found')

            // Step 6: Perform upsert operation
            console.log('💾 Saving profile data...')
            const { data: savedData, error: saveError } = await supabase
                .from('user_profiles')
                .upsert(profileData, {
                    onConflict: 'user_id',
                    ignoreDuplicates: false
                })
                .select()

            if (saveError) {
                console.error('❌ Profile save failed:', saveError)
                throw saveError
            }

            console.log('✅ Profile saved successfully:', savedData)

            // Step 7: Success notification
            notifications.success('Profile Saved! 🎉', {
                description: 'Your profile has been updated successfully',
                duration: 4000
            })

        } catch (error: unknown) {
            console.error('💥 Profile save error:', error)

            // Comprehensive error analysis
            let errorTitle = 'Profile Save Failed'
            let errorMessage = 'An error occurred while saving your profile'
            let debugInfo = ''
            let actionItems: string[] = []

            if (error && typeof error === 'object' && 'message' in error) {
                const errorMsg = (error as Error).message
                const errorCode = (error as any)?.code
                const errorDetails = (error as any)?.details
                const errorHint = (error as any)?.hint

                console.log('🔍 Error analysis:', {
                    message: errorMsg,
                    code: errorCode,
                    details: errorDetails,
                    hint: errorHint,
                    userID: user?.id,
                    profileData: profileData
                })

                // Analyze specific error types
                if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
                    errorTitle = '🗄️ Database Setup Required'
                    errorMessage = 'The user_profiles table is missing from your database'
                    actionItems.push('Run the database setup SQL file')
                    actionItems.push('Check Supabase project configuration')
                } else if (errorMsg.includes('permission denied') || errorCode === 'PGRST301') {
                    errorTitle = '🔒 Permission Denied'
                    errorMessage = 'You do not have permission to save profile data'
                    actionItems.push('Check if you are properly signed in')
                    actionItems.push('Verify Row Level Security policies')
                    actionItems.push('Contact support if issue persists')
                } else if (errorMsg.includes('JWT') || errorMsg.includes('token')) {
                    errorTitle = '🔑 Session Expired'
                    errorMessage = 'Your authentication session has expired'
                    actionItems.push('Sign out and sign back in')
                    actionItems.push('Clear browser cookies if needed')
                } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                    errorTitle = '🌐 Connection Error'
                    errorMessage = 'Unable to connect to the database'
                    actionItems.push('Check your internet connection')
                    actionItems.push('Try again in a few moments')
                } else if (errorCode === 'PGRST116') {
                    errorTitle = '📄 No Data Found'
                    errorMessage = 'Could not locate your profile record'
                    actionItems.push('This might be your first save - try again')
                } else {
                    errorTitle = '⚠️ Database Error'
                    errorMessage = `Database operation failed: ${errorMsg}`
                    debugInfo = `Code: ${errorCode || 'unknown'}, Details: ${errorDetails || 'none'}`
                }

                if (actionItems.length > 0) {
                    debugInfo = `\n\n🔧 Next steps:\n${actionItems.map(item => `• ${item}`).join('\n')}`
                }
            } else {
                errorMessage = `Unexpected error type: ${typeof error}`
                debugInfo = '\n\n🔧 Please check the browser console for more details'
            }

            notifications.error(errorTitle, {
                description: `${errorMessage}${debugInfo}`,
                duration: 10000
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveGoals = async () => {
        // Step 1: Comprehensive validation
        if (!user || !supabase) {
            notifications.warning('Authentication Required', {
                description: 'Please sign in to save your goals',
                duration: 5000
            })
            return
        }

        // Step 2: Validate goals data
        const errors = []
        const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extra']
        const validDietTypes = ['cutting', 'bulking', 'maintenance']

        if (goals.dailyExerciseMinutes && (isNaN(parseInt(goals.dailyExerciseMinutes)) || parseInt(goals.dailyExerciseMinutes) < 0 || parseInt(goals.dailyExerciseMinutes) > 720)) {
            errors.push('Daily exercise minutes must be between 0 and 720')
        }
        if (goals.weeklyExerciseSessions && (isNaN(parseInt(goals.weeklyExerciseSessions)) || parseInt(goals.weeklyExerciseSessions) < 0 || parseInt(goals.weeklyExerciseSessions) > 14)) {
            errors.push('Weekly exercise sessions must be between 0 and 14')
        }
        if (goals.dailyCalories && (isNaN(parseInt(goals.dailyCalories)) || parseInt(goals.dailyCalories) < 800 || parseInt(goals.dailyCalories) > 5000)) {
            errors.push('Daily calories must be between 800 and 5000')
        }
        if (goals.activityLevel && !validActivityLevels.includes(goals.activityLevel)) {
            errors.push('Activity level must be one of: ' + validActivityLevels.join(', '))
        }
        if (goals.sleepHours && (isNaN(parseFloat(goals.sleepHours)) || parseFloat(goals.sleepHours) < 1 || parseFloat(goals.sleepHours) > 16)) {
            errors.push('Sleep hours must be between 1 and 16')
        }
        if (goals.recoveryMinutes && (isNaN(parseInt(goals.recoveryMinutes)) || parseInt(goals.recoveryMinutes) < 0 || parseInt(goals.recoveryMinutes) > 480)) {
            errors.push('Recovery minutes must be between 0 and 480')
        }
        if (goals.startingWeight && (isNaN(parseFloat(goals.startingWeight)) || parseFloat(goals.startingWeight) <= 0 || parseFloat(goals.startingWeight) > 1000)) {
            errors.push('Starting weight must be between 0 and 1000')
        }
        if (goals.goalWeight && (isNaN(parseFloat(goals.goalWeight)) || parseFloat(goals.goalWeight) <= 0 || parseFloat(goals.goalWeight) > 1000)) {
            errors.push('Goal weight must be between 0 and 1000')
        }
        if (goals.dietType && !validDietTypes.includes(goals.dietType)) {
            errors.push('Diet type must be one of: ' + validDietTypes.join(', '))
        }

        if (errors.length > 0) {
            notifications.error('Invalid Data', {
                description: errors.join('\n'),
                duration: 8000
            })
            return
        }

        setIsLoading(true)
        console.log('🎯 Starting goals save operation...')

        try {
            // Step 3: Prepare data with explicit validation
            const goalsData = {
                user_id: user.id,
                daily_exercise_minutes: goals.dailyExerciseMinutes ? parseInt(goals.dailyExerciseMinutes) : 30,
                weekly_exercise_sessions: goals.weeklyExerciseSessions ? parseInt(goals.weeklyExerciseSessions) : 3,
                daily_calories: goals.dailyCalories ? parseInt(goals.dailyCalories) : 2000,
                activity_level: goals.activityLevel || 'moderate',
                sleep_hours: goals.sleepHours ? parseFloat(goals.sleepHours) : 8.0,
                recovery_minutes: goals.recoveryMinutes ? parseInt(goals.recoveryMinutes) : 60,
                starting_weight: goals.startingWeight ? parseFloat(goals.startingWeight) : null,
                goal_weight: goals.goalWeight ? parseFloat(goals.goalWeight) : null,
                diet_type: goals.dietType || 'maintenance',
                updated_at: new Date().toISOString()
            }

            console.log('📋 Goals data prepared:', goalsData)

            // Step 4: Test database connection first
            console.log('🔍 Testing database connection...')
            const { data: testData, error: testError } = await supabase
                .from('user_goals')
                .select('id')
                .limit(1)

            if (testError) {
                console.error('❌ Database connection test failed:', testError)
                throw new Error(`Database connection failed: ${testError.message}`)
            }

            console.log('✅ Database connection successful')

            // Step 5: Check if goals exist
            console.log('🔍 Checking if goals exist...')
            const { data: existingGoals, error: checkError } = await supabase
                .from('user_goals')
                .select('id, user_id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (checkError) {
                console.error('❌ Goals check failed:', checkError)
                throw new Error(`Goals check failed: ${checkError.message}`)
            }

            console.log('📊 Existing goals check:', existingGoals ? 'Found' : 'Not found')

            // Step 6: Perform upsert operation
            console.log('💾 Saving goals data...')
            const { data: savedData, error: saveError } = await supabase
                .from('user_goals')
                .upsert(goalsData, {
                    onConflict: 'user_id',
                    ignoreDuplicates: false
                })
                .select()

            if (saveError) {
                console.error('❌ Goals save failed:', saveError)
                throw saveError
            }

            console.log('✅ Goals saved successfully:', savedData)

            // Step 7: Success notification
            notifications.success('Goals Saved! 🎯', {
                description: 'Your fitness goals have been updated successfully',
                duration: 4000
            })

        } catch (error: unknown) {
            console.error('💥 Goals save error:', error)

            // Comprehensive error analysis
            let errorTitle = 'Goals Save Failed'
            let errorMessage = 'An error occurred while saving your goals'
            let debugInfo = ''
            let actionItems: string[] = []

            if (error && typeof error === 'object' && 'message' in error) {
                const errorMsg = (error as Error).message
                const errorCode = (error as any)?.code
                const errorDetails = (error as any)?.details
                const errorHint = (error as any)?.hint

                console.log('🔍 Goals error analysis:', {
                    message: errorMsg,
                    code: errorCode,
                    details: errorDetails,
                    hint: errorHint,
                    userID: user?.id,
                    goalsData: goalsData
                })

                // Analyze specific error types
                if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
                    errorTitle = '🗄️ Database Setup Required'
                    errorMessage = 'The user_goals table is missing from your database'
                    actionItems.push('Run the database setup SQL file')
                    actionItems.push('Check Supabase project configuration')
                } else if (errorMsg.includes('permission denied') || errorCode === 'PGRST301') {
                    errorTitle = '🔒 Permission Denied'
                    errorMessage = 'You do not have permission to save goals data'
                    actionItems.push('Check if you are properly signed in')
                    actionItems.push('Verify Row Level Security policies')
                    actionItems.push('Contact support if issue persists')
                } else if (errorMsg.includes('check constraint') || errorMsg.includes('violates check')) {
                    errorTitle = '📏 Invalid Values'
                    errorMessage = 'One or more goal values are outside allowed ranges'
                    actionItems.push('Check that activity level is valid')
                    actionItems.push('Check that diet type is valid')
                    actionItems.push('Verify numeric values are within limits')
                } else if (errorMsg.includes('JWT') || errorMsg.includes('token')) {
                    errorTitle = '🔑 Session Expired'
                    errorMessage = 'Your authentication session has expired'
                    actionItems.push('Sign out and sign back in')
                    actionItems.push('Clear browser cookies if needed')
                } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                    errorTitle = '🌐 Connection Error'
                    errorMessage = 'Unable to connect to the database'
                    actionItems.push('Check your internet connection')
                    actionItems.push('Try again in a few moments')
                } else if (errorCode === 'PGRST116') {
                    errorTitle = '📄 No Data Found'
                    errorMessage = 'Could not locate your goals record'
                    actionItems.push('This might be your first save - try again')
                } else {
                    errorTitle = '⚠️ Database Error'
                    errorMessage = `Database operation failed: ${errorMsg}`
                    debugInfo = `Code: ${errorCode || 'unknown'}, Details: ${errorDetails || 'none'}`
                }

                if (actionItems.length > 0) {
                    debugInfo = `\n\n🔧 Next steps:\n${actionItems.map(item => `• ${item}`).join('\n')}`
                }
            } else {
                errorMessage = `Unexpected error type: ${typeof error}`
                debugInfo = '\n\n🔧 Please check the browser console for more details'
            }

            notifications.error(errorTitle, {
                description: `${errorMessage}${debugInfo}`,
                duration: 10000
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDataChange = () => {
        // Force refresh of the gallery when new images are uploaded or changed
        setRefreshKey(prev => prev + 1)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0 z-[9998]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl font-semibold text-[#F3F4F6]">
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col">
                        {/* Compact Tab Navigation */}
                        <div className="flex mx-6 mb-4 bg-[#0E0F13] border border-[#212227] rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`
                                    flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-all rounded-md
                                    ${activeTab === "account"
                                        ? "bg-[#2A8CEA] text-white shadow-sm"
                                        : "text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                    }
                                `}
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("goals")}
                                className={`
                                    flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-all rounded-md
                                    ${activeTab === "goals"
                                        ? "bg-[#2A8CEA] text-white shadow-sm"
                                        : "text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                    }
                                `}
                            >
                                <Target className="w-4 h-4" />
                                <span>Goals</span>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[70vh]">
                            <TabsContent value="account" className="mt-0">
                                <Card className="bg-[#121318] border-[#212227]">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center">
                                                <User className="w-4 h-4 text-[#A1A1AA]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#F3F4F6] font-medium">Profile Information</p>
                                                <p className="text-xs text-[#A1A1AA]">Update your personal details</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Compact Profile Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Weight Section */}
                                            <div className="space-y-2">
                                                <Label htmlFor="weight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Weight</Label>
                                                <div className="flex gap-1">
                                                    <Input
                                                        id="weight"
                                                        type="text"
                                                        value={profile.weight}
                                                        onChange={(e) => setProfile({ ...profile, weight: handleNumericInput(e.target.value, 3, true) })}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center w-24 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="70"
                                                        inputMode="decimal"
                                                    />
                                                    <MobileSelect
                                                        value={profile.weightUnit}
                                                        onValueChange={(value) => setProfile({ ...profile, weightUnit: value })}
                                                        options={[
                                                            { value: "kg", label: "kg" },
                                                            { value: "lbs", label: "lbs" }
                                                        ]}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-xs w-8 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Height Section */}
                                            <div className="space-y-2">
                                                <Label htmlFor="height" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Height</Label>
                                                <div className="flex gap-1">
                                                    <Input
                                                        id="height"
                                                        type="text"
                                                        value={profile.height}
                                                        onChange={(e) => setProfile({ ...profile, height: handleNumericInput(e.target.value, 3, true) })}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center w-24 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="175"
                                                        inputMode="decimal"
                                                    />
                                                    <MobileSelect
                                                        value={profile.heightUnit}
                                                        onValueChange={(value) => setProfile({ ...profile, heightUnit: value })}
                                                        options={[
                                                            { value: "cm", label: "cm" },
                                                            { value: "ft", label: "ft" }
                                                        ]}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-xs w-8 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Age Section */}
                                            <div className="space-y-2">
                                                <Label htmlFor="age" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Age</Label>
                                                <Input
                                                    id="age"
                                                    type="text"
                                                    value={profile.age}
                                                    onChange={(e) => setProfile({ ...profile, age: handleNumericInput(e.target.value, 3, false) })}
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center w-20 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="25"
                                                    inputMode="numeric"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-lg border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-9 text-sm font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isLoading ? 'Saving...' : 'Save Profile'}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Progress Photos Section */}
                                <Card className="bg-[#121318] border-[#212227] mt-6">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center">
                                                    <Camera className="w-4 h-4 text-[#A1A1AA]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-[#F3F4F6] font-medium">Progress Photos</p>
                                                    <p className="text-xs text-[#A1A1AA]">Track your fitness journey visually</p>
                                                </div>
                                            </div>
                                            <ProgressImageUpload onUploadSuccess={handleDataChange} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ProgressGalleryCompact key={refreshKey} onDataChange={handleDataChange} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="goals" className="mt-0">
                                {/* Single Consolidated Goals Card */}
                                <Card className="bg-[#121318] border-[#212227]">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center">
                                                <Target className="w-4 h-4 text-[#A1A1AA]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#F3F4F6] font-medium">Health & Fitness Goals</p>
                                                <p className="text-xs text-[#A1A1AA]">Set your targets for optimal performance</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {/* Exercise Goals Section - Compact Grid */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#FF375F] flex items-center justify-center">
                                                    <Dumbbell className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Exercise</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dailyExercise" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Daily Minutes</Label>
                                                    <Input
                                                        id="dailyExercise"
                                                        type="text"
                                                        value={goals.dailyExerciseMinutes}
                                                        onChange={(e) => setGoals({ ...goals, dailyExerciseMinutes: handleNumericInput(e.target.value, 3, false) })}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#FF2D55] focus:border-[#FF2D55] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="30"
                                                        inputMode="numeric"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="weeklyExercise" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Weekly Sessions</Label>
                                                    <Input
                                                        id="weeklyExercise"
                                                        type="text"
                                                        value={goals.weeklyExerciseSessions}
                                                        onChange={(e) => setGoals({ ...goals, weeklyExerciseSessions: handleNumericInput(e.target.value, 2, false) })}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#FF2D55] focus:border-[#FF2D55] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="3"
                                                        inputMode="numeric"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nutrition Goals Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#9BE15D] to-[#00E676] flex items-center justify-center">
                                                    <Flame className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Nutrition</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dailyCalories" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Daily Calories</Label>
                                                    <Input
                                                        id="dailyCalories"
                                                        type="text"
                                                        value={goals.dailyCalories}
                                                        onChange={(e) => setGoals({ ...goals, dailyCalories: handleNumericInput(e.target.value, 5, false) })}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="2000"
                                                        inputMode="numeric"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="activityLevel" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Activity Level</Label>
                                                    <MobileSelect
                                                        value={goals.activityLevel}
                                                        onValueChange={(value) => setGoals({ ...goals, activityLevel: value })}
                                                        options={[
                                                            { value: "sedentary", label: "Sedentary" },
                                                            { value: "light", label: "Light" },
                                                            { value: "moderate", label: "Moderate" },
                                                            { value: "active", label: "Active" },
                                                            { value: "extra", label: "Extra Active" }
                                                        ]}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-xs focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recovery Goals Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] flex items-center justify-center">
                                                    <Moon className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Recovery</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="sleepHours" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Sleep Hours</Label>
                                                    <Input
                                                        id="sleepHours"
                                                        type="text"
                                                        value={goals.sleepHours}
                                                        onChange={(e) => setGoals({ ...goals, sleepHours: handleNumericInput(e.target.value, 2, true) })}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2BD2FF] focus:border-[#2BD2FF] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="8"
                                                        inputMode="decimal"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="recoveryTime" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Recovery Minutes</Label>
                                                    <Input
                                                        id="recoveryTime"
                                                        type="text"
                                                        value={goals.recoveryMinutes}
                                                        onChange={(e) => setGoals({ ...goals, recoveryMinutes: handleNumericInput(e.target.value, 3, false) })}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2BD2FF] focus:border-[#2BD2FF] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="60"
                                                        inputMode="numeric"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weight Goals Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[#2A2B31] flex items-center justify-center">
                                                    <Weight className="w-3.5 h-3.5 text-[#A1A1AA]" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Weight Goals</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dietType" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Goal Type</Label>
                                                    <MobileSelect
                                                        value={goals.dietType}
                                                        onValueChange={(value) => setGoals({ ...goals, dietType: value })}
                                                        options={[
                                                            { value: "cutting", label: "Lose Weight" },
                                                            { value: "bulking", label: "Gain Weight" },
                                                            { value: "maintenance", label: "Maintain" }
                                                        ]}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-xs focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA]"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="startingWeight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Current Weight</Label>
                                                        <Input
                                                            id="startingWeight"
                                                            type="text"
                                                            value={goals.startingWeight}
                                                            onChange={(e) => setGoals({ ...goals, startingWeight: handleNumericInput(e.target.value, 3, true) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="70"
                                                            inputMode="decimal"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="goalWeight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Target Weight</Label>
                                                        <Input
                                                            id="goalWeight"
                                                            type="text"
                                                            value={goals.goalWeight}
                                                            onChange={(e) => setGoals({ ...goals, goalWeight: handleNumericInput(e.target.value, 3, true) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="75"
                                                            inputMode="decimal"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSaveGoals}
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-lg border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-9 text-sm font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            {isLoading ? 'Saving...' : 'Save Goals'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}