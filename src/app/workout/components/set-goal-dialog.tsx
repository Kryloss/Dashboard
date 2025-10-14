"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { UserDataStorage } from "@/lib/user-data-storage"
import { NutritionStorage } from "@/lib/nutrition-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import ProgressImageUpload from '@/components/progress-image-upload'
import ProgressGalleryCompact from '@/components/progress-gallery-compact'
import { BMICalculator } from './calculators/bmi-calculator'
import { TDEECalculator } from './calculators/tdee-calculator'
import { MacroCalculator } from './calculators/macro-calculator'
import { GoalTemplates } from './goal-templates'
import { User, Target, Weight, Moon, Flame, Dumbbell, Camera, Calculator } from "lucide-react"

interface SetGoalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface ProfileFormData {
    weight: string
    age: string
    height: string
    weightUnit: string
    heightUnit: string
}

interface GoalsFormData {
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

interface NutritionFormData {
    dailyCalories: string
    carbsGrams: string
    proteinGrams: string
    fatsGrams: string
    fiberGrams: string
    waterMl: string
    sodiumMg: string
    macroPreference: 'balanced' | 'highProtein' | 'lowCarb' | 'custom'
}

export function SetGoalDialog({ open, onOpenChange }: SetGoalDialogProps) {
    const { user, loading, supabase } = useAuth()
    const notifications = useNotifications()
    const [activeTab, setActiveTab] = useState("account")
    const [refreshKey, setRefreshKey] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const [profile, setProfile] = useState<ProfileFormData>({
        weight: "",
        age: "",
        height: "",
        weightUnit: "kg",
        heightUnit: "cm"
    })

    const [goals, setGoals] = useState<GoalsFormData>({
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

    const [nutrition, setNutrition] = useState<NutritionFormData>({
        dailyCalories: "2000",
        carbsGrams: "250",
        proteinGrams: "150",
        fatsGrams: "67",
        fiberGrams: "25",
        waterMl: "2000",
        sodiumMg: "2300",
        macroPreference: "balanced"
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

            // Initialize storage systems
            UserDataStorage.initialize(user, supabase)
            NutritionStorage.initialize(user, supabase)

            // Load user profile
            const profileData = await UserDataStorage.getUserProfile()
            if (profileData) {
                setProfile({
                    weight: profileData.weight?.toString() || "",
                    age: profileData.age?.toString() || "",
                    height: profileData.height?.toString() || "",
                    weightUnit: profileData.weightUnit,
                    heightUnit: profileData.heightUnit
                })
            }

            // Load user goals
            const goalsData = await UserDataStorage.getUserGoals()
            if (goalsData) {
                setGoals({
                    dailyExerciseMinutes: goalsData.dailyExerciseMinutes.toString(),
                    weeklyExerciseSessions: goalsData.weeklyExerciseSessions.toString(),
                    dailyCalories: goalsData.dailyCalories.toString(),
                    activityLevel: goalsData.activityLevel,
                    sleepHours: goalsData.sleepHours.toString(),
                    recoveryMinutes: goalsData.recoveryMinutes.toString(),
                    startingWeight: goalsData.startingWeight?.toString() || "",
                    goalWeight: goalsData.goalWeight?.toString() || "",
                    dietType: goalsData.dietType
                })

                // Also sync calories to nutrition form
                setNutrition(prev => ({
                    ...prev,
                    dailyCalories: goalsData.dailyCalories.toString()
                }))
            }

            // Load nutrition goals
            const nutritionGoals = await NutritionStorage.getNutritionGoals()
            if (nutritionGoals) {
                setNutrition({
                    dailyCalories: nutritionGoals.dailyCalories.toString(),
                    carbsGrams: nutritionGoals.macroTargets.carbs.toString(),
                    proteinGrams: nutritionGoals.macroTargets.protein.toString(),
                    fatsGrams: nutritionGoals.macroTargets.fats.toString(),
                    fiberGrams: nutritionGoals.fiberTarget?.toString() || "25",
                    waterMl: nutritionGoals.waterTarget?.toString() || "2000",
                    sodiumMg: nutritionGoals.sodiumLimit?.toString() || "2300",
                    macroPreference: nutritionGoals.macroPercentages ? 'custom' : 'balanced'
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
        if (!loading && (!user || !supabase)) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to save your profile'
            })
            return
        }

        if (loading) {
            return // Don't proceed if still loading
        }

        try {
            setIsLoading(true)

            // Initialize UserDataStorage if not already done
            UserDataStorage.initialize(user, supabase)

            const profileData = {
                weight: profile.weight ? parseFloat(profile.weight) : undefined,
                age: profile.age ? parseInt(profile.age) : undefined,
                height: profile.height ? parseFloat(profile.height) : undefined,
                weightUnit: profile.weightUnit,
                heightUnit: profile.heightUnit
            }

            await UserDataStorage.saveUserProfile(profileData)

            notifications.success('Profile saved', {
                description: 'Your profile has been updated successfully'
            })
        } catch (error: unknown) {
            console.error('Error saving profile:', error)

            let errorMessage = 'Could not save your profile'
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMsg = (error as Error).message
                if (errorMsg.includes('permission denied') || errorMsg.includes('JWT')) {
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

    const handleSaveGoals = async () => {
        if (!loading && (!user || !supabase)) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to save your goals'
            })
            return
        }

        if (loading) {
            return // Don't proceed if still loading
        }

        try {
            setIsLoading(true)

            // Initialize UserDataStorage and NutritionStorage if not already done
            UserDataStorage.initialize(user, supabase)
            NutritionStorage.initialize(user, supabase)

            const goalsData = {
                dailyExerciseMinutes: goals.dailyExerciseMinutes ? parseInt(goals.dailyExerciseMinutes) : 30,
                weeklyExerciseSessions: goals.weeklyExerciseSessions ? parseInt(goals.weeklyExerciseSessions) : 3,
                dailyCalories: goals.dailyCalories ? parseInt(goals.dailyCalories) : 2000,
                activityLevel: goals.activityLevel,
                sleepHours: goals.sleepHours ? parseFloat(goals.sleepHours) : 8.0,
                recoveryMinutes: goals.recoveryMinutes ? parseInt(goals.recoveryMinutes) : 60,
                startingWeight: goals.startingWeight ? parseFloat(goals.startingWeight) : undefined,
                goalWeight: goals.goalWeight ? parseFloat(goals.goalWeight) : undefined,
                dietType: goals.dietType
            }

            // Save nutrition goals
            const nutritionGoalsData = {
                dailyCalories: parseInt(nutrition.dailyCalories) || 2000,
                macroTargets: {
                    carbs: parseInt(nutrition.carbsGrams) || 250,
                    protein: parseInt(nutrition.proteinGrams) || 150,
                    fats: parseInt(nutrition.fatsGrams) || 67
                },
                fiberTarget: parseInt(nutrition.fiberGrams) || 25,
                waterTarget: parseInt(nutrition.waterMl) || 2000,
                sodiumLimit: parseInt(nutrition.sodiumMg) || 2300,
                macroPercentages: nutrition.macroPreference === 'custom' ? {
                    carbs: Math.round((parseInt(nutrition.carbsGrams) * 4 / parseInt(nutrition.dailyCalories)) * 100),
                    protein: Math.round((parseInt(nutrition.proteinGrams) * 4 / parseInt(nutrition.dailyCalories)) * 100),
                    fats: Math.round((parseInt(nutrition.fatsGrams) * 9 / parseInt(nutrition.dailyCalories)) * 100)
                } : undefined
            }

            // Save both workout goals and nutrition goals
            await Promise.all([
                UserDataStorage.saveUserGoals(goalsData),
                NutritionStorage.saveNutritionGoals(nutritionGoalsData)
            ])

            notifications.success('Goals saved', {
                description: 'Your workout and nutrition goals have been updated successfully'
            })
        } catch (error: unknown) {
            console.error('Error saving goals:', error)

            let errorMessage = 'Could not save your goals'
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMsg = (error as Error).message
                if (errorMsg.includes('permission denied') || errorMsg.includes('JWT')) {
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

    const handleDataChange = () => {
        // Force refresh of the gallery when new images are uploaded or changed
        setRefreshKey(prev => prev + 1)
    }

    // Handler for when TDEE calculator applies calories to goals
    const handleTDEEApply = (calories: number) => {
        setGoals(prev => ({ ...prev, dailyCalories: calories.toString() }))
        setNutrition(prev => ({ ...prev, dailyCalories: calories.toString() }))
        notifications.success('Calories updated', {
            description: `Daily calorie goal set to ${calories}`,
            duration: 3000
        })
    }

    // Handler for when Macro calculator applies macros to goals
    const handleMacrosApply = (macros: { carbs: number; protein: number; fats: number }) => {
        setNutrition(prev => ({
            ...prev,
            carbsGrams: macros.carbs.toString(),
            proteinGrams: macros.protein.toString(),
            fatsGrams: macros.fats.toString(),
            macroPreference: 'custom'
        }))
        notifications.success('Macros updated', {
            description: `Macros set to ${macros.carbs}g/${macros.protein}g/${macros.fats}g`,
            duration: 3000
        })
    }

    // Handler for when a goal template is applied
    const handleTemplateApply = (template: { name: string; values: {
        dailyExerciseMinutes: number
        weeklyExerciseSessions: number
        dailyCalories: number
        activityLevel: string
        sleepHours: number
        recoveryMinutes: number
        dietType: string
        carbsGrams: number
        proteinGrams: number
        fatsGrams: number
        macroPreference: 'balanced' | 'highProtein' | 'lowCarb' | 'custom'
    }}) => {
        const values = template.values

        // Update goals
        setGoals({
            dailyExerciseMinutes: values.dailyExerciseMinutes.toString(),
            weeklyExerciseSessions: values.weeklyExerciseSessions.toString(),
            dailyCalories: values.dailyCalories.toString(),
            activityLevel: values.activityLevel,
            sleepHours: values.sleepHours.toString(),
            recoveryMinutes: values.recoveryMinutes.toString(),
            startingWeight: goals.startingWeight, // Keep existing values
            goalWeight: goals.goalWeight, // Keep existing values
            dietType: values.dietType
        })

        // Update nutrition
        setNutrition({
            dailyCalories: values.dailyCalories.toString(),
            carbsGrams: values.carbsGrams.toString(),
            proteinGrams: values.proteinGrams.toString(),
            fatsGrams: values.fatsGrams.toString(),
            fiberGrams: nutrition.fiberGrams, // Keep existing values
            waterMl: nutrition.waterMl, // Keep existing values
            sodiumMg: nutrition.sodiumMg, // Keep existing values
            macroPreference: values.macroPreference
        })

        notifications.success('Template applied', {
            description: `${template.name} goal template has been applied`,
            duration: 3000
        })
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
                            <button
                                onClick={() => setActiveTab("calculators")}
                                className={`
                                    flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-all rounded-md
                                    ${activeTab === "calculators"
                                        ? "bg-[#2A8CEA] text-white shadow-sm"
                                        : "text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                    }
                                `}
                            >
                                <Calculator className="w-4 h-4" />
                                <span>Calculators</span>
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

                            <TabsContent value="goals" className="mt-0 space-y-6">
                                {/* Goal Templates Section */}
                                <GoalTemplates onApplyTemplate={handleTemplateApply} />

                                {/* Single Consolidated Goals Card */}
                                <Card className="bg-[#121318] border-[#212227]">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center">
                                                    <Target className="w-4 h-4 text-[#A1A1AA]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-[#F3F4F6] font-medium">Health & Fitness Goals</p>
                                                    <p className="text-xs text-[#A1A1AA]">Set your targets for optimal performance</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Exercise Goals Section - Compact Grid */}
                                        <div className="space-y-3 pb-5 border-b border-[#212227]">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#FF375F] flex items-center justify-center shadow-sm">
                                                    <Dumbbell className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-semibold text-[#F3F4F6]">Exercise Goals</span>
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
                                        <div className="space-y-3 pb-5 border-b border-[#212227]">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#9BE15D] to-[#00E676] flex items-center justify-center shadow-sm">
                                                    <Flame className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-semibold text-[#F3F4F6]">Nutrition Goals</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dailyCalories" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Daily Calories</Label>
                                                    <Input
                                                        id="dailyCalories"
                                                        type="text"
                                                        value={goals.dailyCalories}
                                                        onChange={(e) => {
                                                            const value = handleNumericInput(e.target.value, 5, false)
                                                            setGoals({ ...goals, dailyCalories: value })
                                                            // Sync with detailed nutrition form
                                                            setNutrition({ ...nutrition, dailyCalories: value })
                                                        }}
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

                                        {/* Detailed Nutrition Goals Section */}
                                        <div className="space-y-3 pb-5 border-b border-[#212227]">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#9BE15D] to-[#00E676] flex items-center justify-center shadow-sm">
                                                    <Flame className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-semibold text-[#F3F4F6]">Macronutrient Targets</span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="macroPreference" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Macro Preference</Label>
                                                    <MobileSelect
                                                        value={nutrition.macroPreference}
                                                        onValueChange={(value) => {
                                                            const macroValue = value as 'balanced' | 'highProtein' | 'lowCarb' | 'custom'
                                                            setNutrition({ ...nutrition, macroPreference: macroValue })
                                                            // Auto-calculate macros for preset options
                                                            if (macroValue === 'balanced') {
                                                                const calories = parseInt(nutrition.dailyCalories) || 2000
                                                                setNutrition(prev => ({
                                                                    ...prev,
                                                                    macroPreference: macroValue,
                                                                    carbsGrams: Math.round(calories * 0.45 / 4).toString(),
                                                                    proteinGrams: Math.round(calories * 0.25 / 4).toString(),
                                                                    fatsGrams: Math.round(calories * 0.30 / 9).toString()
                                                                }))
                                                            } else if (macroValue === 'highProtein') {
                                                                const calories = parseInt(nutrition.dailyCalories) || 2000
                                                                setNutrition(prev => ({
                                                                    ...prev,
                                                                    macroPreference: macroValue,
                                                                    carbsGrams: Math.round(calories * 0.35 / 4).toString(),
                                                                    proteinGrams: Math.round(calories * 0.35 / 4).toString(),
                                                                    fatsGrams: Math.round(calories * 0.30 / 9).toString()
                                                                }))
                                                            } else if (macroValue === 'lowCarb') {
                                                                const calories = parseInt(nutrition.dailyCalories) || 2000
                                                                setNutrition(prev => ({
                                                                    ...prev,
                                                                    macroPreference: macroValue,
                                                                    carbsGrams: Math.round(calories * 0.20 / 4).toString(),
                                                                    proteinGrams: Math.round(calories * 0.30 / 4).toString(),
                                                                    fatsGrams: Math.round(calories * 0.50 / 9).toString()
                                                                }))
                                                            }
                                                        }}
                                                        options={[
                                                            { value: "balanced", label: "Balanced (45/25/30)" },
                                                            { value: "highProtein", label: "High Protein (35/35/30)" },
                                                            { value: "lowCarb", label: "Low Carb (20/30/50)" },
                                                            { value: "custom", label: "Custom" }
                                                        ]}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-xs focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D]"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="carbsGrams" className="text-xs text-[#FFA500] font-medium uppercase tracking-wide">Carbs (g)</Label>
                                                        <Input
                                                            id="carbsGrams"
                                                            type="text"
                                                            value={nutrition.carbsGrams}
                                                            onChange={(e) => setNutrition({ ...nutrition, carbsGrams: handleNumericInput(e.target.value, 4, false) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#FFA500] focus:border-[#FFA500] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="250"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="proteinGrams" className="text-xs text-[#FF6B6B] font-medium uppercase tracking-wide">Protein (g)</Label>
                                                        <Input
                                                            id="proteinGrams"
                                                            type="text"
                                                            value={nutrition.proteinGrams}
                                                            onChange={(e) => setNutrition({ ...nutrition, proteinGrams: handleNumericInput(e.target.value, 4, false) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#FF6B6B] focus:border-[#FF6B6B] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="150"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="fatsGrams" className="text-xs text-[#4ECDC4] font-medium uppercase tracking-wide">Fats (g)</Label>
                                                        <Input
                                                            id="fatsGrams"
                                                            type="text"
                                                            value={nutrition.fatsGrams}
                                                            onChange={(e) => setNutrition({ ...nutrition, fatsGrams: handleNumericInput(e.target.value, 4, false) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#4ECDC4] focus:border-[#4ECDC4] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="67"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="fiberGrams" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Fiber (g)</Label>
                                                        <Input
                                                            id="fiberGrams"
                                                            type="text"
                                                            value={nutrition.fiberGrams}
                                                            onChange={(e) => setNutrition({ ...nutrition, fiberGrams: handleNumericInput(e.target.value, 3, false) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="25"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="waterMl" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Water (ml)</Label>
                                                        <Input
                                                            id="waterMl"
                                                            type="text"
                                                            value={nutrition.waterMl}
                                                            onChange={(e) => setNutrition({ ...nutrition, waterMl: handleNumericInput(e.target.value, 5, false) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="2000"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="sodiumMg" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Sodium (mg)</Label>
                                                        <Input
                                                            id="sodiumMg"
                                                            type="text"
                                                            value={nutrition.sodiumMg}
                                                            onChange={(e) => setNutrition({ ...nutrition, sodiumMg: handleNumericInput(e.target.value, 5, false) })}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="2300"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recovery Goals Section */}
                                        <div className="space-y-3 pb-5 border-b border-[#212227]">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] flex items-center justify-center shadow-sm">
                                                    <Moon className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-semibold text-[#F3F4F6]">Recovery & Sleep</span>
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
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFA500] to-[#FF8C00] flex items-center justify-center shadow-sm">
                                                    <Weight className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-sm font-semibold text-[#F3F4F6]">Weight Goals</span>
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

                            <TabsContent value="calculators" className="mt-0 space-y-6">
                                {/* BMI Calculator */}
                                <BMICalculator
                                    initialWeight={profile.weight ? parseFloat(profile.weight) : 0}
                                    initialHeight={profile.height ? parseFloat(profile.height) : 0}
                                    weightUnit={profile.weightUnit}
                                    heightUnit={profile.heightUnit}
                                />

                                {/* TDEE Calculator */}
                                <TDEECalculator
                                    initialWeight={profile.weight ? parseFloat(profile.weight) : 0}
                                    initialHeight={profile.height ? parseFloat(profile.height) : 0}
                                    initialAge={profile.age ? parseInt(profile.age) : 0}
                                    weightUnit={profile.weightUnit}
                                    heightUnit={profile.heightUnit}
                                    onApplyToGoals={handleTDEEApply}
                                />

                                {/* Macro Calculator */}
                                <MacroCalculator
                                    initialCalories={goals.dailyCalories ? parseInt(goals.dailyCalories) : 2000}
                                    onApplyToGoals={handleMacrosApply}
                                />
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}