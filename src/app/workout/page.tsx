"use client"

import { useEffect, useState } from "react"
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

    // Enhanced workout loading with comprehensive debugging
    const loadOngoingWorkout = async () => {
        if (!user || !supabase) {
            console.log('Skipping workout load - missing user or supabase client')
            return
        }

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
                    console.log('✅ No ongoing workout found in database')
                    setOngoingWorkout(null)
                    // Clear any stale localStorage
                    if (typeof window !== 'undefined') {
                        const hadLocalStorage = !!localStorage.getItem('ongoing-workout')
                        localStorage.removeItem('ongoing-workout')
                        localStorage.removeItem('supabase-cache-ongoing-workout')
                        if (hadLocalStorage) {
                            console.log('🧹 Cleared stale localStorage workout data')
                        }
                    }
                } else {
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
                    console.log('💾 Cached workout to localStorage')
                }
            }
        } catch (error) {
            console.error('❌ Failed to load ongoing workout from database:', error)
            
            // Fallback to localStorage if database fails
            if (typeof window !== 'undefined') {
                const cachedWorkout = localStorage.getItem('ongoing-workout')
                const cacheTimestamp = localStorage.getItem('ongoing-workout-timestamp')
                
                console.log('🔄 Attempting localStorage fallback...', {
                    hasCachedWorkout: !!cachedWorkout,
                    hasCacheTimestamp: !!cacheTimestamp
                })
                
                // Only use cache if it's less than 5 minutes old
                if (cachedWorkout && cacheTimestamp) {
                    const cacheAge = Date.now() - parseInt(cacheTimestamp)
                    const maxCacheAge = 5 * 60 * 1000 // 5 minutes
                    
                    if (cacheAge < maxCacheAge) {
                        console.log(`✅ Using cached workout (${Math.round(cacheAge/1000)}s old)`)
                        setOngoingWorkout(JSON.parse(cachedWorkout))
                    } else {
                        console.log(`⚠️ Cached workout too old (${Math.round(cacheAge/1000)}s), discarding`)
                        localStorage.removeItem('ongoing-workout')
                        localStorage.removeItem('ongoing-workout-timestamp')
                        setOngoingWorkout(null)
                    }
                } else {
                    console.log('❌ No valid localStorage fallback available')
                    setOngoingWorkout(null)
                }
            }
        } finally {
            setIsLoadingWorkout(false)
            console.log('Workout load process completed')
        }
    }

    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        if (onHealss) {
            WorkoutStorageSupabase.initialize(user, supabase)
            loadOngoingWorkout()
        }
    }, [user, supabase])

    // Smart focus handling - avoid excessive reloads
    useEffect(() => {
        if (!isHealssSubdomain) return

        let lastFocusTime = 0
        const handleFocus = () => {
            const now = Date.now()
            // Only reload if more than 30 seconds since last focus event
            if (now - lastFocusTime > 30000) {
                console.log('Page gained focus after significant time away, refreshing workout data')
                loadOngoingWorkout()
                lastFocusTime = now
            } else {
                console.log('Page gained focus recently, skipping reload to prevent conflicts')
            }
        }

        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [isHealssSubdomain, user, supabase])

    // Optimized timer update - reduced frequency and smarter updates
    useEffect(() => {
        if (!ongoingWorkout?.isRunning) return

        const updateTimer = setInterval(() => {
            setOngoingWorkout(prev => {
                if (!prev) return prev
                
                const now = Date.now()
                const timeDiff = Math.floor((now - new Date(prev.startTime).getTime()) / 1000)
                const currentElapsedTime = prev.elapsedTime + timeDiff
                
                // Only update if there's a meaningful change (prevents unnecessary renders)
                const timeDelta = Math.abs(currentElapsedTime - prev.elapsedTime)
                if (timeDelta < 5) {
                    return prev // Skip update if less than 5 seconds difference
                }
                
                console.log(`Timer update: ${prev.elapsedTime}s -> ${currentElapsedTime}s`)
                
                return {
                    ...prev,
                    elapsedTime: currentElapsedTime
                }
            })
        }, 5000) // Update every 5 seconds instead of every second

        return () => clearInterval(updateTimer)
    }, [ongoingWorkout?.isRunning, ongoingWorkout?.startTime])

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
        if (action === 'strength') {
            try {
                // Start strength workout with last template immediately
                const lastTemplate = await WorkoutStorageSupabase.getLastTemplate('strength')
                if (lastTemplate) {
                    const workout = await WorkoutStorageSupabase.createWorkoutFromTemplate(lastTemplate)
                    window.location.href = `/workout/strength/${workout.id}`
                } else {
                    // Fallback to dialog if no template found
                    setShowWorkoutDialog(true)
                }
            } catch (error) {
                console.error('Failed to start quick action workout:', error)
                setShowWorkoutDialog(true)
            }
        } else {
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
                                        onClick={loadOngoingWorkout}
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

                                {/* Ongoing Workout */}
                                {!isLoadingWorkout && ongoingWorkout && (
                                    <div className="bg-[#121318] border-2 border-[#4AA7FF] rounded-[20px] p-5 shadow-[0_0_0_1px_rgba(74,167,255,0.35),_0_8px_40px_rgba(74,167,255,0.20)] hover:shadow-[0_0_0_1px_rgba(74,167,255,0.5),_0_12px_48px_rgba(74,167,255,0.25)] hover:-translate-y-[1px] transition-all duration-200">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-[rgba(74,167,255,0.1)] border border-[#4AA7FF] rounded-[14px] flex items-center justify-center text-[#4AA7FF]">
                                                    <Play className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-[#F3F4F6] text-sm">
                                                        {ongoingWorkout.templateName || 'Active Workout'}
                                                    </h3>
                                                    <p className="text-xs text-[#4AA7FF] mt-1 font-medium">
                                                        {ongoingWorkout.isRunning ? 'In Progress' : 'Paused'} • {Math.floor((ongoingWorkout.elapsedTime || 0) / 60)}:{String((ongoingWorkout.elapsedTime || 0) % 60).padStart(2, '0')}
                                                    </p>
                                                    <p className="text-xs text-[#7A7F86] mt-1">
                                                        {ongoingWorkout.exercises?.length || 0} exercise{(ongoingWorkout.exercises?.length || 0) !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => window.location.href = `/workout/${ongoingWorkout.type}/${ongoingWorkout.id}`}
                                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all text-sm font-medium h-8"
                                        >
                                            Continue Workout
                                        </Button>
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

                            {/* Weekly Stats Section */}
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
