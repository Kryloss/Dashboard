"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { isOnSubdomain } from "@/lib/subdomains"
import { Button } from "@/components/ui/button"
import { GoalRings } from "../workout/components/goal-rings"
import { StatCard } from "../workout/components/stat-card"

import { NutritionStorage, NutritionEntry, NutritionGoals, DetailedNutrients, Food, FoodEntry, Meal } from "@/lib/nutrition-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { useWorkoutState } from "@/lib/hooks/useWorkoutState"
import { DetailedMacroModal } from "./components/detailed-macro-modal"
import { AddFoodDialog } from "./components/add-food-dialog"
import { SetGoalDialog } from "../workout/components/set-goal-dialog"
import { Plus, Apple, Utensils, User, Dumbbell, Coffee, Sandwich, ChefHat, Cookie, Flame, Moon, TrendingUp, Edit3, Trash2 } from "lucide-react"

export default function NutritionPage() {
    const router = useRouter()
    const { user, loading, supabase } = useAuth()
    const notifications = useNotifications()
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)
    const [nutritionEntry, setNutritionEntry] = useState<NutritionEntry | null>(null)
    const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null)

    // Modal state for detailed macro breakdowns
    const [selectedMacro, setSelectedMacro] = useState<'carbs' | 'protein' | 'fats' | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Add food dialog state
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null)
    const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false)

    // Settings dialog state
    const [showSetGoalDialog, setShowSetGoalDialog] = useState(false)

    // Use workout state for goal rings integration
    const { state: workoutState, refreshWorkoutData } = useWorkoutState()

    // Track if we've shown the sign-in notification to avoid duplicates
    const signInNotificationShownRef = useRef(false)

    // Initialize and load nutrition data
    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        if (onHealss && user && supabase) {
            // Initialize storage
            NutritionStorage.initialize(user, supabase)

            // Load nutrition data
            const loadNutritionData = async () => {
                try {
                    const [entry, goals] = await Promise.all([
                        NutritionStorage.getNutritionEntry(),
                        NutritionStorage.getNutritionGoals()
                    ])
                    setNutritionEntry(entry)
                    setNutritionGoals(goals)
                } catch (error) {
                    console.error('Error loading nutrition data:', error)
                }
            }

            loadNutritionData()
        } else if (onHealss && !loading && user === null && !signInNotificationShownRef.current) {
            signInNotificationShownRef.current = true
            notifications.warning('Sign in required', {
                description: 'Please sign in to access nutrition tracking',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
        }
    }, [user, loading, supabase, notifications, router])

    const handleAddFood = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to track nutrition',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        setSelectedMealType(mealType)
        setIsAddFoodDialogOpen(true)
    }

    const handleQuickAction = (action: string) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to track nutrition',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        if (action === 'add-food') {
            // Show meal creation dialog
            notifications.info('Add Meal', {
                description: 'Meal creation feature coming soon! Use + buttons on meal cards to add foods for now.',
                duration: 4000
            })
            return
        }

        // TODO: Implement other quick actions
        notifications.info('Quick action', {
            description: `${action} feature coming soon!`,
            duration: 3000
        })
    }

    const handleMacroClick = (macroType: 'carbs' | 'protein' | 'fats') => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to view detailed nutrition',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        setSelectedMacro(macroType)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedMacro(null)
    }

    const closeAddFoodDialog = () => {
        setIsAddFoodDialogOpen(false)
        setSelectedMealType(null)
    }

    const handleEditFood = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', food: FoodEntry) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to edit nutrition',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        // TODO: Implement food editing functionality
        notifications.info('Edit Food', {
            description: `Editing ${food.food.name} from ${mealType}. Feature coming soon!`,
            duration: 3000
        })
    }

    const handleDeleteFood = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', foodId: string) => {
        if (!user || !nutritionEntry) return

        try {
            const updatedEntry = { ...nutritionEntry }
            const meal = updatedEntry.meals.find(m => m.type === mealType)

            if (!meal) return

            // Remove the food from the meal
            meal.foods = meal.foods.filter(f => f.id !== foodId)

            // Recalculate meal totals
            const mealTotals = NutritionStorage.calculateMealTotals(meal)
            meal.totalCalories = mealTotals.calories
            meal.totalMacros = mealTotals.macros

            // Recalculate entry totals
            updatedEntry.totalCalories = updatedEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            updatedEntry.totalMacros = {
                carbs: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            // Save to storage
            const savedEntry = await NutritionStorage.saveNutritionEntry(updatedEntry)

            // Update local state
            setNutritionEntry(savedEntry)

            // Refresh workout state to update goal rings
            if (refreshWorkoutData) {
                refreshWorkoutData(true)
            }

            notifications.success('Food removed', {
                description: 'Food item removed from meal',
                duration: 3000
            })

        } catch (error) {
            console.error('Error deleting food:', error)
            notifications.error('Delete failed', {
                description: 'Unable to remove food item. Please try again.',
                duration: 4000
            })
        }
    }

    const handleEditMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal: Meal) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to edit meals',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        // TODO: Implement meal editing functionality
        notifications.info('Edit Meal', {
            description: `Editing ${meal.name} meal. Feature coming soon!`,
            duration: 3000
        })
    }

    const handleDeleteMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal: Meal) => {
        if (!user || !nutritionEntry) return

        try {
            const updatedEntry = { ...nutritionEntry }

            // Remove the entire meal
            updatedEntry.meals = updatedEntry.meals.filter(m => m.id !== meal.id)

            // Recalculate entry totals
            updatedEntry.totalCalories = updatedEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            updatedEntry.totalMacros = {
                carbs: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            // Save to storage
            const savedEntry = await NutritionStorage.saveNutritionEntry(updatedEntry)

            // Update local state
            setNutritionEntry(savedEntry)

            // Refresh workout state to update goal rings
            if (refreshWorkoutData) {
                refreshWorkoutData(true)
            }

            notifications.success('Meal deleted', {
                description: `${meal.name} meal removed with all ${meal.foods.length} items`,
                duration: 3000
            })

        } catch (error) {
            console.error('Error deleting meal:', error)
            notifications.error('Delete failed', {
                description: 'Unable to remove meal. Please try again.',
                duration: 4000
            })
        }
    }

    const handleFoodAdded = async (food: Food, quantity: number, notes?: string) => {
        if (!selectedMealType || !user) return

        try {
            // Get current nutrition entry or create new one
            const todayDate = new Date().toISOString().split('T')[0]
            let currentEntry = nutritionEntry

            if (!currentEntry) {
                // Create new entry for today
                currentEntry = {
                    id: `nutrition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    userId: user.id,
                    date: todayDate,
                    meals: [],
                    totalCalories: 0,
                    totalMacros: { carbs: 0, protein: 0, fats: 0 },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            }

            // Calculate adjusted nutrition values
            const adjustedCalories = Math.round(food.caloriesPerServing * quantity)
            const adjustedMacros = {
                carbs: food.macros.carbs * quantity,
                protein: food.macros.protein * quantity,
                fats: food.macros.fats * quantity,
                fiber: (food.macros.fiber || 0) * quantity,
                sugar: (food.macros.sugar || 0) * quantity,
                sodium: (food.macros.sodium || 0) * quantity
            }

            // Create food entry
            const foodEntry = {
                id: `food-entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                foodId: food.id,
                food: food,
                quantity: quantity,
                adjustedCalories: adjustedCalories,
                adjustedMacros: adjustedMacros,
                notes: notes,
                createdAt: new Date().toISOString()
            }

            // Find or create the meal
            let meal = currentEntry.meals.find(m => m.type === selectedMealType)
            if (!meal) {
                meal = NutritionStorage.createEmptyMeal(selectedMealType)
                currentEntry.meals.push(meal)
            }

            // Add food to meal
            meal.foods.push(foodEntry)

            // Recalculate meal totals
            const mealTotals = NutritionStorage.calculateMealTotals(meal)
            meal.totalCalories = mealTotals.calories
            meal.totalMacros = mealTotals.macros

            // Recalculate entry totals
            currentEntry.totalCalories = currentEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            currentEntry.totalMacros = {
                carbs: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            // Save to storage
            const savedEntry = await NutritionStorage.saveNutritionEntry(currentEntry)

            // Update local state
            setNutritionEntry(savedEntry)

            // Refresh workout state to update goal rings
            if (refreshWorkoutData) {
                refreshWorkoutData(true)
            }

        } catch (error) {
            console.error('Error adding food:', error)
            notifications.error('Add food failed', {
                description: 'Unable to add food. Please try again.',
                duration: 4000
            })
        }
    }

    // Helper functions for calculations
    const getTodaysNutrition = () => {
        if (!nutritionEntry) {
            return {
                totalCalories: 0,
                totalMacros: { carbs: 0, protein: 0, fats: 0 },
                meals: []
            }
        }
        return {
            totalCalories: nutritionEntry.totalCalories,
            totalMacros: nutritionEntry.totalMacros,
            meals: nutritionEntry.meals
        }
    }

    const getTargetNutrition = () => {
        const defaultGoals = {
            dailyCalories: 2000,
            macroTargets: { carbs: 250, protein: 150, fats: 67 }
        }

        if (!nutritionGoals) return defaultGoals

        return {
            dailyCalories: nutritionGoals.dailyCalories,
            macroTargets: nutritionGoals.macroTargets
        }
    }

    const getMealIcon = (mealType: string) => {
        switch (mealType) {
            case 'breakfast': return <Coffee className="w-5 h-5" />
            case 'lunch': return <Sandwich className="w-5 h-5" />
            case 'dinner': return <ChefHat className="w-5 h-5" />
            case 'snacks': return <Cookie className="w-5 h-5" />
            default: return <Utensils className="w-5 h-5" />
        }
    }

    // Goal ring data calculation
    const getGoalRingData = () => {
        if (!workoutState.goalProgress) {
            return {
                recovery: 0.002,
                nutrition: 0.002,
                exercise: 0.002
            }
        }

        return {
            recovery: Math.max(workoutState.goalProgress.recovery.progress, 0.002),
            nutrition: Math.max(workoutState.goalProgress.nutrition.progress, 0.002),
            exercise: Math.max(workoutState.goalProgress.exercise.progress, 0.002)
        }
    }

    const getSummaryPercentages = () => {
        if (!workoutState.goalProgress) {
            return { recovery: 0, nutrition: 0, exercise: 0 }
        }

        return {
            recovery: (workoutState.goalProgress.recovery.currentHours / workoutState.goalProgress.recovery.targetHours) * 100,
            nutrition: (workoutState.goalProgress.nutrition.currentCalories / workoutState.goalProgress.nutrition.targetCalories) * 100,
            exercise: (workoutState.goalProgress.exercise.currentMinutes / workoutState.goalProgress.exercise.targetMinutes) * 100
        }
    }

    // Get detailed nutrients for modal
    const getDetailedNutrients = (): DetailedNutrients => {
        if (!nutritionEntry) {
            return { carbs: 0, protein: 0, fats: 0 }
        }

        // Aggregate detailed nutrients from all meals
        const detailed: DetailedNutrients = { carbs: 0, protein: 0, fats: 0 }

        nutritionEntry.meals.forEach(meal => {
            meal.foods.forEach(foodEntry => {
                const macros = foodEntry.food.macros
                detailed.carbs += foodEntry.adjustedMacros.carbs
                detailed.protein += foodEntry.adjustedMacros.protein
                detailed.fats += foodEntry.adjustedMacros.fats

                // Aggregate detailed nutrients with quantity adjustment
                if (macros.fiber) detailed.fiber = (detailed.fiber || 0) + (macros.fiber * foodEntry.quantity)
                if (macros.sugar) detailed.sugar = (detailed.sugar || 0) + (macros.sugar * foodEntry.quantity)
                if (macros.sodium) detailed.sodium = (detailed.sodium || 0) + (macros.sodium * foodEntry.quantity)
                if (macros.saturatedFat) detailed.saturatedFat = (detailed.saturatedFat || 0) + (macros.saturatedFat * foodEntry.quantity)
                if (macros.transFat) detailed.transFat = (detailed.transFat || 0) + (macros.transFat * foodEntry.quantity)
                if (macros.monounsaturatedFat) detailed.monounsaturatedFat = (detailed.monounsaturatedFat || 0) + (macros.monounsaturatedFat * foodEntry.quantity)
                if (macros.polyunsaturatedFat) detailed.polyunsaturatedFat = (detailed.polyunsaturatedFat || 0) + (macros.polyunsaturatedFat * foodEntry.quantity)
                if (macros.cholesterol) detailed.cholesterol = (detailed.cholesterol || 0) + (macros.cholesterol * foodEntry.quantity)
            })
        })

        return detailed
    }

    // Get food sources for modal
    const getFoodSources = (macroType: 'carbs' | 'protein' | 'fats') => {
        if (!nutritionEntry) return []

        const foods: Array<{
            name: string
            servingSize: string
            macroValue: number
            detailedNutrients: DetailedNutrients
        }> = []

        nutritionEntry.meals.forEach(meal => {
            meal.foods.forEach(foodEntry => {
                const macroValue = foodEntry.adjustedMacros[macroType]

                if (macroValue > 0) {
                    foods.push({
                        name: foodEntry.food.name,
                        servingSize: `${foodEntry.quantity} × ${foodEntry.food.servingSize}${foodEntry.food.servingUnit}`,
                        macroValue,
                        detailedNutrients: foodEntry.food.macros
                    })
                }
            })
        })

        // Sort by macro value (highest first)
        return foods.sort((a, b) => b.macroValue - a.macroValue)
    }

    // If we're on healss.kryloss.com, show healss content
    if (isHealssSubdomain) {
        // Show loading state while authentication is being checked
        if (loading) {
            return (
                <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-[#4AA7FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[#9CA9B7]">Loading...</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6] relative overflow-hidden">
                {/* Hero Gradient Orb Background */}
                <div className="absolute inset-0 opacity-80">
                    {/* Desktop gradient */}
                    <div
                        className="hidden md:block absolute inset-0"
                        style={{
                            background: "radial-gradient(60% 60% at 60% 30%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                        }}
                    />
                    {/* Mobile gradient - centered and larger */}
                    <div
                        className="block md:hidden absolute inset-0"
                        style={{
                            background: "radial-gradient(80% 80% at 50% 40%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="container mx-auto max-w-7xl px-6 py-4">
                        {/* Daily Goals Section */}
                        <section className="mb-6">
                            <div className="flex items-center justify-end mb-3 space-x-2">
                                <Button
                                    onClick={() => setShowSetGoalDialog(true)}
                                    variant="ghost"
                                    className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                                >
                                    <User className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                                <div className="flex flex-col items-center lg:items-start">
                                    <div className="flex justify-center lg:justify-start relative">
                                        <GoalRings
                                            size="lg"
                                            recoveryProgress={getGoalRingData().recovery}
                                            nutritionProgress={getGoalRingData().nutrition}
                                            exerciseProgress={getGoalRingData().exercise}
                                            streak={7} // Mock streak data
                                            className={workoutState.isLoading ? 'opacity-90' : ''}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-[#F3F4F6] mb-2">Today&apos;s Summary</h2>

                                    <div className="grid grid-cols-1 gap-2">
                                        {/* Nutrition Summary - Highlighted */}
                                        <div className="p-4 bg-gradient-to-br from-[#9BE15D]/10 via-[#00E676]/5 to-transparent border-2 border-[#9BE15D]/20 rounded-[12px] hover:border-[#9BE15D]/30 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-[#9BE15D] to-[#00E676] rounded-[8px] flex items-center justify-center">
                                                        <Flame className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-[#F3F4F6] font-medium text-sm">Nutrition</span>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <div className="text-xs text-[#A1A1AA]">
                                                        {getTodaysNutrition().totalCalories} of {getTargetNutrition().dailyCalories} cal
                                                    </div>
                                                </div>
                                                <div className="text-[#9BE15D] text-sm font-semibold">
                                                    {Math.round(getSummaryPercentages().nutrition)}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Exercise Summary */}
                                        <div className="p-3 bg-[#121318] border border-[#212227] rounded-[12px] hover:border-[#2A2B31] transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-[#FF2D55] to-[#FF375F] rounded-[8px] flex items-center justify-center">
                                                        <Dumbbell className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-[#F3F4F6] font-medium text-sm">Exercise</span>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    {workoutState.goalProgress && (
                                                        <div className="text-xs text-[#A1A1AA]">
                                                            {workoutState.goalProgress.exercise.currentMinutes}m of {workoutState.goalProgress.exercise.targetMinutes}m
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[#FF2D55] text-sm font-semibold">
                                                    {Math.round(getSummaryPercentages().exercise)}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recovery Summary */}
                                        <div className="p-3 bg-[#121318] border border-[#212227] rounded-[12px] hover:border-[#2A2B31] transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] rounded-[8px] flex items-center justify-center">
                                                        <Moon className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-[#F3F4F6] font-medium text-sm">Recovery</span>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    {workoutState.goalProgress && (
                                                        <div className="text-xs text-[#A1A1AA]">
                                                            {workoutState.goalProgress.recovery.currentHours.toFixed(1)}h of {workoutState.goalProgress.recovery.targetHours}h
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[#2BD2FF] text-sm font-semibold">
                                                    {Math.round(getSummaryPercentages().recovery)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Today's Nutrition Section */}
                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-[#F3F4F6]">Today&apos;s Nutrition</h2>
                                <div className="flex items-center space-x-3">
                                    <Button
                                        onClick={() => handleQuickAction('scan-barcode')}
                                        className="bg-gradient-to-r from-[#6B7280] via-[#4B5563] to-[#374151] text-white rounded-full border border-[rgba(107,114,128,0.35)] shadow-[0_8px_32px_rgba(107,114,128,0.28)] hover:shadow-[0_10px_40px_rgba(107,114,128,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                    >
                                        <Apple className="w-4 h-4 mr-2" />
                                        Scan Food
                                    </Button>
                                    <Button
                                        onClick={() => handleQuickAction('add-food')}
                                        className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Meal
                                    </Button>
                                </div>
                            </div>

                            {/* Macro Overview Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div
                                    onClick={() => handleMacroClick('carbs')}
                                    className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200 ease-out cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-[#A1A1AA]">Carbs</span>
                                        <span className="text-xs text-[#7A7F86]">{getTodaysNutrition().totalMacros.carbs}g / {getTargetNutrition().macroTargets.carbs}g</span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="text-2xl font-bold text-[#F3F4F6]">
                                            {Math.round((getTodaysNutrition().totalMacros.carbs / getTargetNutrition().macroTargets.carbs) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full bg-[#212227] rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-[#9BE15D] to-[#00E676] h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((getTodaysNutrition().totalMacros.carbs / getTargetNutrition().macroTargets.carbs) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleMacroClick('protein')}
                                    className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200 ease-out cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-[#A1A1AA]">Protein</span>
                                        <span className="text-xs text-[#7A7F86]">{getTodaysNutrition().totalMacros.protein}g / {getTargetNutrition().macroTargets.protein}g</span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="text-2xl font-bold text-[#F3F4F6]">
                                            {Math.round((getTodaysNutrition().totalMacros.protein / getTargetNutrition().macroTargets.protein) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full bg-[#212227] rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-[#2A8CEA] to-[#1659BF] h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((getTodaysNutrition().totalMacros.protein / getTargetNutrition().macroTargets.protein) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleMacroClick('fats')}
                                    className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200 ease-out cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-[#A1A1AA]">Fats</span>
                                        <span className="text-xs text-[#7A7F86]">{getTodaysNutrition().totalMacros.fats}g / {getTargetNutrition().macroTargets.fats}g</span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="text-2xl font-bold text-[#F3F4F6]">
                                            {Math.round((getTodaysNutrition().totalMacros.fats / getTargetNutrition().macroTargets.fats) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full bg-[#212227] rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-[#FF2D55] to-[#FF375F] h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((getTodaysNutrition().totalMacros.fats / getTargetNutrition().macroTargets.fats) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Meals Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                                    const meal = getTodaysNutrition().meals.find(m => m.type === mealType)
                                    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1)

                                    return (
                                        <div key={mealType} className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] transition-colors">
                                            <div className="flex items-center justify-between mb-3 group/meal">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center text-[#F3F4F6]">
                                                        {getMealIcon(mealType)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-[#F3F4F6]">{mealName}</h3>
                                                        {meal && (
                                                            <p className="text-xs text-[#A1A1AA]">{meal.totalCalories} cal • {meal.foods.length} items</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {meal && (
                                                        <>
                                                            <Button
                                                                onClick={() => handleEditMeal(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-6 h-6 opacity-0 group-hover/meal:opacity-100 transition-opacity"
                                                            >
                                                                <Edit3 className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDeleteMeal(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-6 h-6 opacity-0 group-hover/meal:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        onClick={() => handleAddFood(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks')}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-7 h-7"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {meal ? (
                                                <div className="space-y-2">
                                                    {meal.foods.slice(0, 3).map((food, index) => (
                                                        <div key={index} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)] group">
                                                            <div>
                                                                <p className="text-sm text-[#F3F4F6]">{food.food.name}</p>
                                                                <p className="text-xs text-[#7A7F86]">{food.adjustedCalories} cal • {food.quantity} {food.food.servingUnit}</p>
                                                            </div>
                                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    onClick={() => handleEditFood(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', food)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-6 h-6"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteFood(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', food.id)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-6 h-6"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {meal.foods.length > 3 && (
                                                        <p className="text-xs text-[#7A7F86] text-center py-1">
                                                            +{meal.foods.length - 3} more items
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-sm text-[#7A7F86]">No foods added yet</p>
                                                    <p className="text-xs text-[#5A5F66] mt-1">Tap + to add food</p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        {/* Statistics Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-[#F3F4F6]">Quick Actions</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        onClick={() => router.push('/history?tab=nutrition')}
                                        className="bg-[#121318] border border-[#212227] text-[#F3F4F6] hover:border-[#2A2B31] rounded-[16px] p-4 h-auto justify-start"
                                        variant="ghost"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium mb-1">History</div>
                                            <div className="text-xs text-[#A1A1AA]">View past days</div>
                                        </div>
                                    </Button>
                                    <Button
                                        onClick={() => handleQuickAction('recipes')}
                                        className="bg-[#121318] border border-[#212227] text-[#F3F4F6] hover:border-[#2A2B31] rounded-[16px] p-4 h-auto justify-start"
                                        variant="ghost"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium mb-1">Recipes</div>
                                            <div className="text-xs text-[#A1A1AA]">Browse recipes</div>
                                        </div>
                                    </Button>
                                    <Button
                                        onClick={() => handleQuickAction('water')}
                                        className="bg-[#121318] border border-[#212227] text-[#F3F4F6] hover:border-[#2A2B31] rounded-[16px] p-4 h-auto justify-start"
                                        variant="ghost"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium mb-1">Water</div>
                                            <div className="text-xs text-[#A1A1AA]">Track hydration</div>
                                        </div>
                                    </Button>
                                    <Button
                                        onClick={() => handleQuickAction('insights')}
                                        className="bg-[#121318] border border-[#212227] text-[#F3F4F6] hover:border-[#2A2B31] rounded-[16px] p-4 h-auto justify-start"
                                        variant="ghost"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium mb-1">Insights</div>
                                            <div className="text-xs text-[#A1A1AA]">Get recommendations</div>
                                        </div>
                                    </Button>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-[#F3F4F6] mb-6">This Week&apos;s Progress</h2>
                                <div className="space-y-4">
                                    <StatCard
                                        icon={<Flame className="w-4 h-4" />}
                                        label="Avg Calories"
                                        value="1,847"
                                        change={{ value: "No progress data yet", direction: "neutral" }}
                                        period=""
                                    />
                                    <StatCard
                                        icon={<Apple className="w-4 h-4" />}
                                        label="Foods Logged"
                                        value="24"
                                        change={{ value: "No progress data yet", direction: "neutral" }}
                                        period=""
                                    />
                                    <StatCard
                                        icon={<TrendingUp className="w-4 h-4" />}
                                        label="Streak"
                                        value="7 days"
                                        change={{ value: "No progress data yet", direction: "neutral" }}
                                        period=""
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Detailed Macro Modal */}
                {selectedMacro && (
                    <DetailedMacroModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        macroType={selectedMacro}
                        currentValue={getTodaysNutrition().totalMacros[selectedMacro]}
                        targetValue={getTargetNutrition().macroTargets[selectedMacro]}
                        detailedNutrients={getDetailedNutrients()}
                        foods={getFoodSources(selectedMacro)}
                    />
                )}

                {/* Add Food Dialog */}
                {selectedMealType && (
                    <AddFoodDialog
                        isOpen={isAddFoodDialogOpen}
                        onClose={closeAddFoodDialog}
                        mealType={selectedMealType}
                        onFoodAdded={handleFoodAdded}
                    />
                )}

                {/* Settings Dialog */}
                <SetGoalDialog
                    open={showSetGoalDialog}
                    onOpenChange={setShowSetGoalDialog}
                />
            </div>
        )
    }

    // If not on healss subdomain, redirect to main site or show error
    return (
        <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-[#F3F4F6] mb-4">Page Not Found</h1>
                <p className="text-[#A1A1AA]">This page is only available on the healss subdomain.</p>
            </div>
        </div>
    )
}
