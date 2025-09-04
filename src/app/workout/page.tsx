"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isOnSubdomain } from "@/lib/subdomains"
import { Button } from "@/components/ui/button"
import { GoalRings } from "./components/goal-rings"
import { PlannedWorkoutCard } from "./components/planned-workout-card"
import { QuickActionCard } from "./components/quick-action-card"
import { StatCard } from "./components/stat-card"

import { WorkoutTypeDialog } from "./components/workout-type-dialog"
import { ActivityEditModal } from "./history/components/activity-edit-modal"
import { WorkoutStorage, OngoingWorkout, WorkoutActivity } from "@/lib/workout-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { Settings, Plus, Flame, Dumbbell, User, Timer, Bike, TrendingUp, Clock, Heart, FileText, Play, Edit3, Trash2, Moon, Footprints } from "lucide-react"

export default function WorkoutPage() {
    const router = useRouter()
    const { user, supabase } = useAuth()
    const notifications = useNotifications()
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)
    const [showWorkoutDialog, setShowWorkoutDialog] = useState(false)
    const [showQuickLogWorkoutDialog, setShowQuickLogWorkoutDialog] = useState(false)
    const [ongoingWorkout, setOngoingWorkout] = useState<OngoingWorkout | null>(null)
    const [recentActivities, setRecentActivities] = useState<WorkoutActivity[]>([])
    const [isLoadingActivities, setIsLoadingActivities] = useState(true)
    const [liveWorkoutTime, setLiveWorkoutTime] = useState(0)
    const [editingActivity, setEditingActivity] = useState<WorkoutActivity | null>(null)




    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        // Add delay to allow auth state to settle
        const initializeWithDelay = setTimeout(() => {
            if (onHealss) {
                if (user && supabase) {
                    // Initialize storage with user context
                    WorkoutStorage.initialize(user, supabase)

                    // Check if this is a new user and show welcome message
                    const showWelcomeIfNewUser = () => {
                        const hasSeenWelcome = localStorage.getItem('workout-welcome-shown')
                        if (!hasSeenWelcome) {
                            notifications.success('Welcome to Workouts!', {
                                description: 'Start your first workout below',
                                duration: 6000,
                                action: {
                                    label: 'Get Started',
                                    onClick: () => setShowWorkoutDialog(true)
                                }
                            })
                            localStorage.setItem('workout-welcome-shown', 'true')
                        }
                    }

                    // Load initial data
                    const loadInitialData = async () => {
                        // Load ongoing workout
                        try {
                            const workout = await WorkoutStorage.getOngoingWorkout()
                            setOngoingWorkout(workout)

                            // Initialize live workout time
                            if (workout?.isRunning) {
                                const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                                setLiveWorkoutTime(backgroundElapsedTime)

                                // Notify user that workout is running in background
                                if (backgroundElapsedTime > workout.elapsedTime + 30) { // If significantly more time has passed
                                    notifications.info('Timer running', {
                                        description: 'Workout continued in background',
                                        action: {
                                            label: 'Resume',
                                            onClick: () => router.push(`/workout/${workout.type}/${workout.workoutId}`)
                                        }
                                    })
                                } else {
                                    // Show background feature tip for first time users
                                    const hasSeenBackgroundTip = localStorage.getItem('background-tip-shown')
                                    if (!hasSeenBackgroundTip && workout.isRunning) {
                                        setTimeout(() => {
                                            notifications.info('Feature tip', {
                                                description: 'Workouts continue timing in background',
                                                duration: 4000
                                            })
                                            localStorage.setItem('background-tip-shown', 'true')
                                        }, 1500)
                                    }
                                }
                            } else if (workout) {
                                setLiveWorkoutTime(workout.elapsedTime)
                            }
                        } catch (error) {
                            console.error('Error loading ongoing workout:', error)
                            notifications.error('Load failed', {
                                description: 'Could not retrieve workout'
                            })
                        }

                        // Load recent activities
                        try {
                            setIsLoadingActivities(true)
                            const activities = await WorkoutStorage.getRecentActivities(3)
                            setRecentActivities(activities)
                        } catch (error) {
                            console.error('Error loading recent activities:', error)
                            notifications.error('Load failed', {
                                description: 'Could not get activity history'
                            })
                        } finally {
                            setIsLoadingActivities(false)
                        }
                    }

                    loadInitialData()

                    // Show welcome message after initial load completes
                    setTimeout(showWelcomeIfNewUser, 1000)

                    // Set up periodic check for ongoing workout updates only
                    const interval = setInterval(async () => {
                        try {
                            const workout = await WorkoutStorage.getOngoingWorkout()
                            setOngoingWorkout(workout)

                            // If workout is running, calculate live time
                            if (workout?.isRunning) {
                                const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                                setLiveWorkoutTime(backgroundElapsedTime)
                            } else if (workout) {
                                setLiveWorkoutTime(workout.elapsedTime)
                            }
                        } catch (error) {
                            console.error('Error loading ongoing workout:', error)
                        }

                        // Only refresh activities occasionally to avoid excessive calls
                        if (Math.random() < 0.1) { // 10% chance every 30 seconds = ~every 5 minutes
                            try {
                                const activities = await WorkoutStorage.getRecentActivities(3)
                                setRecentActivities(activities)
                            } catch (error) {
                                console.error('Error loading recent activities:', error)
                            }
                        }
                    }, 30000) // Check every 30 seconds

                    return () => clearInterval(interval)
                } else if (user === null) {
                    // Only show sign-in notification if user is explicitly null (not loading)
                    // and we haven't shown it recently
                    const lastSigninNotification = localStorage.getItem('last-signin-notification')
                    const now = Date.now()

                    if (!lastSigninNotification || now - parseInt(lastSigninNotification) > 300000) { // 5 minutes
                        notifications.warning('Sign in required', {
                            description: 'Please sign in to access workouts',
                            duration: 4000,
                            action: {
                                label: 'Sign In',
                                onClick: () => router.push('/auth/signin')
                            }
                        })
                        localStorage.setItem('last-signin-notification', now.toString())
                    }
                }
            }
        }, 2000) // 2 second delay to allow auth to settle

        return () => {
            clearTimeout(initializeWithDelay)
        }
    }, [user, supabase, notifications, router])

    // Real-time timer effect for ongoing workouts
    useEffect(() => {
        let timerInterval: NodeJS.Timeout | null = null

        if (ongoingWorkout?.isRunning) {
            // Update timer every second when workout is running
            timerInterval = setInterval(() => {
                const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                setLiveWorkoutTime(backgroundElapsedTime)
            }, 1000)
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval)
            }
        }
    }, [ongoingWorkout?.isRunning])



    // Helper function to format time (minutes:seconds)
    const formatWorkoutTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    // Helper function to format activity data for ActivityItem component
    const formatActivityDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return "Today"
        if (diffDays === 2) return "Yesterday"
        if (diffDays <= 7) return `${diffDays - 1} days ago`

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }

    const formatActivityDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes} min`
    }



    // Mock data for demonstration
    const mockData = {
        goals: {
            recovery: 0.75, // 75% of recovery goal (sleep + breaks)
            nutrition: 0.62, // 62% of nutrition goal (calories + macros)
            exercise: 0.83  // 83% of exercise goal (activities + plan adherence)
        },
        streak: 7, // 7 day streak
        goalDetails: {
            recovery: {
                sleep: { current: 7.2, target: 8.0 }, // hours
                breaks: { current: 45, target: 60 }   // minutes
            },
            nutrition: {
                calories: { consumed: 1847, burned: 420, target: 2000 },
                macros: {
                    carbs: { current: 180, target: 250 },
                    protein: { current: 95, target: 120 },
                    fats: { current: 65, target: 80 }
                }
            },
            exercise: {
                completed: 3,
                planned: 4,
                extras: 1, // bonus activities
                duration: 85 // minutes
            }
        },
        plannedWorkouts: [
            {
                id: 1,
                icon: <Footprints className="w-5 h-5" />,
                name: "Morning Run",
                duration: "30 min",
                time: "6:00 AM"
            },
            {
                id: 2,
                icon: <Dumbbell className="w-5 h-5" />,
                name: "Strength Training",
                duration: "45 min",
                time: "5:00 PM"
            },
            {
                id: 3,
                icon: <Heart className="w-5 h-5" />,
                name: "Start Yoga",
                duration: "25 min",
                time: "7:30 AM"
            }
        ],
        recentActivity: [
            { date: "Yesterday", name: "Upper Body Strength", duration: "45 min", progress: 1.0 },
            { date: "2 days ago", name: "Morning Run", duration: "32 min", progress: 0.8 },
            { date: "3 days ago", name: "Yoga Flow", duration: "28 min", progress: 0.7 }
        ],
        weeklyStats: [
            {
                icon: <Flame className="w-4 h-4" />,
                label: "Total Calories",
                value: "8,340",
                change: { value: "12%", direction: "up" as const }
            },
            {
                icon: <Clock className="w-4 h-4" />,
                label: "Workout Time",
                value: "4h 23m",
                change: { value: "8%", direction: "up" as const }
            },
            {
                icon: <Dumbbell className="w-4 h-4" />,
                label: "Sessions",
                value: "12",
                change: { value: "3", direction: "up" as const }
            }
        ]
    }

    const handleStartWorkout = (id: number) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to start workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        // Get workout name from mockData
        const workout = mockData.plannedWorkouts.find(w => w.id === id)
        const workoutName = workout?.name || 'Workout'

        if (id === 2) { // Strength Training workout
            handleQuickAction('strength')
        } else {
            // All other planned workouts show coming soon
            notifications.info('Planned workouts', {
                description: `${workoutName} feature coming soon!`,
                duration: 3000
            })
        }
        console.log(`Starting workout ${id}`)
    }

    const handleEditWorkout = (id: number) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to edit workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            return
        }

        notifications.info('Edit workouts', {
            description: 'Workout editing feature coming soon!',
            duration: 3000
        })
        console.log(`Editing workout ${id}`)
    }


    const handleQuickAction = async (action: string) => {
        if (!user || !supabase) {
            // Only show on user action, with rate limiting
            const lastActionNotification = localStorage.getItem('last-action-notification')
            const now = Date.now()

            if (!lastActionNotification || now - parseInt(lastActionNotification) > 30000) { // 30 seconds
                notifications.warning('Sign in required', {
                    description: 'Create an account to start workouts',
                    duration: 4000,
                    action: {
                        label: 'Sign In',
                        onClick: () => router.push('/auth/signin')
                    }
                })
                localStorage.setItem('last-action-notification', now.toString())
            }
            return
        }

        if (action === 'strength') {
            try {

                // Check if there's an existing ongoing workout
                const existingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (existingWorkout) {
                    // Clear existing workout
                    await WorkoutStorage.clearOngoingWorkout()
                    setOngoingWorkout(null)
                }

                // Create new workout and navigate to it
                const timestamp = Date.now()
                const userIdSuffix = user?.id ? user.id.slice(-8) : Math.random().toString(36).slice(-8)
                const workoutId = `strength-${timestamp}-${userIdSuffix}`
                const newWorkout = WorkoutStorage.createWorkout('strength', workoutId)
                await WorkoutStorage.saveOngoingWorkout(newWorkout)

                notifications.success('Workout started', {
                    description: 'Ready to train!',
                    duration: 3000
                })

                // Show timer tip for new users
                const hasSeenTimerTip = localStorage.getItem('timer-tip-shown')
                if (!hasSeenTimerTip) {
                    setTimeout(() => {
                        notifications.info('Timer tip', {
                            description: 'Use play/pause to track workout time',
                            duration: 4000
                        })
                        localStorage.setItem('timer-tip-shown', 'true')
                    }, 3000)
                }

                window.location.href = `/workout/strength/${workoutId}`
            } catch (error) {
                console.error('Error starting workout:', error)
                notifications.error('Start failed', {
                    description: 'Could not create workout',
                    duration: 5000
                })
            } finally {
                // Loading state handled
            }
        } else if (action === 'quick-log') {
            setShowQuickLogWorkoutDialog(true)
        } else if (action === 'sleep') {
            console.log(`Quick action: ${action}`)
            // TODO: Implement sleep tracking functionality
            notifications.info('Sleep tracking', {
                description: 'Sleep tracking feature coming soon!',
                duration: 3000
            })
        } else if (action === 'running') {
            console.log(`Quick action: ${action}`)
            notifications.info('Running workouts', {
                description: 'Running workout feature coming soon!',
                duration: 3000
            })
        } else if (action === 'yoga') {
            console.log(`Quick action: ${action}`)
            notifications.info('Yoga workouts', {
                description: 'Yoga workout feature coming soon!',
                duration: 3000
            })
        } else if (action === 'cycling') {
            console.log(`Quick action: ${action}`)
            notifications.info('Cycling workouts', {
                description: 'Cycling workout feature coming soon!',
                duration: 3000
            })
        } else if (action === 'timer') {
            console.log(`Quick action: ${action}`)
            notifications.info('Timer workouts', {
                description: 'Timer workout feature coming soon!',
                duration: 3000
            })
        } else {
            console.log(`Quick action: ${action}`)
            setShowWorkoutDialog(true)
        }
    }

    const handleDeleteActivity = async (activity: WorkoutActivity) => {
        if (!user) return

        try {
            await WorkoutStorage.deleteWorkoutActivity(activity.id)
            setRecentActivities(prev => prev.filter(a => a.id !== activity.id))

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

    const handleUpdateActivity = async (updatedActivity: WorkoutActivity) => {
        if (!user) return

        // Optimistic update - update UI immediately
        const optimisticUpdate = {
            ...updatedActivity,
            updatedAt: new Date().toISOString()
        }

        setRecentActivities(prev => prev.map(a =>
            a.id === updatedActivity.id ? optimisticUpdate : a
        ))

        // Close modal immediately for better UX
        setEditingActivity(null)

        try {
            // Background update to database
            await WorkoutStorage.updateWorkoutActivity(updatedActivity.id, {
                name: updatedActivity.name,
                exercises: updatedActivity.exercises,
                durationSeconds: updatedActivity.durationSeconds,
                notes: updatedActivity.notes
            })

            notifications.success('Activity updated', {
                description: 'Changes saved successfully',
                duration: 3000
            })
        } catch (error) {
            console.error('Error updating activity:', error)

            notifications.error('Update failed', {
                description: 'Could not save changes'
            })

            // Revert optimistic update on error
            setRecentActivities(prev => prev.map(a =>
                a.id === updatedActivity.id ? updatedActivity : a
            ))
        }
    }

    // If we're on healss.kryloss.com, show healss content
    if (isHealssSubdomain) {
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
                    <div className="container mx-auto max-w-7xl px-6 py-8">
                        {/* Daily Goals Section */}
                        <section className="mb-12">
                            <div className="flex items-center justify-end mb-6">
                                <Button
                                    variant="ghost"
                                    className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Goal Settings
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                <div className="flex flex-col items-center lg:items-start">
                                    <div className="flex justify-center lg:justify-start">
                                        <GoalRings
                                            size="lg"
                                            recoveryProgress={mockData.goals.recovery}
                                            nutritionProgress={mockData.goals.nutrition}
                                            exerciseProgress={mockData.goals.exercise}
                                            streak={mockData.streak}
                                        />
                                    </div>
                                    
                                    {/* Ring Legend */}
                                    <div className="mt-6 space-y-3 max-w-sm">
                                        {/* Recovery Legend */}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#2BD2FF] to-[#4FC3F7]"></div>
                                            <span className="text-xs text-[#A1A1AA]">Recovery: Sleep + Breaks</span>
                                        </div>
                                        
                                        {/* Nutrition Legend */}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#00E676] to-[#8BC34A]"></div>
                                            <span className="text-xs text-[#A1A1AA]">Nutrition: Calories + Macros + Burned</span>
                                        </div>
                                        
                                        {/* Exercise Legend */}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]"></div>
                                            <span className="text-xs text-[#A1A1AA]">Exercise: Activities + Extras + Plan</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold text-[#F3F4F6] mb-4">Today&apos;s Summary</h2>

                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Recovery Summary */}
                                        <div className="p-3 bg-[#121318] border border-[#212227] rounded-[16px] hover:border-[#2A2B31] transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] rounded-[8px] flex items-center justify-center">
                                                        <Moon className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-[#F3F4F6] font-medium text-sm">Recovery</span>
                                                </div>
                                                <span className="text-[#2BD2FF] text-sm font-semibold">{Math.round(mockData.goals.recovery * 100)}%</span>
                                            </div>
                                        </div>

                                        {/* Nutrition Summary */}
                                        <div className="p-3 bg-[#121318] border border-[#212227] rounded-[16px] hover:border-[#2A2B31] transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-[#9BE15D] to-[#00E676] rounded-[8px] flex items-center justify-center">
                                                        <Flame className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-[#F3F4F6] font-medium text-sm">Nutrition</span>
                                                </div>
                                                <span className="text-[#9BE15D] text-sm font-semibold">{Math.round(mockData.goals.nutrition * 100)}%</span>
                                            </div>
                                        </div>

                                        {/* Exercise Summary */}
                                        <div className="p-3 bg-[#121318] border border-[#212227] rounded-[16px] hover:border-[#2A2B31] transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-[#FF2D55] to-[#FF375F] rounded-[8px] flex items-center justify-center">
                                                        <Dumbbell className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-[#F3F4F6] font-medium text-sm">Exercise</span>
                                                </div>
                                                <span className="text-[#FF2D55] text-sm font-semibold">{Math.round(mockData.goals.exercise * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 text-xs text-[#7A7F86] text-center">
                                        Click cards for detailed breakdown
                                    </div>

                                </div>
                            </div>
                        </section>

                        {/* Today's Activity Section */}
                        <section className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-[#F3F4F6]">Today&apos;s Activity</h2>
                                <div className="flex items-center space-x-3">
                                    <Button
                                        onClick={() => {
                                            if (!user) {
                                                notifications.warning('Sign in required', {
                                                    description: 'Please sign in to log workouts',
                                                    duration: 4000,
                                                    action: {
                                                        label: 'Sign In',
                                                        onClick: () => router.push('/auth/signin')
                                                    }
                                                })
                                                return
                                            }
                                            handleQuickAction('quick-log')
                                        }}
                                        className="bg-gradient-to-r from-[#6B7280] via-[#4B5563] to-[#374151] text-white rounded-full border border-[rgba(107,114,128,0.35)] shadow-[0_8px_32px_rgba(107,114,128,0.28)] hover:shadow-[0_10px_40px_rgba(107,114,128,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Log Workout
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (!user) {
                                                notifications.warning('Sign in required', {
                                                    description: 'Please sign in to start workouts',
                                                    duration: 4000,
                                                    action: {
                                                        label: 'Sign In',
                                                        onClick: () => router.push('/auth/signin')
                                                    }
                                                })
                                                return
                                            }
                                            setShowWorkoutDialog(true)
                                        }}
                                        className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Workout
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {/* Ongoing Workout Card */}
                                {ongoingWorkout && (
                                    <div className="bg-gradient-to-br from-[#2A8CEA]/20 via-[#1659BF]/15 to-[#103E9A]/10 border-2 border-[#2A8CEA]/30 rounded-[20px] p-5 shadow-[inset_0_1px_0_rgba(42,140,234,0.15),_0_8px_32px_rgba(42,140,234,0.25)] relative overflow-hidden">
                                        {/* Pulse animation overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#2A8CEA]/5 to-transparent animate-pulse" />

                                        <div className="relative z-10">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-[#2A8CEA] to-[#1659BF] rounded-[14px] flex items-center justify-center shadow-lg">
                                                    <Play className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-[#F3F4F6] text-sm">Ongoing Workout</h3>
                                                        <div className="flex items-center space-x-1">
                                                            <div className={`w-2 h-2 rounded-full ${ongoingWorkout.isRunning ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                                                            <span className={`text-xs font-medium ${ongoingWorkout.isRunning ? 'text-green-400' : 'text-yellow-400'}`}>
                                                                {ongoingWorkout.isRunning ? 'Running' : 'Paused'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-[#A1A1AA] mt-1">
                                                        {ongoingWorkout.name || `${ongoingWorkout.type.charAt(0).toUpperCase() + ongoingWorkout.type.slice(1)} Workout`}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-2 text-xs text-[#9CA3AF]">
                                                        <div className="flex items-center space-x-1">
                                                            <Timer className="w-3 h-3" />
                                                            <span>{formatWorkoutTime(liveWorkoutTime)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Dumbbell className="w-3 h-3" />
                                                            <span>{ongoingWorkout.exercises?.length || 0} exercises</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all text-sm font-medium h-9"
                                                onClick={() => {
                                                    if (!user) {
                                                        notifications.warning('Sign in required', {
                                                            description: 'Please sign in to continue workouts',
                                                            duration: 4000,
                                                            action: {
                                                                label: 'Sign In',
                                                                onClick: () => router.push('/auth/signin')
                                                            }
                                                        })
                                                        return
                                                    }
                                                    window.location.href = `/workout/${ongoingWorkout.type}/${ongoingWorkout.workoutId}`
                                                }}
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Continue Workout
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {mockData.plannedWorkouts.map((workout) => (
                                    <PlannedWorkoutCard
                                        key={workout.id}
                                        icon={workout.icon}
                                        name={workout.name}
                                        duration={workout.duration}
                                        time={workout.time}
                                        onStart={() => handleStartWorkout(workout.id)}
                                        onEdit={() => handleEditWorkout(workout.id)}
                                    />
                                ))}

                            </div>
                        </section>

                        {/* Quick Actions Section */}
                        <section className="mb-12">
                            <h2 className="text-xl font-semibold text-[#F3F4F6] mb-6">Quick Actions</h2>

                            <div className="grid grid-cols-6 gap-4">
                                <QuickActionCard
                                    icon={<Footprints className="w-7 h-7" />}
                                    label="Running"
                                    onClick={() => handleQuickAction('running')}
                                />
                                <QuickActionCard
                                    icon={<Dumbbell className="w-7 h-7" />}
                                    label="Strength"
                                    onClick={() => handleQuickAction('strength')}
                                />
                                <QuickActionCard
                                    icon={<Heart className="w-7 h-7" />}
                                    label="Yoga"
                                    onClick={() => handleQuickAction('yoga')}
                                />
                                <QuickActionCard
                                    icon={<Bike className="w-7 h-7" />}
                                    label="Cycling"
                                    onClick={() => handleQuickAction('cycling')}
                                />
                                <QuickActionCard
                                    icon={<Timer className="w-7 h-7" />}
                                    label="Timer"
                                    onClick={() => handleQuickAction('timer')}
                                />
                                <QuickActionCard
                                    icon={<Moon className="w-7 h-7" />}
                                    label="Sleep"
                                    onClick={() => handleQuickAction('sleep')}
                                />
                            </div>
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                            {/* Recent Activity Section */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-[#F3F4F6]">Recent Activity</h2>
                                    <Button
                                        onClick={() => router.push('/workout/history')}
                                        variant="ghost"
                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full text-sm"
                                    >
                                        View All
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {isLoadingActivities ? (
                                        <>
                                            {Array.from({ length: 3 }, (_, index) => (
                                                <div
                                                    key={`loading-${index}`}
                                                    className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]"
                                                >
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        {/* Loading spinner instead of icon */}
                                                        <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2A8CEA]"></div>
                                                        </div>
                                                        {/* Loading placeholder for label */}
                                                        <div className="w-24 h-3 bg-[#2A2B31] rounded animate-pulse"></div>
                                                    </div>

                                                    <div className="mb-2">
                                                        {/* Loading placeholder for value */}
                                                        <div className="w-32 h-6 bg-[#2A2B31] rounded animate-pulse mb-1"></div>
                                                    </div>

                                                    {/* Loading placeholder for change text with extra spacing */}
                                                    <div className="mb-2">
                                                        <div className="w-20 h-3 bg-[#2A2B31] rounded animate-pulse"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : recentActivities.length === 0 ? (
                                        <div className="text-center py-8 text-[#A1A1AA]">
                                            <p className="mb-2">No workout activities yet</p>
                                            <p className="text-sm">Complete your first workout to see it here!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {recentActivities.map((activity) => {
                                                const getWorkoutIcon = (type: string) => {
                                                    switch (type) {
                                                        case 'strength': return <Dumbbell className="w-4 h-4" />
                                                        case 'running': return <Footprints className="w-4 h-4" />
                                                        case 'yoga': return <Heart className="w-4 h-4" />
                                                        case 'cycling': return <Bike className="w-4 h-4" />
                                                        default: return <Dumbbell className="w-4 h-4" />
                                                    }
                                                }

                                                const formatTime = (isoString: string) => {
                                                    const date = new Date(isoString)
                                                    return date.toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })
                                                }

                                                return (
                                                    <div key={activity.id} className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200 ease-out group">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-3 mb-2">
                                                                    <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center text-[#F3F4F6] text-sm">
                                                                        {getWorkoutIcon(activity.workoutType)}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-[#A1A1AA]">
                                                                        {activity.name || `${activity.workoutType.charAt(0).toUpperCase() + activity.workoutType.slice(1)} Workout`}
                                                                    </span>
                                                                </div>

                                                                <div className="mb-1">
                                                                    <div className="text-2xl font-bold text-[#F3F4F6] mb-1">
                                                                        {`${formatActivityDate(activity.completedAt)} • ${formatTime(activity.completedAt)}`}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center space-x-1 text-xs font-medium text-[#A1A1AA]">
                                                                    <span>→</span>
                                                                    <span>{`${formatActivityDuration(activity.durationSeconds)} • ${activity.exercises?.length || 0} exercises`}</span>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                <Button
                                                                    onClick={() => setEditingActivity(activity)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-7 h-7"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteActivity(activity)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-7 h-7"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {/* Empty placeholders to fill up to 3 activities */}
                                            {Array.from({ length: 3 - recentActivities.length }, (_, index) => (
                                                <div key={`placeholder-${index}`} className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] opacity-50">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-3 mb-2">
                                                                <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center text-[#F3F4F6] text-sm">
                                                                    <Dumbbell className="w-4 h-4 opacity-30" />
                                                                </div>
                                                                <span className="text-sm font-medium text-[#A1A1AA]">
                                                                    No recent activity
                                                                </span>
                                                            </div>

                                                            <div className="mb-2">
                                                                <div className="text-2xl font-bold text-[#F3F4F6] mb-1">
                                                                    —
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-1 text-xs font-medium text-[#A1A1AA]">
                                                                <span>→</span>
                                                                <span>Complete a workout to see it here</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* Weekly Stats and Health Log Section */}
                            <section>
                                <h2 className="text-xl font-semibold text-[#F3F4F6] mb-6">This Week&apos;s Progress</h2>

                                <div className="space-y-4">
                                    {mockData.weeklyStats.map((stat, index) => (
                                        <StatCard
                                            key={index}
                                            icon={stat.icon}
                                            label={stat.label}
                                            value={stat.value}
                                            change={stat.change}
                                        />
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Workout Type Dialog */}
                <WorkoutTypeDialog
                    open={showWorkoutDialog}
                    onOpenChange={setShowWorkoutDialog}
                />


                {/* Quick Log Workout Type Dialog */}
                <WorkoutTypeDialog
                    open={showQuickLogWorkoutDialog}
                    onOpenChange={setShowQuickLogWorkoutDialog}
                    mode="quick-log"
                />

                {/* Edit Activity Modal */}
                {editingActivity && (
                    <ActivityEditModal
                        activity={editingActivity}
                        onClose={() => setEditingActivity(null)}
                        onSave={handleUpdateActivity}
                    />
                )}
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
