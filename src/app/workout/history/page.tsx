"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, Filter, Dumbbell, Footprints, Heart, Bike, Plus, Moon } from "lucide-react"
import { WorkoutStorage, WorkoutActivity } from "@/lib/workout-storage"
import { UserDataStorage, SleepData } from "@/lib/user-data-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { ActivityCard } from "./components/activity-card"
import { ActivityEditModal } from "./components/activity-edit-modal"
import { DeleteConfirmDialog } from "./components/delete-confirm-dialog"
import { SleepCard } from "./components/sleep-card"
import { SleepEditModal } from "./components/sleep-edit-modal"
import { SleepDeleteConfirmDialog } from "./components/sleep-delete-confirm-dialog"

export default function WorkoutHistoryPage() {
    const router = useRouter()
    const { user, loading, supabase } = useAuth()
    const notifications = useNotifications()
    const [activities, setActivities] = useState<WorkoutActivity[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [editingActivity, setEditingActivity] = useState<WorkoutActivity | null>(null)
    const [deletingActivity, setDeletingActivity] = useState<WorkoutActivity | null>(null)
    const [editingSleep, setEditingSleep] = useState<SleepData | null>(null)
    const [deletingSleep, setDeletingSleep] = useState<SleepData | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)
    const limit = 20

    // Sleep data state
    const [sleepData, setSleepData] = useState<SleepData[]>([])
    const [isSleepLoading, setIsSleepLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("workouts")

    // Removed loadActivities callback to prevent infinite loop

    useEffect(() => {
        // Add delay to allow auth state to settle
        const initializeWithDelay = setTimeout(() => {
            if (!user || !supabase) {
                // Only show if user is explicitly null and we haven't shown recently
                const lastHistoryNotification = localStorage.getItem('last-history-notification')
                const now = Date.now()

                if (!loading && user === null && (!lastHistoryNotification || now - parseInt(lastHistoryNotification) > 300000)) { // 5 minutes
                    notifications.warning('Sign in required', {
                        description: 'Please sign in to view workout history',
                        duration: 4000,
                        action: {
                            label: 'Sign In',
                            onClick: () => router.push('/auth/signin')
                        }
                    })
                    localStorage.setItem('last-history-notification', now.toString())
                }
                return
            }

            if (user && supabase) {
                setOffset(0)
                setActivities([]) // Clear activities immediately
                setIsLoading(true)

                // Load activities for the current filter
                const loadData = async () => {
                    try {
                        WorkoutStorage.initialize(user, supabase)
                        const type = filterType === "all" ? undefined : filterType as 'strength' | 'running' | 'yoga' | 'cycling'
                        const newActivities = await WorkoutStorage.getWorkoutActivities(limit, 0, type)

                        setActivities(newActivities)
                        setOffset(limit)
                        setHasMore(newActivities.length === limit)
                    } catch (error) {
                        console.error('Error loading workout activities:', error)
                        notifications.error('Load failed', {
                            description: 'Could not load workout history'
                        })
                    } finally {
                        setIsLoading(false)
                    }
                }

                loadData()

                // Load sleep data for the last 30 days
                const loadSleepData = async () => {
                    try {
                        setIsSleepLoading(true)
                        UserDataStorage.initialize(user, supabase)

                        const endDate = new Date().toISOString().split('T')[0]
                        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

                        const sleepHistory = await UserDataStorage.getSleepDataRange(startDate, endDate)
                        setSleepData(sleepHistory)
                    } catch (error) {
                        console.error('Error loading sleep data:', error)
                        notifications.error('Load failed', {
                            description: 'Could not load sleep history'
                        })
                    } finally {
                        setIsSleepLoading(false)
                    }
                }

                loadSleepData()

                // Show history tip for first-time visitors
                setTimeout(() => {
                    const hasSeenHistoryTip = localStorage.getItem('history-tip-shown')
                    if (!hasSeenHistoryTip) {
                        notifications.info('History tip', {
                            description: 'Click any workout to edit details',
                            duration: 4000
                        })
                        localStorage.setItem('history-tip-shown', 'true')
                    }
                }, 2000)
            }
        }, 2000) // 2 second delay to allow auth to settle

        return () => {
            clearTimeout(initializeWithDelay)
        }
    }, [user, supabase, filterType, limit, notifications, router, loading])

    const loadMoreActivities = async () => {
        if (!user || !supabase || isLoading) return

        try {
            setIsLoading(true)
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
            setIsLoading(false)
        }
    }

    const handleDeleteActivity = async () => {
        if (!deletingActivity) return

        try {
            await WorkoutStorage.deleteWorkoutActivity(deletingActivity.id)
            setActivities(prev => prev.filter(a => a.id !== deletingActivity.id))

            notifications.success('Activity deleted', {
                description: 'Workout removed from history',
                duration: 3000
            })

            setDeletingActivity(null)
        } catch (error) {
            console.error('Error deleting activity:', error)
            notifications.error('Delete failed', {
                description: 'Could not remove activity'
            })
        }
    }

    const handleUpdateActivity = async (updatedActivity: WorkoutActivity) => {
        // Optimistic update - update UI immediately
        const optimisticUpdate = {
            ...updatedActivity,
            updatedAt: new Date().toISOString()
        }

        setActivities(prev => prev.map(a =>
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

            console.log('Activity updated successfully')
        } catch (error) {
            console.error('Error updating activity:', error)

            notifications.error('Update failed', {
                description: 'Could not save changes'
            })

            // Revert optimistic update on error
            setActivities(prev => prev.map(a =>
                a.id === updatedActivity.id ? updatedActivity : a
            ))
        }
    }

    // Sleep handlers
    const handleDeleteSleep = async () => {
        if (!deletingSleep) return

        try {
            await UserDataStorage.deleteSleepData(deletingSleep.id)
            setSleepData(prev => prev.filter(s => s.id !== deletingSleep.id))

            notifications.success('Sleep session deleted', {
                description: 'Sleep data removed from history',
                duration: 3000
            })
        } catch (error) {
            console.error('Error deleting sleep data:', error)
            notifications.error('Delete failed', {
                description: 'Failed to delete sleep session. Please try again.',
                duration: 4000
            })
        } finally {
            setDeletingSleep(null)
        }
    }

    const handleUpdateSleep = async (updatedSleepData: SleepData) => {
        // Optimistic update - update UI immediately
        const optimisticUpdate = {
            ...updatedSleepData,
            updatedAt: new Date().toISOString()
        }

        setSleepData(prev => prev.map(s =>
            s.id === updatedSleepData.id ? optimisticUpdate : s
        ))

        try {
            await UserDataStorage.updateSleepData(updatedSleepData.id, updatedSleepData)

            notifications.success('Sleep session updated', {
                description: 'Changes saved successfully',
                duration: 3000
            })
        } catch (error) {
            console.error('Error updating sleep data:', error)
            notifications.error('Update failed', {
                description: 'Failed to update sleep session. Please try again.',
                duration: 4000
            })
        }
    }

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
    const filteredActivities = activities.filter(activity =>
        activity.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.workoutType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6] relative overflow-hidden">
            {/* Hero Gradient Background */}
            <div className="absolute inset-0 opacity-80">
                {/* Desktop gradient */}
                <div
                    className="hidden md:block absolute inset-0"
                    style={{
                        background: "radial-gradient(60% 60% at 60% 30%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                    }}
                />
                {/* Mobile gradient */}
                <div
                    className="block md:hidden absolute inset-0"
                    style={{
                        background: "radial-gradient(80% 80% at 50% 40%, rgba(42,140,234,0.55) 0%, rgba(16,62,154,0.45) 35%, rgba(23,17,70,0.30) 65%, rgba(0,0,0,0) 100%)"
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="container mx-auto max-w-4xl px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => router.push('/workout')}
                                variant="ghost"
                                size="icon"
                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-[#F3F4F6]">Activity History</h1>
                                <p className="text-sm text-[#A1A1AA] mt-1">
                                    {activeTab === 'workouts'
                                        ? `${activities.length} workout${activities.length !== 1 ? 's' : ''} completed`
                                        : `${sleepData.length} sleep session${sleepData.length !== 1 ? 's' : ''} logged`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                        <TabsList className="grid w-full grid-cols-2 bg-[#121318] border border-[#212227] rounded-lg">
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
                                                className="pl-10 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px]"
                                            />
                                        </div>
                                    </div>
                                    <div className="min-w-[160px]">
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] rounded-[14px]">
                                                <Filter className="w-4 h-4 mr-2" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#121318] border-[#212227]">
                                                <SelectItem value="all">All Types</SelectItem>
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
                            {isLoading && activities.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8CEA]"></div>
                                </div>
                            ) : filteredActivities.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-[#A1A1AA] mb-4">
                                        <p>No workout activities found.</p>
                                        {searchQuery && (
                                            <p className="text-sm mt-2">Try adjusting your search or filter.</p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => router.push('/workout')}
                                        className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Start Your First Workout
                                    </Button>
                                </div>
                            ) : (
                                <ScrollArea className="h-[600px]">
                                    <div className="space-y-4 pr-4">
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

                                        {hasMore && !searchQuery && (
                                            <div className="flex justify-center pt-4">
                                                <Button
                                                    onClick={loadMoreActivities}
                                                    disabled={isLoading}
                                                    variant="ghost"
                                                    className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                                                >
                                                    {isLoading ? 'Loading...' : 'Load More'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="sleep" className="mt-6">
                            {/* Sleep Data List */}
                            {isSleepLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2BD2FF]"></div>
                                </div>
                            ) : sleepData.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-[#A1A1AA] mb-4">
                                        <p>No sleep data found.</p>
                                        <p className="text-sm mt-2">Start logging your sleep to see it here!</p>
                                    </div>
                                    <Button
                                        onClick={() => router.push('/workout')}
                                        className="bg-gradient-to-r from-[#2BD2FF] to-[#2A8CEA] text-white rounded-full border border-[rgba(43,210,255,0.35)] shadow-[0_8px_32px_rgba(43,210,255,0.28)] hover:shadow-[0_10px_40px_rgba(43,210,255,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                    >
                                        <Moon className="w-4 h-4 mr-2" />
                                        Log Your First Sleep
                                    </Button>
                                </div>
                            ) : (
                                <ScrollArea className="h-[600px]">
                                    <div className="space-y-4 pr-4">
                                        {sleepData.map((sleep) => (
                                            <SleepCard
                                                key={sleep.id}
                                                sleepData={sleep}
                                                onEdit={() => setEditingSleep(sleep)}
                                                onDelete={() => setDeletingSleep(sleep)}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
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

            {/* Delete Confirmation Dialog */}
            {deletingActivity && (
                <DeleteConfirmDialog
                    activity={deletingActivity}
                    onConfirm={handleDeleteActivity}
                    onCancel={() => setDeletingActivity(null)}
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

            {/* Sleep Delete Confirmation Dialog */}
            {deletingSleep && (
                <SleepDeleteConfirmDialog
                    sleepData={deletingSleep}
                    onConfirm={handleDeleteSleep}
                    onCancel={() => setDeletingSleep(null)}
                />
            )}
        </div>
    )
}