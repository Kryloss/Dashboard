"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { isOnSubdomain } from "@/lib/subdomains"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Search, Filter, Dumbbell, Footprints, Heart, Bike, Plus, Moon, Calendar as CalendarIcon, Trash2, Coffee, Sandwich, ChefHat, Cookie, Flame } from "lucide-react"

// Workout related imports
import { WorkoutStorage, WorkoutActivity } from "@/lib/workout-storage"
import { UserDataStorage, SleepData } from "@/lib/user-data-storage"
import { GoalProgressCalculator } from "@/lib/goal-progress"

// Nutrition related imports
import { NutritionStorage, NutritionEntry, Food } from "@/lib/nutrition-storage"

import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"

// Component imports
import { ActivityCard } from "./components/activity-card"
import { ActivityEditModal } from "./components/activity-edit-modal"
import { DeleteConfirmDialog } from "./components/delete-confirm-dialog"
import { SleepCard } from "./components/sleep-card"
import { SleepEditModal } from "./components/sleep-edit-modal"
import { SleepDeleteConfirmDialog } from "./components/sleep-delete-confirm-dialog"
import { AddFoodDialog } from "../nutrition/components/add-food-dialog"

import { format, subDays, addDays } from "date-fns"

export default function HistoryPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading, supabase } = useAuth()
    const notifications = useNotifications()

    // General state
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)
    const [activeTab, setActiveTab] = useState("workouts")

    // Workout related state
    const [activities, setActivities] = useState<WorkoutActivity[]>([])
    const [isWorkoutLoading, setIsWorkoutLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [editingActivity, setEditingActivity] = useState<WorkoutActivity | null>(null)
    const [deletingActivity, setDeletingActivity] = useState<WorkoutActivity | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)
    const limit = 20

    // Sleep data state
    const [sleepData, setSleepData] = useState<SleepData[]>([])
    const [editingSleep, setEditingSleep] = useState<SleepData | null>(null)
    const [deletingSleep, setDeletingSleep] = useState<SleepData | null>(null)

    // Nutrition related state
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [nutritionEntry, setNutritionEntry] = useState<NutritionEntry | null>(null)
    const [isNutritionLoading, setIsNutritionLoading] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null)
    const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false)

    // Track if we've shown the sign-in notification to avoid duplicates
    const signInNotificationShownRef = useRef(false)

    // Initialize and check URL parameter for tab
    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        // Check URL parameter for active tab
        const tabParam = searchParams.get('tab')
        if (tabParam && ['workouts', 'sleep', 'nutrition'].includes(tabParam)) {
            setActiveTab(tabParam)
        }

        const initializeWithDelay = setTimeout(() => {
            if (!user || !supabase) {
                if (!loading && user === null && !signInNotificationShownRef.current) {
                    signInNotificationShownRef.current = true
                    notifications.warning('Sign in required', {
                        description: 'Please sign in to view history',
                        duration: 4000,
                        action: {
                            label: 'Sign In',
                            onClick: () => router.push('/auth/signin')
                        }
                    })
                }
                return
            }

            if (onHealss && user && supabase) {
                // Initialize storage systems
                WorkoutStorage.initialize(user, supabase)
                UserDataStorage.initialize(user, supabase)
                NutritionStorage.initialize(user, supabase)

                // Load workout and sleep data
                loadWorkoutData()
            }
        }, 1000)

        return () => clearTimeout(initializeWithDelay)
    }, [user, loading, supabase, notifications, router])

    // Load workout data
    const loadWorkoutData = async () => {
        if (!user || !supabase) return

        try {
            setIsWorkoutLoading(true)
            setOffset(0)
            setActivities([])
            setSleepData([])

            const type = filterType === "all" ? undefined : filterType as 'strength' | 'running' | 'yoga' | 'cycling'
            const workoutPromise = WorkoutStorage.getWorkoutActivities(limit, 0, type)

            const endDate = GoalProgressCalculator.getTodayDateString()
            const startDate = (() => {
                const date = new Date()
                date.setDate(date.getDate() - 30)
                return GoalProgressCalculator.getLocalDateString(date)
            })()
            const sleepPromise = UserDataStorage.getSleepDataRange(startDate, endDate)

            const [newActivities, sleepHistory] = await Promise.all([
                workoutPromise,
                sleepPromise
            ])

            setActivities(newActivities)
            setOffset(limit)
            setHasMore(newActivities.length === limit)
            setSleepData(sleepHistory)

        } catch (error) {
            console.error('Error loading workout data:', error)
            notifications.error('Load failed', {
                description: 'Could not load workout history data'
            })
        } finally {
            setIsWorkoutLoading(false)
        }
    }

    // Load nutrition data for selected date
    useEffect(() => {
        const loadNutritionData = async () => {
            if (!user || !supabase || activeTab !== "nutrition") return

            const dateString = format(selectedDate, 'yyyy-MM-dd')
            setIsNutritionLoading(true)

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
                setIsNutritionLoading(false)
            }
        }

        loadNutritionData()
    }, [selectedDate, user, supabase, notifications, activeTab])

    // Reload data when filter changes
    useEffect(() => {
        if (user && supabase && activeTab === "workouts") {
            loadWorkoutData()
        }
    }, [filterType, user, supabase, activeTab])

    const loadMoreActivities = async () => {
        if (!user || !supabase || isWorkoutLoading) return

        try {
            setIsWorkoutLoading(true)
            const type = filterType === "all" ? undefined : filterType as 'strength' | 'running' | 'yoga' | 'cycling'
            const newActivities = await WorkoutStorage.getWorkoutActivities(limit, offset, type)

            setActivities(prev => [...prev, ...newActivities])
            setOffset(prev => prev + limit)
            setHasMore(newActivities.length === limit)
        } catch (error) {
            console.error('Error loading more activities:', error)
            notifications.error('Load failed', {
                description: 'Could not load more activities'
            })
        } finally {
            setIsWorkoutLoading(false)
        }
    }

    const handleUpdateActivity = async (updatedActivity: WorkoutActivity) => {
        try {
            await WorkoutStorage.updateWorkoutActivity(updatedActivity.id, {
                name: updatedActivity.name,
                exercises: updatedActivity.exercises,
                durationSeconds: updatedActivity.durationSeconds,
                notes: updatedActivity.notes
            })

            setActivities(prev => prev.map(activity =>
                activity.id === updatedActivity.id ? updatedActivity : activity
            ))

            setEditingActivity(null)
            notifications.success('Activity updated', {
                description: 'Changes saved successfully',
                duration: 3000
            })
        } catch (error) {
            console.error('Error updating activity:', error)
            notifications.error('Update failed', {
                description: 'Could not save changes'
            })
        }
    }

    const handleDeleteActivity = async (activity: WorkoutActivity) => {
        try {
            await WorkoutStorage.deleteWorkoutActivity(activity.id)
            setActivities(prev => prev.filter(a => a.id !== activity.id))
            setDeletingActivity(null)

            notifications.success('Activity deleted', {
                description: 'Workout removed from history',
                duration: 3000
            })
        } catch (error) {
            console.error('Error deleting activity:', error)
            notifications.error('Delete failed', {
                description: 'Could not remove activity'
            })
        }
    }

    const handleUpdateSleep = async (updatedSleep: SleepData) => {
        try {
            await UserDataStorage.saveSleepData(updatedSleep)
            setSleepData(prev => prev.map(sleep =>
                sleep.date === updatedSleep.date ? updatedSleep : sleep
            ))
            setEditingSleep(null)

            notifications.success('Sleep updated', {
                description: 'Sleep data saved successfully',
                duration: 3000
            })
        } catch (error) {
            console.error('Error updating sleep:', error)
            notifications.error('Update failed', {
                description: 'Could not save sleep data'
            })
        }
    }

    const handleDeleteSleep = async (sleep: SleepData) => {
        try {
            await UserDataStorage.deleteSleepData(sleep.id, sleep.date)
            setSleepData(prev => prev.filter(s => s.date !== sleep.date))
            setDeletingSleep(null)

            notifications.success('Sleep deleted', {
                description: 'Sleep data removed',
                duration: 3000
            })
        } catch (error) {
            console.error('Error deleting sleep:', error)
            notifications.error('Delete failed', {
                description: 'Could not remove sleep data'
            })
        }
    }

    // Nutrition helper functions
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

            const adjustedCalories = Math.round(food.caloriesPerServing * quantity)
            const adjustedMacros = {
                carbs: food.macros.carbs * quantity,
                protein: food.macros.protein * quantity,
                fats: food.macros.fats * quantity,
                fiber: (food.macros.fiber || 0) * quantity,
                sugar: (food.macros.sugar || 0) * quantity,
                sodium: (food.macros.sodium || 0) * quantity
            }

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

            let meal = currentEntry.meals.find(m => m.type === selectedMealType)
            if (!meal) {
                meal = NutritionStorage.createEmptyMeal(selectedMealType)
                currentEntry.meals.push(meal)
            }

            meal.foods.push(foodEntry)

            const mealTotals = NutritionStorage.calculateMealTotals(meal)
            meal.totalCalories = mealTotals.calories
            meal.totalMacros = mealTotals.macros

            currentEntry.totalCalories = currentEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            currentEntry.totalMacros = {
                carbs: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            const savedEntry = await NutritionStorage.saveNutritionEntry(currentEntry)
            setNutritionEntry(savedEntry)
            closeAddFoodDialog()

            notifications.success('Food added', {
                description: 'Food added to your nutrition log',
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
        if (!nutritionEntry || !user) return

        try {
            const updatedEntry = { ...nutritionEntry }
            const meal = updatedEntry.meals.find(m => m.type === mealType)

            if (!meal) return

            meal.foods = meal.foods.filter(f => f.id !== foodEntryId)

            const mealTotals = NutritionStorage.calculateMealTotals(meal)
            meal.totalCalories = mealTotals.calories
            meal.totalMacros = mealTotals.macros

            updatedEntry.totalCalories = updatedEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            updatedEntry.totalMacros = {
                carbs: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            const savedEntry = await NutritionStorage.saveNutritionEntry(updatedEntry)
            setNutritionEntry(savedEntry)

            notifications.success('Food removed', {
                description: 'Food removed from your nutrition log',
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

    // Helper functions for workout display
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    const getWorkoutIcon = (type: string) => {
        switch (type) {
            case 'strength': return <Dumbbell className="w-5 h-5" />
            case 'running': return <Footprints className="w-5 h-5" />
            case 'yoga': return <Heart className="w-5 h-5" />
            case 'cycling': return <Bike className="w-5 h-5" />
            default: return <Dumbbell className="w-5 h-5" />
        }
    }

    const getWorkoutColor = (type: string) => {
        switch (type) {
            case 'strength': return 'text-[#9BE15D]'
            case 'running': return 'text-[#FF2D55]'
            case 'yoga': return 'text-[#2BD2FF]'
            case 'cycling': return 'text-[#FF375F]'
            default: return 'text-[#9BE15D]'
        }
    }

    // Filter activities based on search query
    const filteredActivities = activities.filter(activity => {
        const matchesSearch = searchQuery === "" ||
            activity.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.workoutType.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = filterType === "all" || activity.workoutType === filterType

        return matchesSearch && matchesFilter
    })

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

    // Check if on healss subdomain
    if (!isHealssSubdomain) {
        return (
            <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#F3F4F6] mb-4">Page Not Found</h1>
                    <p className="text-[#A1A1AA]">This page is only available on the healss subdomain.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6] relative overflow-hidden">
            {/* Hero Gradient Orb Background */}
            <div className="absolute inset-0 opacity-80">
                <div
                    className="hidden md:block absolute inset-0"
                    style={{
                        background: "radial-gradient(60% 60% at 60% 30%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                    }}
                />
                <div
                    className="block md:hidden absolute inset-0"
                    style={{
                        background: "radial-gradient(80% 80% at 50% 40%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="container mx-auto max-w-7xl px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => router.back()}
                                variant="ghost"
                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <h1 className="text-2xl font-bold text-[#F3F4F6]">History</h1>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                        <TabsList className="grid w-full grid-cols-3 bg-[#121318] border border-[#212227] rounded-lg">
                            <TabsTrigger
                                value="workouts"
                                className="data-[state=active]:bg-[#2A8CEA] data-[state=active]:text-white text-[#A1A1AA] hover:text-[#F3F4F6]"
                            >
                                <Dumbbell className="w-4 h-4 mr-2" />
                                Workouts
                            </TabsTrigger>
                            <TabsTrigger
                                value="sleep"
                                className="data-[state=active]:bg-[#2A8CEA] data-[state=active]:text-white text-[#A1A1AA] hover:text-[#F3F4F6]"
                            >
                                <Moon className="w-4 h-4 mr-2" />
                                Sleep
                            </TabsTrigger>
                            <TabsTrigger
                                value="nutrition"
                                className="data-[state=active]:bg-[#2A8CEA] data-[state=active]:text-white text-[#A1A1AA] hover:text-[#F3F4F6]"
                            >
                                <Flame className="w-4 h-4 mr-2" />
                                Nutrition
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="workouts" className="mt-6">
                            {/* Workout Filters */}
                            <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] w-4 h-4" />
                                            <Input
                                                placeholder="Search workouts..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#A1A1AA]"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-48">
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6]">
                                                <Filter className="w-4 h-4 mr-2" />
                                                <SelectValue placeholder="Filter by type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#121318] border-[#212227]">
                                                <SelectItem value="all">All Workouts</SelectItem>
                                                <SelectItem value="strength">Strength</SelectItem>
                                                <SelectItem value="running">Running</SelectItem>
                                                <SelectItem value="yoga">Yoga</SelectItem>
                                                <SelectItem value="cycling">Cycling</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Workout Activities List */}
                            {isWorkoutLoading && activities.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2BD2FF]"></div>
                                </div>
                            ) : filteredActivities.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Dumbbell className="w-8 h-8 text-[#A1A1AA]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#F3F4F6] mb-2">No workouts found</h3>
                                    <p className="text-[#A1A1AA] mb-6">
                                        {searchQuery || filterType !== "all"
                                            ? "Try adjusting your search or filters"
                                            : "Complete your first workout to see it here"
                                        }
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {filteredActivities.map((activity) => (
                                            <ActivityCard
                                                key={activity.id}
                                                activity={activity}
                                                onEdit={() => setEditingActivity(activity)}
                                                onDelete={() => setDeletingActivity(activity)}
                                                formatDuration={formatDuration}
                                                getWorkoutIcon={getWorkoutIcon}
                                                getWorkoutColor={getWorkoutColor}
                                            />
                                        ))}
                                    </div>

                                    {hasMore && !isWorkoutLoading && (
                                        <div className="flex justify-center mt-8">
                                            <Button
                                                onClick={loadMoreActivities}
                                                variant="ghost"
                                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                            >
                                                Load More
                                            </Button>
                                        </div>
                                    )}

                                    {isWorkoutLoading && activities.length > 0 && (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2BD2FF]"></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="sleep" className="mt-6">
                            {/* Sleep Data List */}
                            {isWorkoutLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2BD2FF]"></div>
                                </div>
                            ) : sleepData.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Moon className="w-8 h-8 text-[#A1A1AA]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#F3F4F6] mb-2">No sleep data found</h3>
                                    <p className="text-[#A1A1AA] mb-6">Start logging your sleep to see it here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sleepData.map((sleep) => (
                                        <SleepCard
                                            key={sleep.date}
                                            sleepData={sleep}
                                            onEdit={() => setEditingSleep(sleep)}
                                            onDelete={() => setDeletingSleep(sleep)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="nutrition" className="mt-6">
                            {/* Date Navigation */}
                            <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                                <div className="flex items-center justify-between">
                                    <Button
                                        onClick={() => navigateDate('prev')}
                                        variant="ghost"
                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                    >
                                        ← Previous
                                    </Button>

                                    <div className="flex items-center space-x-4">
                                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                                >
                                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                                    {format(selectedDate, 'MMM d, yyyy')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0 bg-[#121318] border-[#212227]"
                                                align="center"
                                                side="bottom"
                                                sideOffset={8}
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={handleDateSelect}
                                                    disabled={(date) => date > new Date()}
                                                    initialFocus
                                                    className="bg-[#121318] text-[#F3F4F6]"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Button
                                        onClick={() => navigateDate('next')}
                                        variant="ghost"
                                        disabled={format(selectedDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}
                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next →
                                    </Button>
                                </div>
                            </div>

                            {/* Nutrition Summary */}
                            {nutritionEntry && (
                                <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                                    <h3 className="text-lg font-semibold text-[#F3F4F6] mb-4">Daily Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-[#F3F4F6]">{nutritionEntry.totalCalories}</div>
                                            <div className="text-sm text-[#A1A1AA]">Calories</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-[#FFA500]">{Math.round(nutritionEntry.totalMacros.carbs)}g</div>
                                            <div className="text-sm text-[#A1A1AA]">Carbs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-[#FF6B6B]">{Math.round(nutritionEntry.totalMacros.protein)}g</div>
                                            <div className="text-sm text-[#A1A1AA]">Protein</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-[#4ECDC4]">{Math.round(nutritionEntry.totalMacros.fats)}g</div>
                                            <div className="text-sm text-[#A1A1AA]">Fats</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Nutrition Data */}
                            {isNutritionLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2BD2FF]"></div>
                                </div>
                            ) : !nutritionEntry ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Flame className="w-8 h-8 text-[#A1A1AA]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#F3F4F6] mb-2">No nutrition data</h3>
                                    <p className="text-[#A1A1AA] mb-6">No food was logged on {format(selectedDate, 'MMM d, yyyy')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                                        const meal = nutritionEntry.meals.find(m => m.type === mealType)
                                        const mealName = getMealDisplayName(mealType)

                                        return (
                                            <div key={mealType} className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                                                <div className="flex items-center justify-between mb-3">
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
                                                    <Button
                                                        onClick={() => handleAddFood(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks')}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-7 h-7"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {meal ? (
                                                    <div className="space-y-2">
                                                        {meal.foods.map((food, index) => (
                                                            <div key={index} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)] group">
                                                                <div>
                                                                    <p className="text-sm text-[#F3F4F6]">{food.food.name}</p>
                                                                    <p className="text-xs text-[#7A7F86]">{food.adjustedCalories} cal</p>
                                                                </div>
                                                                <Button
                                                                    onClick={() => handleDeleteFood(mealType, food.id)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-6 h-6 text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
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
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Edit Activity Modal */}
            {editingActivity && (
                <ActivityEditModal
                    activity={editingActivity}
                    onClose={() => setEditingActivity(null)}
                    onSave={handleUpdateActivity}
                />
            )}

            {/* Delete Activity Confirmation */}
            {deletingActivity && (
                <DeleteConfirmDialog
                    activity={deletingActivity}
                    onCancel={() => setDeletingActivity(null)}
                    onConfirm={() => handleDeleteActivity(deletingActivity)}
                />
            )}

            {/* Sleep Edit Modal */}
            {editingSleep && (
                <SleepEditModal
                    sleepData={editingSleep}
                    onClose={() => setEditingSleep(null)}
                    onSave={handleUpdateSleep}
                />
            )}

            {/* Sleep Delete Confirmation */}
            {deletingSleep && (
                <SleepDeleteConfirmDialog
                    sleepData={deletingSleep}
                    onCancel={() => setDeletingSleep(null)}
                    onConfirm={() => handleDeleteSleep(deletingSleep)}
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
        </div>
    )
}