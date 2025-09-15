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
        if (!user || !supabase) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to save your profile'
            })
            return
        }

        try {
            setIsLoading(true)

            const profileData = {
                user_id: user.id,
                weight: profile.weight ? parseFloat(profile.weight) : null,
                age: profile.age ? parseInt(profile.age) : null,
                height: profile.height ? parseFloat(profile.height) : null,
                weight_unit: profile.weightUnit,
                height_unit: profile.heightUnit
            }

            const { error } = await supabase
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

            // Enhanced error handling with detailed diagnostics
            let errorTitle = 'Profile Save Failed'
            let errorMessage = 'Could not save your profile'
            let debugInfo = ''

            if (error && typeof error === 'object' && 'message' in error) {
                const errorMsg = (error as Error).message.toLowerCase()
                const fullErrorMsg = (error as Error).message

                // Log detailed error for debugging
                console.log('Full error details:', {
                    message: fullErrorMsg,
                    error: error,
                    user: user?.id,
                    profileData: profile
                })

                if (errorMsg.includes('relation') && errorMsg.includes('user_profiles') && errorMsg.includes('does not exist')) {
                    errorTitle = 'Database Setup Required'
                    errorMessage = 'The user_profiles table does not exist in your database.'
                    debugInfo = 'Solution: Run user-profiles-goals-safe-setup.sql in Supabase SQL Editor'
                } else if (errorMsg.includes('permission denied') || errorMsg.includes('rls') || errorMsg.includes('policy')) {
                    errorTitle = 'Permission Denied'
                    errorMessage = 'Row Level Security is blocking this operation.'
                    debugInfo = 'Solution: Run fix-profile-permissions.sql or check if you\'re properly signed in'
                } else if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
                    errorTitle = 'Data Conflict'
                    errorMessage = 'A profile already exists for this user.'
                    debugInfo = 'This should auto-update. Check database policies.'
                } else if (errorMsg.includes('foreign key') || errorMsg.includes('violates')) {
                    errorTitle = 'Data Validation Error'
                    errorMessage = 'Invalid data format or user reference.'
                    debugInfo = `User ID: ${user?.id || 'undefined'}`
                } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
                    errorTitle = 'Connection Error'
                    errorMessage = 'Unable to connect to database.'
                    debugInfo = 'Check your internet connection and try again'
                } else if (errorMsg.includes('invalid') && errorMsg.includes('jwt')) {
                    errorTitle = 'Authentication Expired'
                    errorMessage = 'Your session has expired.'
                    debugInfo = 'Please sign out and sign back in'
                } else {
                    errorTitle = 'Database Error'
                    errorMessage = `Unexpected database error: ${fullErrorMsg}`
                    debugInfo = `Error type: ${(error as Error & { code?: string })?.code || 'unknown'}`
                }
            } else {
                debugInfo = `Unknown error type: ${typeof error}`
            }

            notifications.error(errorTitle, {
                description: `${errorMessage}${debugInfo ? `\n\n💡 ${debugInfo}` : ''}`,
                duration: 8000 // Longer duration for detailed messages
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveGoals = async () => {
        if (!user || !supabase) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to save your goals'
            })
            return
        }

        try {
            setIsLoading(true)

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

            const { error } = await supabase
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

            // Enhanced error handling with detailed diagnostics
            let errorTitle = 'Goals Save Failed'
            let errorMessage = 'Could not save your goals'
            let debugInfo = ''

            if (error && typeof error === 'object' && 'message' in error) {
                const errorMsg = (error as Error).message.toLowerCase()
                const fullErrorMsg = (error as Error).message

                // Log detailed error for debugging
                console.log('Full goals error details:', {
                    message: fullErrorMsg,
                    error: error,
                    user: user?.id,
                    goalsData: goals
                })

                if (errorMsg.includes('relation') && errorMsg.includes('user_goals') && errorMsg.includes('does not exist')) {
                    errorTitle = 'Database Setup Required'
                    errorMessage = 'The user_goals table does not exist in your database.'
                    debugInfo = 'Solution: Run user-profiles-goals-safe-setup.sql in Supabase SQL Editor'
                } else if (errorMsg.includes('permission denied') || errorMsg.includes('rls') || errorMsg.includes('policy')) {
                    errorTitle = 'Permission Denied'
                    errorMessage = 'Row Level Security is blocking this operation.'
                    debugInfo = 'Solution: Run fix-profile-permissions.sql or check if you\'re properly signed in'
                } else if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
                    errorTitle = 'Data Conflict'
                    errorMessage = 'Goals already exist for this user.'
                    debugInfo = 'This should auto-update. Check database policies.'
                } else if (errorMsg.includes('foreign key') || errorMsg.includes('violates')) {
                    errorTitle = 'Data Validation Error'
                    errorMessage = 'Invalid data format or user reference.'
                    debugInfo = `User ID: ${user?.id || 'undefined'}`
                } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
                    errorTitle = 'Connection Error'
                    errorMessage = 'Unable to connect to database.'
                    debugInfo = 'Check your internet connection and try again'
                } else if (errorMsg.includes('invalid') && errorMsg.includes('jwt')) {
                    errorTitle = 'Authentication Expired'
                    errorMessage = 'Your session has expired.'
                    debugInfo = 'Please sign out and sign back in'
                } else if (errorMsg.includes('check constraint') || errorMsg.includes('violates check')) {
                    errorTitle = 'Invalid Values'
                    errorMessage = 'One or more goal values are outside allowed ranges.'
                    debugInfo = 'Check activity level, diet type, and numeric values'
                } else {
                    errorTitle = 'Database Error'
                    errorMessage = `Unexpected database error: ${fullErrorMsg}`
                    debugInfo = `Error type: ${(error as Error & { code?: string })?.code || 'unknown'}`
                }
            } else {
                debugInfo = `Unknown error type: ${typeof error}`
            }

            notifications.error(errorTitle, {
                description: `${errorMessage}${debugInfo ? `\n\n💡 ${debugInfo}` : ''}`,
                duration: 8000 // Longer duration for detailed messages
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