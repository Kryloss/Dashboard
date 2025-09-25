"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { isOnSubdomain } from "@/lib/subdomains"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

import { NutritionStorage, NutritionEntry, Food } from "@/lib/nutrition-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { AddFoodDialog } from "../components/add-food-dialog"
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Coffee,
    Sandwich,
    ChefHat,
    Cookie,
    Flame,
    BarChart3
} from "lucide-react"
import { format, subDays, addDays } from "date-fns"

export default function NutritionHistoryPage() {
    const router = useRouter()
    const { user, loading, supabase } = useAuth()
    const notifications = useNotifications()

    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [nutritionEntry, setNutritionEntry] = useState<NutritionEntry | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    // Add food dialog state
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null)
    const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false)

    // Track if we've shown the sign-in notification to avoid duplicates
    const signInNotificationShownRef = useRef(false)

    // Initialize
    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        if (onHealss && user && supabase) {
            NutritionStorage.initialize(user, supabase)
        } else if (onHealss && !loading && user === null && !signInNotificationShownRef.current) {
            signInNotificationShownRef.current = true
            notifications.warning('Sign in required', {
                description: 'Please sign in to access nutrition history',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
        }
    }, [user, loading, supabase, notifications, router])

    // Load nutrition data for selected date
    useEffect(() => {
        const loadNutritionData = async () => {
            if (!user || !supabase) return

            const dateString = format(selectedDate, 'yyyy-MM-dd')
            setIsLoading(true)

            try {
                const entry = await NutritionStorage.getNutritionEntry(dateString)
                setNutritionEntry(entry)
            } catch (error) {
                console.error('Error loading nutrition data:', error)
                notifications.error('Load failed', {
                    description: 'Unable to load nutrition data for selected date',
                    duration: 3000
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadNutritionData()
    }, [selectedDate, user, supabase, notifications])

    const getMealIcon = (mealType: string) => {
        switch (mealType) {
            case 'breakfast': return <Coffee className="w-4 h-4" />
            case 'lunch': return <Sandwich className="w-4 h-4" />
            case 'dinner': return <ChefHat className="w-4 h-4" />
            case 'snacks': return <Cookie className="w-4 h-4" />
            default: return <Coffee className="w-4 h-4" />
        }
    }

    const getMealDisplayName = (mealType: string) => {
        const names = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks'
        }
        return names[mealType as keyof typeof names] || mealType
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date)
            setIsCalendarOpen(false)
        }
    }

    const navigateDate = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setSelectedDate(prev => subDays(prev, 1))
        } else {
            setSelectedDate(prev => addDays(prev, 1))
        }
    }

    const handleAddFood = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
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

        setSelectedMealType(mealType)
        setIsAddFoodDialogOpen(true)
    }

    const closeAddFoodDialog = () => {
        setIsAddFoodDialogOpen(false)
        setSelectedMealType(null)
    }

    const handleFoodAdded = async (food: Food, quantity: number, notes?: string) => {
        if (!selectedMealType || !user) return

        try {
            const dateString = format(selectedDate, 'yyyy-MM-dd')
            let currentEntry = nutritionEntry

            if (!currentEntry) {
                // Create new entry for selected date
                currentEntry = {
                    id: `nutrition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    userId: user.id,
                    date: dateString,
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

            // Save to storage with correct date
            currentEntry.date = dateString
            currentEntry.updatedAt = new Date().toISOString()
            const savedEntry = await NutritionStorage.saveNutritionEntry(currentEntry)

            // Update local state
            setNutritionEntry(savedEntry)

            notifications.success('Food added', {
                description: `${food.name} added to ${getMealDisplayName(selectedMealType)} for ${format(selectedDate, 'MMM d')}`,
                duration: 3000
            })

        } catch (error) {
            console.error('Error adding food:', error)
            notifications.error('Add food failed', {
                description: 'Unable to add food. Please try again.',
                duration: 4000
            })
        }
    }

    const handleDeleteFood = async (mealType: string, foodEntryId: string) => {
        if (!user || !nutritionEntry) return

        try {
            // Find and remove the food entry
            const meal = nutritionEntry.meals.find(m => m.type === mealType)
            if (!meal) return

            meal.foods = meal.foods.filter(food => food.id !== foodEntryId)

            // Recalculate meal totals
            const mealTotals = NutritionStorage.calculateMealTotals(meal)
            meal.totalCalories = mealTotals.calories
            meal.totalMacros = mealTotals.macros

            // Recalculate entry totals
            nutritionEntry.totalCalories = nutritionEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            nutritionEntry.totalMacros = {
                carbs: nutritionEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: nutritionEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: nutritionEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: nutritionEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: nutritionEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: nutritionEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            // Save updated entry
            const savedEntry = await NutritionStorage.saveNutritionEntry(nutritionEntry)
            setNutritionEntry(savedEntry)

            notifications.success('Food removed', {
                description: 'Food item has been removed',
                duration: 3000
            })

        } catch (error) {
            console.error('Error removing food:', error)
            notifications.error('Remove failed', {
                description: 'Unable to remove food. Please try again.',
                duration: 4000
            })
        }
    }

    const getTotalNutrition = () => {
        if (!nutritionEntry) {
            return { totalCalories: 0, totalMacros: { carbs: 0, protein: 0, fats: 0 } }
        }
        return {
            totalCalories: nutritionEntry.totalCalories,
            totalMacros: nutritionEntry.totalMacros
        }
    }

    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

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
            <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6]">
                <div className="container mx-auto max-w-6xl px-6 py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => router.push('/nutrition')}
                                variant="ghost"
                                size="icon"
                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-[#F3F4F6]">Nutrition History</h1>
                                <p className="text-[#A1A1AA] text-sm">View and edit your nutrition from previous days</p>
                            </div>
                        </div>
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center justify-center space-x-4 mb-8">
                        <Button
                            onClick={() => navigateDate('prev')}
                            variant="ghost"
                            size="icon"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                        >
                            ←
                        </Button>

                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`justify-center text-left font-normal bg-[#121318] border-[#212227] text-[#F3F4F6] hover:bg-[#1a1b21] hover:border-[#2A2B31] ${
                                        !selectedDate && "text-muted-foreground"
                                    }`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? (
                                        <>
                                            {format(selectedDate, "PPP")}
                                            {isToday && (
                                                <Badge variant="outline" className="ml-2 text-[#2A8CEA] border-[#2A8CEA]">
                                                    Today
                                                </Badge>
                                            )}
                                        </>
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#121318] border-[#212227]" align="center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                    className="text-[#F3F4F6]"
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                />
                            </PopoverContent>
                        </Popover>

                        <Button
                            onClick={() => navigateDate('next')}
                            variant="ghost"
                            size="icon"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                            disabled={format(selectedDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}
                        >
                            →
                        </Button>
                    </div>

                    {/* Nutrition Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Flame className="w-4 h-4 text-[#FF6B35]" />
                                <span className="text-sm font-medium text-[#A1A1AA]">Calories</span>
                            </div>
                            <div className="text-2xl font-bold text-[#F3F4F6]">
                                {getTotalNutrition().totalCalories}
                            </div>
                        </div>

                        <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-4 h-4 bg-[#9BE15D] rounded-full" />
                                <span className="text-sm font-medium text-[#A1A1AA]">Carbs</span>
                            </div>
                            <div className="text-2xl font-bold text-[#F3F4F6]">
                                {Math.round(getTotalNutrition().totalMacros.carbs)}g
                            </div>
                        </div>

                        <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-4 h-4 bg-[#2A8CEA] rounded-full" />
                                <span className="text-sm font-medium text-[#A1A1AA]">Protein</span>
                            </div>
                            <div className="text-2xl font-bold text-[#F3F4F6]">
                                {Math.round(getTotalNutrition().totalMacros.protein)}g
                            </div>
                        </div>

                        <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-4 h-4 bg-[#FF2D55] rounded-full" />
                                <span className="text-sm font-medium text-[#A1A1AA]">Fats</span>
                            </div>
                            <div className="text-2xl font-bold text-[#F3F4F6]">
                                {Math.round(getTotalNutrition().totalMacros.fats)}g
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-[#2A8CEA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[#A1A1AA]">Loading nutrition data...</p>
                        </div>
                    ) : nutritionEntry ? (
                        /* Meals Section */
                        <div className="space-y-6">
                            {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                                const meal = nutritionEntry.meals.find(m => m.type === mealType)

                                return (
                                    <div key={mealType} className="bg-[#121318] border border-[#212227] rounded-[20px] p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center text-[#F3F4F6]">
                                                    {getMealIcon(mealType)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-[#F3F4F6]">{getMealDisplayName(mealType)}</h3>
                                                    {meal && (
                                                        <p className="text-sm text-[#A1A1AA]">
                                                            {meal.totalCalories} cal • {meal.foods.length} items
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleAddFood(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks')}
                                                size="sm"
                                                className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)]"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Food
                                            </Button>
                                        </div>

                                        {meal && meal.foods.length > 0 ? (
                                            <div className="space-y-3">
                                                {meal.foods.map((food, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-3">
                                                                <div>
                                                                    <p className="font-medium text-[#F3F4F6]">{food.food.name}</p>
                                                                    {food.food.brand && (
                                                                        <p className="text-xs text-[#7A7F86]">{food.food.brand}</p>
                                                                    )}
                                                                    <p className="text-xs text-[#A1A1AA]">
                                                                        {food.quantity} × {food.food.servingSize}{food.food.servingUnit}
                                                                    </p>
                                                                    {food.notes && (
                                                                        <p className="text-xs text-[#7A7F86] italic">Note: {food.notes}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-4">
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-[#F3F4F6]">{food.adjustedCalories} cal</p>
                                                                <div className="flex items-center space-x-2 text-xs text-[#A1A1AA]">
                                                                    <span className="text-[#9BE15D]">{food.adjustedMacros.carbs.toFixed(1)}C</span>
                                                                    <span className="text-[#2A8CEA]">{food.adjustedMacros.protein.toFixed(1)}P</span>
                                                                    <span className="text-[#FF2D55]">{food.adjustedMacros.fats.toFixed(1)}F</span>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                onClick={() => handleDeleteFood(mealType, food.id)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-[#EF4444] hover:text-white hover:bg-[#EF4444] rounded-full w-8 h-8"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 border-2 border-dashed border-[#212227] rounded-lg">
                                                <p className="text-[#7A7F86] mb-2">No foods added to {mealType}</p>
                                                <p className="text-xs text-[#5A5F66]">Click &quot;Add Food&quot; to get started</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="text-center py-16">
                            <BarChart3 className="w-16 h-16 text-[#A1A1AA] mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-[#F3F4F6] mb-2">No nutrition data</h3>
                            <p className="text-[#A1A1AA] mb-6">
                                No nutrition data found for {format(selectedDate, 'MMMM d, yyyy')}
                            </p>
                            <Button
                                onClick={() => handleAddFood('breakfast')}
                                className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)]"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Start Tracking
                            </Button>
                        </div>
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
                </div>
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