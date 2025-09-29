"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { isOnSubdomain } from "@/lib/subdomains"
import { Button } from "@/components/ui/button"
import { GoalRings } from "./components/goal-rings"
import { PlannedWorkoutCard } from "./components/planned-workout-card"
import { QuickActionCard } from "./components/quick-action-card"
import { StatCard } from "./components/stat-card"

import { WorkoutTypeDialog } from "./components/workout-type-dialog"
import { SetGoalDialog } from "./components/set-goal-dialog"
import { SleepDialog } from "./components/sleep-dialog"
import { ActivityEditModal } from "./history/components/activity-edit-modal"
import { WorkoutStorage, OngoingWorkout, WorkoutActivity } from "@/lib/workout-storage"
import { UserDataStorage } from "@/lib/user-data-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { useWorkoutState } from "@/lib/hooks/useWorkoutState"
import { Plus, Flame, Dumbbell, User, Timer, Bike, Clock, Heart, FileText, Play, Edit3, Trash2, Moon, Footprints } from "lucide-react"

export default function WorkoutPage() {
    const router = useRouter()
    const { user, loading, supabase } = useAuth()
    const notifications = useNotifications()
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)
    const [showWorkoutDialog, setShowWorkoutDialog] = useState(false)
    const [showQuickLogWorkoutDialog, setShowQuickLogWorkoutDialog] = useState(false)
    const [ongoingWorkout, setOngoingWorkout] = useState<OngoingWorkout | null>(null)
    const [liveWorkoutTime, setLiveWorkoutTime] = useState(0)
    const [editingActivity, setEditingActivity] = useState<WorkoutActivity | null>(null)
    const [showSetGoalDialog, setShowSetGoalDialog] = useState(false)
    const [showSleepDialog, setShowSleepDialog] = useState(false)

    // Simplified workout state management
    const { state: workoutState, refreshWorkoutData, addWorkoutOptimistically, removeActivityOptimistically, updateActivityOptimistically } = useWorkoutState()

    // Track if we've shown the sign-in notification to avoid duplicates
    const signInNotificationShownRef = useRef(false)




    // Simple initialization
    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        if (onHealss && user && supabase) {
            // Initialize storage
            WorkoutStorage.initialize(user, supabase)
            UserDataStorage.initialize(user, supabase)

            // Load ongoing workout
            const loadOngoingWorkout = async () => {
                try {
                    const workout = await WorkoutStorage.getOngoingWorkout()
                    setOngoingWorkout(workout)

                    if (workout?.isRunning) {
                        const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                        setLiveWorkoutTime(backgroundElapsedTime)
                        // Immediately refresh goal progress for ongoing workouts
                        refreshWorkoutData()
                    } else if (workout) {
                        setLiveWorkoutTime(workout.elapsedTime)
                        // Refresh for paused workouts too (they still count toward goals)
                        refreshWorkoutData()
                    }
                } catch (error) {
                    console.error('Error loading ongoing workout:', error)
                }
            }

            loadOngoingWorkout()

            // Ongoing workout check with goal progress refresh
            const interval = setInterval(async () => {
                try {
                    const workout = await WorkoutStorage.getOngoingWorkout()
                    const previousWorkout = ongoingWorkout
                    setOngoingWorkout(workout)

                    if (workout?.isRunning) {
                        const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                        setLiveWorkoutTime(backgroundElapsedTime)

                        // Refresh goal progress if workout is running to show real-time updates
                        refreshWorkoutData()
                    } else if (workout) {
                        setLiveWorkoutTime(workout.elapsedTime)

                        // Refresh goal progress for paused workouts too
                        if (previousWorkout?.isRunning !== workout.isRunning) {
                            refreshWorkoutData()
                        }
                    } else if (previousWorkout && !workout) {
                        // Workout was stopped/completed - refresh goal progress
                        refreshWorkoutData()
                    }
                } catch (error) {
                    console.error('Error checking ongoing workout:', error)
                }
            }, 30000)

            return () => {
                clearInterval(interval)
            }
        } else if (onHealss && !loading && user === null && !signInNotificationShownRef.current) {
            signInNotificationShownRef.current = true
            notifications.warning('Sign in required', {
                description: 'Please sign in to access workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
        }
    }, [user, loading, supabase, notifications, router, refreshWorkoutData, ongoingWorkout])

    // Real-time timer effect for ongoing workouts with goal progress updates
    useEffect(() => {
        let timerInterval: NodeJS.Timeout | null = null
        let goalRefreshCounter = 0

        if (ongoingWorkout?.isRunning) {
            // Update timer every second when workout is running
            timerInterval = setInterval(() => {
                const backgroundElapsedTime = WorkoutStorage.getBackgroundElapsedTime()
                setLiveWorkoutTime(backgroundElapsedTime)

                // Refresh goal progress every 30 seconds (for performance)
                goalRefreshCounter++
                if (goalRefreshCounter >= 30) {
                    refreshWorkoutData()
                    goalRefreshCounter = 0
                }
            }, 1000)
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval)
            }
        }
    }, [ongoingWorkout?.isRunning, refreshWorkoutData])

    // Listen for workout completion events - simplified
    useEffect(() => {
        const handleWorkoutCompleted = async (e: Event) => {
            const customEvent = e as CustomEvent

            // Accept events from all sources (quick-log, workout-storage, etc.)
            if (customEvent.detail) {
                notifications.success('Workout logged!', {
                    description: 'Goal progress updated',
                    duration: 3000
                })

                // Data should already be refreshed by the hook that emitted this event
                // Only refresh if the event doesn't come from use-log-workout
                if (customEvent.detail.source !== 'use-log-workout') {
                    refreshWorkoutData(true)
                }
            }
        }

        const handleVisibilityChange = () => {
            if (!document.hidden && user && supabase) {
                refreshWorkoutData()
            }
        }

        window.addEventListener('workoutCompleted', handleWorkoutCompleted as EventListener)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('workoutCompleted', handleWorkoutCompleted as EventListener)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [user, supabase, notifications, refreshWorkoutData, addWorkoutOptimistically])



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




    // Goal progress calculations
    const getGoalRingData = () => {
        // If we have no data yet, show minimal progress to indicate rings are working
        if (!workoutState.goalProgress) {
            return {
                recovery: 0.002, // Minimal progress to show rings are active
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
            return {
                recovery: 0,
                nutrition: 0,
                exercise: 0
            }
        }

        // Allow percentages above 100% for summary display
        return {
            recovery: (workoutState.goalProgress.recovery.currentHours / workoutState.goalProgress.recovery.targetHours) * 100,
            nutrition: (workoutState.goalProgress.nutrition.currentCalories / workoutState.goalProgress.nutrition.targetCalories) * 100,
            exercise: (workoutState.goalProgress.exercise.currentMinutes / workoutState.goalProgress.exercise.targetMinutes) * 100
        }
    }

    const getWeeklyWorkoutStats = () => {
        // Get this week's workout data
        const thisWeekWorkouts = workoutState.recentActivities || []
        const thisWeekSessions = thisWeekWorkouts.length
        const thisWeekMinutes = thisWeekWorkouts.reduce((total, workout) => total + Math.round((workout.durationSeconds || 0) / 60), 0)

        // Format workout time as hours and minutes
        const formatWorkoutTime = (totalMinutes: number) => {
            if (totalMinutes === 0) return "0m"
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            if (hours > 0) {
                return `${hours}h ${minutes}m`
            }
            return `${minutes}m`
        }

        // Mock last week's data for comparison (in real app, this would come from storage)
        // Set to 0 to simulate no previous data scenario
        const lastWeekSessions = 0 // Mock previous week sessions
        const lastWeekMinutes = 0 // Mock previous week minutes

        // Calculate changes
        const sessionChange = thisWeekSessions - lastWeekSessions
        const timeChange = thisWeekMinutes - lastWeekMinutes
        const timeChangePercent = lastWeekMinutes > 0 ? Math.round((timeChange / lastWeekMinutes) * 100) : 0

        // Determine if we have enough data for comparisons
        const hasWorkoutData = thisWeekSessions > 0 || thisWeekMinutes > 0
        const hasComparisonData = lastWeekSessions > 0 || lastWeekMinutes > 0

        return {
            workoutTime: {
                value: hasWorkoutData ? formatWorkoutTime(thisWeekMinutes) : "No workouts yet",
                change: hasWorkoutData && hasComparisonData ? {
                    value: `${Math.abs(timeChangePercent)}%`,
                    direction: timeChange >= 0 ? 'up' as const : 'down' as const,
                    period: "vs last week"
                } : hasWorkoutData && !hasComparisonData ? {
                    value: "No progress data yet",
                    direction: 'neutral' as const,
                    period: ""
                } : undefined
            },
            sessions: {
                value: hasWorkoutData ? thisWeekSessions.toString() : "0",
                change: hasWorkoutData && hasComparisonData ? {
                    value: Math.abs(sessionChange).toString(),
                    direction: sessionChange >= 0 ? 'up' as const : 'down' as const,
                    period: "vs last week"
                } : hasWorkoutData && !hasComparisonData ? {
                    value: "No progress data yet",
                    direction: 'neutral' as const,
                    period: ""
                } : undefined
            }
        }
    }

    // Mock data for demonstration (non-goal related)
    const mockData = {
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
        weeklyStats: (() => {
            const weeklyStats = getWeeklyWorkoutStats()
            return [
                {
                    icon: <Moon className="w-4 h-4" />,
                    label: "Sleep Time",
                    value: "7.2h avg",
                    change: { value: "No progress data yet", direction: "neutral" as const, period: "" }
                },
                {
                    icon: <Clock className="w-4 h-4" />,
                    label: "Workout Time",
                    value: weeklyStats.workoutTime.value || "No data",
                    change: weeklyStats.workoutTime.change
                },
                {
                    icon: <Dumbbell className="w-4 h-4" />,
                    label: "Sessions",
                    value: weeklyStats.sessions.value || "0",
                    change: weeklyStats.sessions.change
                }
            ]
        })()
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
            setShowSleepDialog(true)
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
            // Optimistic UI removal for snappy UX
            removeActivityOptimistically(activity)
            // Do server/local deletion
            await WorkoutStorage.deleteWorkoutActivity(activity.id)
            // Soft refresh soon after to reconcile
            setTimeout(() => refreshWorkoutData(true), 300)

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

        // Close modal immediately for better UX
        setEditingActivity(null)

        try {
            // Optimistic UI update first
            updateActivityOptimistically(updatedActivity)
            // Persist change
            await WorkoutStorage.updateWorkoutActivity(updatedActivity.id, {
                name: updatedActivity.name,
                exercises: updatedActivity.exercises,
                durationSeconds: updatedActivity.durationSeconds,
                notes: updatedActivity.notes
            })
            // Revalidate shortly after
            setTimeout(() => refreshWorkoutData(true), 300)

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
                                {/* Debug buttons - only show in development */}
                                {process.env.NODE_ENV === 'development' && (
                                    <>
                                        <Button
                                            onClick={() => {
                                                console.log('🔧 Manual refresh triggered')
                                                refreshWorkoutData()
                                                notifications.info('Debug refresh', {
                                                    description: 'Forced workout state refresh',
                                                    duration: 2000
                                                })
                                            }}
                                            variant="ghost"
                                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full text-xs"
                                        >
                                            🔄 Refresh
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                console.log('🔍 Current workout state:', workoutState)
                                                notifications.info('Debug state', {
                                                    description: 'Check console for state details',
                                                    duration: 2000
                                                })
                                            }}
                                            variant="ghost"
                                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full text-xs"
                                        >
                                            🔍 Debug
                                        </Button>
                                    </>
                                )}
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
                                            streak={mockData.streak}
                                            className={workoutState.isLoading ? 'opacity-90' : ''}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-[#F3F4F6] mb-2">Today&apos;s Summary</h2>

                                    <div className="grid grid-cols-1 gap-2">
                                        {/* Exercise Summary - Highlighted and moved to top */}
                                        <div className="p-4 bg-gradient-to-br from-[#FF2D55]/10 via-[#FF375F]/5 to-transparent border-2 border-[#FF2D55]/20 rounded-[12px] hover:border-[#FF2D55]/30 transition-all">
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

                                        {/* Recovery Summary - Highlighted */}
                                        <div className="p-4 bg-gradient-to-br from-[#2BD2FF]/10 via-[#2A8CEA]/5 to-transparent border-2 border-[#2BD2FF]/20 rounded-[12px] hover:border-[#2BD2FF]/30 transition-all">
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
                                                            {workoutState.goalProgress.recovery.placeholder && <span className="ml-1 text-[#9CA3AF]"></span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[#2BD2FF] text-sm font-semibold">
                                                    {Math.round(getSummaryPercentages().recovery)}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nutrition Summary */}
                                        <div className="p-3 bg-[#121318] border border-[#212227] rounded-[12px] hover:border-[#2A2B31] transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-[#9BE15D] to-[#00E676] rounded-[8px] flex items-center justify-center">
                                                        <Flame className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-[#F3F4F6] font-medium text-sm">Nutrition</span>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    {workoutState.goalProgress && (
                                                        <div className="text-xs text-[#A1A1AA]">
                                                            {workoutState.goalProgress.nutrition.currentCalories} of {workoutState.goalProgress.nutrition.targetCalories} cal
                                                            {workoutState.goalProgress.nutrition.placeholder && <span className="ml-1 text-[#9CA3AF]"></span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[#9BE15D] text-sm font-semibold">
                                                    {Math.round(getSummaryPercentages().nutrition)}%
                                                </div>
                                            </div>
                                        </div>
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
                                        onClick={() => router.push('/history')}
                                        variant="ghost"
                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full text-sm"
                                    >
                                        View All
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {workoutState.isLoading && workoutState.recentActivities.length === 0 && workoutState.lastRefresh === 0 ? (
                                        <>
                                            {Array.from({ length: 3 }, (_, index) => (
                                                <div
                                                    key={`loading-${index}`}
                                                    className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] opacity-85"
                                                >
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        {/* Loading placeholder for icon */}
                                                        <div className="w-8 h-8 bg-[rgba(255,255,255,0.05)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center">
                                                            <Dumbbell className="w-4 h-4 text-[#9CA3AF]" />
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
                                    ) : workoutState.recentActivities.length === 0 ? (
                                        <div className="text-center py-8 text-[#A1A1AA]">
                                            <p className="mb-2">No workout activities yet</p>
                                            <p className="text-sm">Complete your first workout to see it here!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {workoutState.recentActivities.slice(0, 3).map((activity) => {
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
                                            {Array.from({ length: 3 - workoutState.recentActivities.length }, (_, index) => (
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
                                            period={stat.change?.period}
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

                {/* Set Goal Dialog */}
                <SetGoalDialog
                    open={showSetGoalDialog}
                    onOpenChange={setShowSetGoalDialog}
                />

                {/* Sleep Dialog */}
                <SleepDialog
                    open={showSleepDialog}
                    onOpenChange={setShowSleepDialog}
                    onSleepLogged={() => {
                        // Refresh goal progress when sleep is logged
                        refreshWorkoutData()
                    }}
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
