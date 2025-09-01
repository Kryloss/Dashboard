"use client"

import { useEffect, useState, useCallback } from "react"
import { isOnSubdomain } from "@/lib/subdomains"
import { Button } from "@/components/ui/button"
import { GoalRings } from "./components/goal-rings"
import { PlannedWorkoutCard } from "./components/planned-workout-card"
import { QuickActionCard } from "./components/quick-action-card"
import { StatCard } from "./components/stat-card"
import { ActivityItem } from "./components/activity-item"
import { WorkoutTypeDialog } from "./components/workout-type-dialog"
import { WorkoutStorageSupabase, OngoingWorkout } from "@/lib/workout-storage-supabase"
import { useAuth } from "@/lib/hooks/useAuth"
import { Settings, Plus, Flame, Dumbbell, User, Timer, Bike, Target, TrendingUp, Clock, Heart, FileText, Play } from "lucide-react"

export default function WorkoutPage() {
    const { user, supabase } = useAuth()
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)
    const [showWorkoutDialog, setShowWorkoutDialog] = useState(false)
    const [ongoingWorkout, setOngoingWorkout] = useState<OngoingWorkout | null>(null)
    const [isLoadingWorkout, setIsLoadingWorkout] = useState(false)

    // Health logging helper function
    const healthLog = (message: string, data?: unknown) => {
        const timestamp = new Date().toISOString()
        console.log(`[HEALTH LOG ${timestamp}] ${message}`, data ? data : '')
    }

    // Enhanced workout loading with comprehensive debugging
    const loadOngoingWorkout = useCallback(async () => {
        if (!user || !supabase) {
            healthLog('WORKOUT_LOAD_SKIP: Missing user or supabase client', { hasUser: !!user, hasSupabase: !!supabase })
            console.log('Skipping workout load - missing user or supabase client')
            return
        }

        healthLog('WORKOUT_LOAD_START: Beginning workout load process', { userId: user.id })
        console.log('Starting workout load process for user:', user.id)
        setIsLoadingWorkout(true)

        try {
            console.log('Querying database for ongoing workout...')
            // Direct database query without complex caching
            const { data, error } = await supabase
                .from('ongoing_workouts')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    // No ongoing workout found
                    healthLog('WORKOUT_NOT_FOUND: No ongoing workout in database', { errorCode: error.code })
                    console.log('✅ No ongoing workout found in database')
                    setOngoingWorkout(null)
                    // Clear any stale localStorage
                    if (typeof window !== 'undefined') {
                        const hadLocalStorage = !!localStorage.getItem('ongoing-workout')
                        localStorage.removeItem('ongoing-workout')
                        localStorage.removeItem('supabase-cache-ongoing-workout')
                        if (hadLocalStorage) {
                            healthLog('WORKOUT_LOCALSTORAGE_CLEAR: Cleared stale localStorage data')
                            console.log('🧹 Cleared stale localStorage workout data')
                        }
                    }
                } else {
                    healthLog('WORKOUT_DB_ERROR: Database query failed', { error: error.message, code: error.code })
                    console.error('Database query error:', error)
                    throw error
                }
            } else {
                // Convert database row to OngoingWorkout interface
                const workout: OngoingWorkout = {
                    id: data.id,
                    type: data.type as 'strength' | 'running' | 'yoga' | 'cycling',
                    templateId: data.template_id || undefined,
                    templateName: data.template_name || undefined,
                    exercises: data.exercises,
                    startTime: data.start_time,
                    elapsedTime: data.elapsed_time,
                    isRunning: data.is_running,
                    userId: data.user_id
                }

                healthLog('WORKOUT_FOUND: Successfully loaded ongoing workout from database', {
                    id: workout.id,
                    type: workout.type,
                    name: workout.templateName || 'Unnamed',
                    exercises: workout.exercises.length,
                    elapsedTime: workout.elapsedTime,
                    isRunning: workout.isRunning
                })
                console.log('✅ Successfully loaded ongoing workout:', {
                    id: workout.id,
                    type: workout.type,
                    name: workout.templateName || 'Unnamed',
                    exercises: workout.exercises.length,
                    elapsedTime: workout.elapsedTime,
                    isRunning: workout.isRunning
                })

                setOngoingWorkout(workout)

                // Cache in localStorage for offline access
                if (typeof window !== 'undefined') {
                    localStorage.setItem('ongoing-workout', JSON.stringify(workout))
                    localStorage.setItem('ongoing-workout-timestamp', Date.now().toString())
                    healthLog('WORKOUT_CACHE: Cached workout to localStorage')
                    console.log('💾 Cached workout to localStorage')
                }
            }
        } catch (error) {
            healthLog('WORKOUT_LOAD_ERROR: Failed to load workout from database', { error: error?.toString() })
            console.error('❌ Failed to load ongoing workout from database:', error)

            // Fallback to localStorage if database fails
            if (typeof window !== 'undefined') {
                const cachedWorkout = localStorage.getItem('ongoing-workout')
                const cacheTimestamp = localStorage.getItem('ongoing-workout-timestamp')

                healthLog('WORKOUT_FALLBACK_ATTEMPT: Trying localStorage fallback', {
                    hasCachedWorkout: !!cachedWorkout,
                    hasCacheTimestamp: !!cacheTimestamp
                })
                console.log('🔄 Attempting localStorage fallback...', {
                    hasCachedWorkout: !!cachedWorkout,
                    hasCacheTimestamp: !!cacheTimestamp
                })

                // Only use cache if it's less than 5 minutes old
                if (cachedWorkout && cacheTimestamp) {
                    const cacheAge = Date.now() - parseInt(cacheTimestamp)
                    const maxCacheAge = 5 * 60 * 1000 // 5 minutes

                    if (cacheAge < maxCacheAge) {
                        healthLog('WORKOUT_FALLBACK_SUCCESS: Using cached workout', { cacheAgeSeconds: Math.round(cacheAge / 1000) })
                        console.log(`✅ Using cached workout (${Math.round(cacheAge / 1000)}s old)`)
                        setOngoingWorkout(JSON.parse(cachedWorkout))
                    } else {
                        healthLog('WORKOUT_FALLBACK_EXPIRED: Cached workout too old, discarding', { cacheAgeSeconds: Math.round(cacheAge / 1000) })
                        console.log(`⚠️ Cached workout too old (${Math.round(cacheAge / 1000)}s), discarding`)
                        localStorage.removeItem('ongoing-workout')
                        localStorage.removeItem('ongoing-workout-timestamp')
                        setOngoingWorkout(null)
                    }
                } else {
                    healthLog('WORKOUT_FALLBACK_FAILED: No valid localStorage fallback available')
                    console.log('❌ No valid localStorage fallback available')
                    setOngoingWorkout(null)
                }
            }
        } finally {
            setIsLoadingWorkout(false)
            healthLog('WORKOUT_LOAD_END: Workout load process completed')
            console.log('Workout load process completed')
        }
    }, [user, supabase])

    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        healthLog('HEALSS_SUBDOMAIN_CHECK: Subdomain check completed', { onHealss, hasUser: !!user, hasSupabase: !!supabase })

        if (onHealss) {
            healthLog('WORKOUT_STORAGE_INIT: Initializing WorkoutStorageSupabase')
            WorkoutStorageSupabase.initialize(user, supabase)
            loadOngoingWorkout()
        }
    }, [user, supabase, loadOngoingWorkout])

    // Smart focus handling - avoid excessive reloads
    useEffect(() => {
        if (!isHealssSubdomain) return

        healthLog('FOCUS_HANDLER_SETUP: Setting up focus event handler')
        let lastFocusTime = 0
        const handleFocus = () => {
            const now = Date.now()
            const timeSinceLastFocus = now - lastFocusTime
            // Only reload if more than 30 seconds since last focus event
            if (timeSinceLastFocus > 30000) {
                healthLog('FOCUS_RELOAD: Page gained focus, refreshing workout data', { timeSinceLastFocus })
                console.log('Page gained focus after significant time away, refreshing workout data')
                loadOngoingWorkout()
                lastFocusTime = now
            } else {
                healthLog('FOCUS_SKIP: Page gained focus recently, skipping reload', { timeSinceLastFocus })
                console.log('Page gained focus recently, skipping reload to prevent conflicts')
            }
        }

        window.addEventListener('focus', handleFocus)
        return () => {
            healthLog('FOCUS_HANDLER_CLEANUP: Removing focus event handler')
            window.removeEventListener('focus', handleFocus)
        }
    }, [isHealssSubdomain, user, supabase, loadOngoingWorkout])

    // Optimized timer update - reduced frequency and smarter updates
    useEffect(() => {
        if (!ongoingWorkout?.isRunning) {
            healthLog('TIMER_SKIP: No running workout, skipping timer setup', { hasWorkout: !!ongoingWorkout, isRunning: ongoingWorkout?.isRunning })
            return
        }

        healthLog('TIMER_SETUP: Setting up workout timer', { workoutId: ongoingWorkout.id, elapsedTime: ongoingWorkout.elapsedTime })

        const updateTimer = setInterval(() => {
            setOngoingWorkout(prev => {
                if (!prev) {
                    healthLog('TIMER_UPDATE_SKIP: No previous workout state')
                    return prev
                }

                const now = Date.now()
                const timeDiff = Math.floor((now - new Date(prev.startTime).getTime()) / 1000)
                const currentElapsedTime = prev.elapsedTime + timeDiff

                // Only update if there's a meaningful change (prevents unnecessary renders)
                const timeDelta = Math.abs(currentElapsedTime - prev.elapsedTime)
                if (timeDelta < 10) { // Increased from 5 to 10 seconds to reduce updates
                    return prev // Skip update if less than 10 seconds difference
                }

                healthLog('TIMER_UPDATE: Updating workout timer', {
                    from: prev.elapsedTime,
                    to: currentElapsedTime,
                    timeDelta
                })
                console.log(`Timer update: ${prev.elapsedTime}s -> ${currentElapsedTime}s`)

                return {
                    ...prev,
                    elapsedTime: currentElapsedTime
                }
            })
        }, 10000) // Update every 10 seconds instead of every 5 seconds

        return () => {
            healthLog('TIMER_CLEANUP: Clearing workout timer')
            clearInterval(updateTimer)
        }
    }, [ongoingWorkout?.isRunning, ongoingWorkout?.startTime, ongoingWorkout])

    // Health logging for ongoingWorkout state changes
    useEffect(() => {
        healthLog('WORKOUT_STATE_CHANGE: ongoingWorkout state updated', {
            hasWorkout: !!ongoingWorkout,
            workoutId: ongoingWorkout?.id,
            workoutType: ongoingWorkout?.type,
            templateName: ongoingWorkout?.templateName,
            isRunning: ongoingWorkout?.isRunning,
            elapsedTime: ongoingWorkout?.elapsedTime,
            exerciseCount: ongoingWorkout?.exercises?.length
        })
    }, [ongoingWorkout])

    // Health logging for loading state changes
    useEffect(() => {
        healthLog('LOADING_STATE_CHANGE: isLoadingWorkout state updated', { isLoadingWorkout })
    }, [isLoadingWorkout])

    // Mock data for demonstration
    const mockData = {
        goals: {
            move: 0.62, // 62% of calorie goal
            exercise: 0.77, // 77% of exercise goal
            stand: 0.67 // 67% of stand goal
        },
        plannedWorkouts: [
            {
                id: 1,
                icon: <Target className="w-5 h-5" />,
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
        console.log(`Starting workout ${id}`)
    }

    const handleEditWorkout = (id: number) => {
        console.log(`Editing workout ${id}`)
    }

    const handleQuickAction = async (action: string) => {
        healthLog('QUICK_ACTION_START: Handling quick action', { action })
        if (action === 'strength') {
            try {
                healthLog('STRENGTH_WORKOUT_START: Starting strength workout with last template')
                // Start strength workout with last template immediately
                const lastTemplate = await WorkoutStorageSupabase.getLastTemplate('strength')
                if (lastTemplate) {
                    healthLog('STRENGTH_TEMPLATE_FOUND: Creating workout from template', { templateId: lastTemplate.id })
                    const workout = await WorkoutStorageSupabase.createWorkoutFromTemplate(lastTemplate)
                    healthLog('STRENGTH_WORKOUT_CREATED: Redirecting to workout page', { workoutId: workout.id })
                    window.location.href = `/workout/strength/${workout.id}`
                } else {
                    healthLog('STRENGTH_NO_TEMPLATE: No template found, showing dialog')
                    // Fallback to dialog if no template found
                    setShowWorkoutDialog(true)
                }
            } catch (error) {
                healthLog('STRENGTH_WORKOUT_ERROR: Failed to start strength workout', { error: error?.toString() })
                console.error('Failed to start quick action workout:', error)
                setShowWorkoutDialog(true)
            }
        } else {
            healthLog('QUICK_ACTION_OTHER: Handling other quick action', { action })
            console.log(`Quick action: ${action}`)
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
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-[#F3F4F6]">Daily Goals Progress</h1>
                                <Button
                                    variant="ghost"
                                    className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Goal Settings
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                <div className="flex justify-center lg:justify-start">
                                    <GoalRings
                                        size="lg"
                                        moveProgress={mockData.goals.move}
                                        exerciseProgress={mockData.goals.exercise}
                                        standProgress={mockData.goals.stand}
                                        centerContent={{
                                            title: "Today",
                                            value: `${Math.round(mockData.goals.move * 100)}%`,
                                            subtitle: "Complete"
                                        }}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold text-[#F3F4F6] mb-4">Today&apos;s Summary</h2>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Flame className="w-6 h-6 text-[#FF2D55]" />
                                            <span className="text-[#F3F4F6] font-medium">1,247 / 2,000 calories</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Dumbbell className="w-6 h-6 text-[#9BE15D]" />
                                            <span className="text-[#F3F4F6] font-medium">23 / 30 minutes</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <User className="w-6 h-6 text-[#2BD2FF]" />
                                            <span className="text-[#F3F4F6] font-medium">8 / 12 hours</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-[#121318] border border-[#212227] rounded-[20px]">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[#F3F4F6] font-medium">Streak: 7 days</span>
                                            <TrendingUp className="w-5 h-5 text-[#4AA7FF]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Today's Workout Section */}
                        <section className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-[#F3F4F6]">Today&apos;s Workout</h2>
                                <div className="flex items-center space-x-3">
                                    <Button
                                        onClick={() => {
                                            healthLog('REFRESH_BUTTON_CLICKED: Manual refresh initiated')
                                            loadOngoingWorkout()
                                        }}
                                        disabled={isLoadingWorkout}
                                        variant="ghost"
                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                                    >
                                        {isLoadingWorkout ? (
                                            <div className="w-4 h-4 border-2 border-[#4AA7FF] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            'Refresh'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => setShowWorkoutDialog(true)}
                                        className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Workout
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {/* Loading State */}
                                {isLoadingWorkout && (
                                    <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-[#4AA7FF] border-t-transparent rounded-full animate-spin" />
                                            <span className="ml-3 text-[#A1A1AA]">Loading workout...</span>
                                        </div>
                                    </div>
                                )}

                                {/* Ongoing Workout Card */}
                                {!isLoadingWorkout && ongoingWorkout && (
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
                                                        {ongoingWorkout.templateName || `${ongoingWorkout.type.charAt(0).toUpperCase() + ongoingWorkout.type.slice(1)} Workout`}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-2 text-xs text-[#9CA3AF]">
                                                        <div className="flex items-center space-x-1">
                                                            <Timer className="w-3 h-3" />
                                                            <span>{Math.floor(ongoingWorkout.elapsedTime / 60)}:{(ongoingWorkout.elapsedTime % 60).toString().padStart(2, '0')}</span>
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
                                                    healthLog('CONTINUE_WORKOUT_CLICKED: Navigating to ongoing workout', { workoutId: ongoingWorkout.id, workoutType: ongoingWorkout.type })
                                                    window.location.href = `/workout/${ongoingWorkout.type}/${ongoingWorkout.id}`
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

                                {/* Quick Log Card */}
                                <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[14px] flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-[#F3F4F6]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#F3F4F6] text-sm">Quick Log</h3>
                                            <p className="text-xs text-[#A1A1AA] mt-1">Log past workout</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31] hover:scale-[1.01] active:scale-[0.997] transition-all text-sm font-medium h-8"
                                        onClick={() => handleQuickAction('log')}
                                    >
                                        Log Workout
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Quick Actions Section */}
                        <section className="mb-12">
                            <h2 className="text-xl font-semibold text-[#F3F4F6] mb-6">Quick Actions</h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                <QuickActionCard
                                    icon={<Target className="w-6 h-6" />}
                                    label="Running"
                                    onClick={() => handleQuickAction('running')}
                                />
                                <QuickActionCard
                                    icon={<Dumbbell className="w-6 h-6" />}
                                    label="Strength"
                                    onClick={() => handleQuickAction('strength')}
                                />
                                <QuickActionCard
                                    icon={<Heart className="w-6 h-6" />}
                                    label="Yoga"
                                    onClick={() => handleQuickAction('yoga')}
                                />
                                <QuickActionCard
                                    icon={<Bike className="w-6 h-6" />}
                                    label="Cycling"
                                    onClick={() => handleQuickAction('cycling')}
                                />
                                <QuickActionCard
                                    icon={<Timer className="w-6 h-6" />}
                                    label="Timer"
                                    onClick={() => handleQuickAction('timer')}
                                />
                            </div>
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Recent Activity Section */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-[#F3F4F6]">Recent Activity</h2>
                                    <Button
                                        variant="ghost"
                                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full text-sm"
                                    >
                                        View All
                                    </Button>
                                </div>

                                <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]">
                                    {mockData.recentActivity.map((activity, index) => (
                                        <ActivityItem
                                            key={index}
                                            date={activity.date}
                                            name={activity.name}
                                            duration={activity.duration}
                                            progress={activity.progress}
                                        />
                                    ))}
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
                                    
                                    {/* Health Log Card */}
                                    <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center">
                                                    <Heart className="w-4 h-4 text-[#FF2D55]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-[#F3F4F6] text-sm">Health Log</h3>
                                                    <p className="text-xs text-[#A1A1AA]">Debug & monitoring</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    // Open browser console and show health logs
                                                    console.log('=== HEALSS HEALTH LOG ====')
                                                    console.log('User:', user?.id)
                                                    console.log('Ongoing Workout:', ongoingWorkout)
                                                    console.log('Loading State:', isLoadingWorkout)
                                                    console.log('Healss Subdomain:', isHealssSubdomain)
                                                    console.log('Last Save Time:', new Date().toLocaleTimeString())
                                                    
                                                    // Check localStorage
                                                    if (typeof window !== 'undefined') {
                                                        console.log('LocalStorage Data:')
                                                        console.log('- ongoing-workout:', localStorage.getItem('ongoing-workout'))
                                                        console.log('- ongoing-workout-timestamp:', localStorage.getItem('ongoing-workout-timestamp'))
                                                        console.log('- workout-templates:', localStorage.getItem('workout-templates'))
                                                    }
                                                    
                                                    console.log('==========================')
                                                    healthLog('HEALTH_LOG_REQUESTED: Manual health log check requested by user')
                                                    
                                                    // Show alert to user
                                                    alert('Health log data has been printed to the browser console. Press F12 to open Developer Tools and check the Console tab.')
                                                }}
                                                variant="ghost"
                                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full text-xs h-7 px-3"
                                            >
                                                Check Log
                                            </Button>
                                        </div>
                                    </div>
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
