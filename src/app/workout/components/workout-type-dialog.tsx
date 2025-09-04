"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dumbbell, Footprints, Heart, Bike, AlertTriangle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkoutStorage, WorkoutTemplate } from "@/lib/workout-storage"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"

interface WorkoutTypeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode?: 'new-workout' | 'quick-log'
}

const getWorkoutTypes = () => [
    {
        id: 'strength',
        name: 'Strength',
        description: 'Weight lifting and resistance training',
        icon: <Dumbbell className="w-8 h-8" />,
        available: true,
        color: 'text-[#9BE15D]'
    },
    {
        id: 'running',
        name: 'Running',
        description: 'Cardio and endurance training',
        icon: <Footprints className="w-8 h-8" />,
        available: false, // In development for both modes
        color: 'text-[#FF2D55]'
    },
    {
        id: 'yoga',
        name: 'Yoga',
        description: 'Flexibility and mindfulness',
        icon: <Heart className="w-8 h-8" />,
        available: false, // In development for both modes
        color: 'text-[#2BD2FF]'
    },
    {
        id: 'cycling',
        name: 'Cycling',
        description: 'Indoor and outdoor cycling',
        icon: <Bike className="w-8 h-8" />,
        available: false, // In development for both modes
        color: 'text-[#FF375F]'
    }
]

export function WorkoutTypeDialog({ open, onOpenChange, mode = 'new-workout' }: WorkoutTypeDialogProps) {
    const router = useRouter()
    const { user, supabase } = useAuth()
    const notifications = useNotifications()
    const [selectedType, setSelectedType] = useState<string>('')
    const [showTemplates, setShowTemplates] = useState(false)
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showConflictDialog, setShowConflictDialog] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [templateToDelete, setTemplateToDelete] = useState<WorkoutTemplate | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (open) {
            setSelectedType('')
            setShowTemplates(false)
            setTemplates([])
            if (user && supabase) {
                WorkoutStorage.initialize(user, supabase)
            }
        }
    }, [open, user, supabase])

    const handleWorkoutSelect = async (workoutType: string, available: boolean) => {
        if (!available) return

        if (!user) {
            notifications.warning('Sign in required', {
                description: mode === 'quick-log' ? 'Please sign in to log workouts' : 'Please sign in to start workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            onOpenChange(false)
            return
        }

        if (!supabase) return

        setSelectedType(workoutType)

        if (mode === 'quick-log') {
            // For Quick Log, always show templates regardless of workout type
            try {
                setIsLoading(true)
                const workoutTemplates = await WorkoutStorage.getTemplates(workoutType as 'strength' | 'running' | 'yoga' | 'cycling')
                setTemplates(workoutTemplates)
                setShowTemplates(true)
            } catch (error) {
                console.error('Error loading templates:', error)
                // For Quick Log, proceed to Quick Log page without template
                await navigateToQuickLog(workoutType)
            } finally {
                setIsLoading(false)
            }
        } else {
            // For New Workout, keep existing logic
            if (workoutType === 'strength') {
                try {
                    setIsLoading(true)
                    // Load templates for strength workouts
                    const strengthTemplates = await WorkoutStorage.getTemplates('strength')
                    setTemplates(strengthTemplates)
                    setShowTemplates(true)
                } catch (error) {
                    console.error('Error loading templates:', error)
                    // Fallback to direct workout creation
                    await createWorkoutDirectly(workoutType)
                } finally {
                    setIsLoading(false)
                }
            } else {
                await createWorkoutDirectly(workoutType)
            }
        }
    }

    const navigateToQuickLog = async (workoutType: string, templateId?: string) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to log workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            onOpenChange(false)
            return
        }

        try {
            // Create quick log ID and navigate to quick log page
            const timestamp = Date.now()
            const userIdSuffix = user?.id ? user.id.slice(-8) : Math.random().toString(36).slice(-8)
            const quickLogId = `quicklog-${timestamp}-${userIdSuffix}`

            // Build URL with query parameters
            const searchParams = new URLSearchParams()
            searchParams.set('type', workoutType)
            if (templateId) {
                searchParams.set('template', templateId)
            }

            router.push(`/workout/quick-log/${quickLogId}?${searchParams.toString()}`)
            onOpenChange(false)
        } catch (error) {
            console.error('Error starting quick log:', error)
        }
    }

    const createWorkoutDirectly = async (workoutType: string) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to start workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            onOpenChange(false)
            return
        }

        try {
            setIsLoading(true)

            // Check if there's an existing ongoing workout
            const existingWorkout = await WorkoutStorage.getOngoingWorkout()
            if (existingWorkout) {
                // Clear existing workout
                await WorkoutStorage.clearOngoingWorkout()
            }

            // Create new workout and navigate to it
            const timestamp = Date.now()
            const userIdSuffix = user?.id ? user.id.slice(-8) : Math.random().toString(36).slice(-8)
            const workoutId = `${workoutType}-${timestamp}-${userIdSuffix}`
            const newWorkout = WorkoutStorage.createWorkout(workoutType as 'strength' | 'running' | 'yoga' | 'cycling', workoutId)
            await WorkoutStorage.saveOngoingWorkout(newWorkout)

            router.push(`/workout/${workoutType}/${workoutId}`)
            onOpenChange(false)
        } catch (error) {
            console.error('Error creating workout:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleTemplateSelect = async (template: WorkoutTemplate) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: mode === 'quick-log' ? 'Please sign in to log workouts' : 'Please sign in to start workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            onOpenChange(false)
            return
        }

        try {
            setIsLoading(true)

            if (mode === 'quick-log') {
                // For Quick Log, navigate to Quick Log page with template
                await navigateToQuickLog(selectedType, template.id)
            } else {
                // For New Workout, create workout from template
                // Check if there's an existing ongoing workout
                const existingWorkout = await WorkoutStorage.getOngoingWorkout()
                if (existingWorkout) {
                    await WorkoutStorage.clearOngoingWorkout()
                }

                // Create workout from template
                const timestamp = Date.now()
                const userIdSuffix = user?.id ? user.id.slice(-8) : Math.random().toString(36).slice(-8)
                const workoutId = `${template.type}-${timestamp}-${userIdSuffix}`
                await WorkoutStorage.createWorkoutFromTemplate(template, workoutId)

                router.push(`/workout/${template.type}/${workoutId}`)
                onOpenChange(false)
            }
        } catch (error) {
            console.error('Error handling template selection:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartEmpty = () => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: mode === 'quick-log' ? 'Please sign in to log workouts' : 'Please sign in to start workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            onOpenChange(false)
            return
        }

        if (mode === 'quick-log') {
            navigateToQuickLog(selectedType)
        } else {
            createWorkoutDirectly(selectedType)
        }
    }

    const handleBack = () => {
        setShowTemplates(false)
        setSelectedType('')
        setTemplates([])
    }

    const startNewWorkout = (workoutType: string) => {
        if (!user) {
            notifications.warning('Sign in required', {
                description: 'Please sign in to start workouts',
                duration: 4000,
                action: {
                    label: 'Sign In',
                    onClick: () => router.push('/auth/signin')
                }
            })
            onOpenChange(false)
            return
        }

        const timestamp = Date.now()
        const userIdSuffix = user?.id ? user.id.slice(-8) : Math.random().toString(36).slice(-8)
        const workoutId = `${workoutType}-${timestamp}-${userIdSuffix}`
        router.push(`/workout/${workoutType}/${workoutId}`)
        onOpenChange(false)
        setShowConflictDialog(false)
    }

    const handleFinishAndStart = async () => {
        try {
            await WorkoutStorage.clearOngoingWorkout()
            startNewWorkout(selectedType)
        } catch (error) {
            console.error('Error finishing current workout:', error)
            // Proceed with new workout anyway
            startNewWorkout(selectedType)
        }
    }

    const handleKeepCurrent = () => {
        setShowConflictDialog(false)
        onOpenChange(false)
    }

    const handleDeleteTemplate = async (template: WorkoutTemplate) => {
        setTemplateToDelete(template)
        setShowDeleteConfirm(true)
    }

    const confirmDeleteTemplate = async () => {
        if (!templateToDelete || !user) return

        setIsDeleting(true)
        try {
            await WorkoutStorage.deleteTemplate(templateToDelete.id)

            // Remove from local state
            setTemplates(prevTemplates =>
                prevTemplates.filter(t => t.id !== templateToDelete.id)
            )

            setShowDeleteConfirm(false)
            setTemplateToDelete(null)
        } catch (error) {
            console.error('Error deleting template:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    const cancelDeleteTemplate = () => {
        setShowDeleteConfirm(false)
        setTemplateToDelete(null)
    }


    return (
        <>
            <Dialog open={open && !showConflictDialog && !showTemplates} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle>
                            {mode === 'quick-log' ? 'Choose Workout Type' : 'Choose Workout Type'}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === 'quick-log'
                                ? 'Select the type of workout you want to log'
                                : 'Select the type of workout you want to start'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-3">
                        {getWorkoutTypes().map((workout) => (
                            <button
                                key={workout.id}
                                onClick={() => handleWorkoutSelect(workout.id, workout.available)}
                                disabled={!workout.available}
                                className={cn(
                                    "flex items-center space-x-4 p-4 rounded-[14px] border transition-all text-left",
                                    "bg-[#0E0F13] border-[#212227]",
                                    workout.available
                                        ? "hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                                        : "opacity-45 cursor-not-allowed",
                                    selectedType === workout.id && "border-[#2A8CEA] bg-[rgba(42,140,234,0.10)]"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-[10px] flex items-center justify-center",
                                    "bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]",
                                    workout.color
                                )}>
                                    {workout.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-semibold text-[#F3F4F6] text-sm">
                                            {workout.name}
                                        </h3>
                                        {workout.available && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-[rgba(42,140,234,0.25)] text-[#4AA7FF] rounded-full border border-[rgba(42,140,234,0.35)]">
                                                Active
                                            </span>
                                        )}
                                        {!workout.available && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-[rgba(161,161,170,0.25)] text-[#A1A1AA] rounded-full border border-[rgba(161,161,170,0.35)]">
                                                In Development
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#A1A1AA] mt-1">
                                        {workout.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Template Selection Dialog */}
            <Dialog open={open && showTemplates && !showConflictDialog} onOpenChange={(open) => !open && handleBack()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader className="mb-4">
                        <DialogTitle>Choose Template</DialogTitle>
                        <DialogDescription>
                            {mode === 'quick-log'
                                ? 'Select a template to pre-fill your quick log or start from scratch'
                                : 'Select a pre-made workout template or start with an empty workout'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8CEA]"></div>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] -mx-2 px-2">
                            <div className="space-y-3">
                                {/* Empty workout option */}
                                <button
                                    onClick={handleStartEmpty}
                                    className="w-full flex items-center space-x-4 p-4 rounded-[14px] border bg-[#0E0F13] border-[#212227] hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all text-left"
                                >
                                    <div className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]">
                                        <Dumbbell className="w-8 h-8 text-[#9BE15D]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[#F3F4F6] text-sm">
                                            {mode === 'quick-log' ? 'Start from Scratch' : 'Empty Workout'}
                                        </h3>
                                        <p className="text-xs text-[#A1A1AA] mt-1">
                                            {mode === 'quick-log'
                                                ? 'Create a quick log without using a template'
                                                : 'Start fresh and add exercises as you go'
                                            }
                                        </p>
                                    </div>
                                </button>

                                {/* Templates */}
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="w-full flex items-center space-x-4 p-4 rounded-[14px] border bg-[#0E0F13] border-[#212227] hover:border-[#2A2B31] hover:bg-[#17181D] transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]">
                                            <Target className="w-8 h-8 text-[#9BE15D]" />
                                        </div>
                                        <button
                                            onClick={() => handleTemplateSelect(template)}
                                            className="flex-1 cursor-pointer text-left hover:scale-[1.01] active:scale-[0.99] transition-all"
                                        >
                                            <h3 className="font-semibold text-[#F3F4F6] text-sm">{template.name}</h3>
                                            <p className="text-xs text-[#A1A1AA] mt-1">
                                                {template.exercises?.length || 0} exercises
                                            </p>
                                        </button>
                                        {/* Delete button - only show for user templates (not built-in) */}
                                        {!template.isBuiltIn && (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteTemplate(template)
                                                }}
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-8 h-8"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}

                    <div className="flex justify-between space-x-2 mt-6">
                        <Button
                            variant="secondary"
                            onClick={handleBack}
                            className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                        >
                            Back
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Conflict Resolution Dialog */}
            <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <DialogTitle>Ongoing Workout Detected</DialogTitle>
                                <DialogDescription>
                                    You have an active workout in progress. What would you like to do?
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Button
                            onClick={handleFinishAndStart}
                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                        >
                            Finish Current & Start New
                        </Button>
                        <Button
                            onClick={handleKeepCurrent}
                            variant="outline"
                            className="w-full bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                        >
                            Keep Current Workout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Template Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <DialogTitle>Delete Template</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex justify-end space-x-2">
                        <Button
                            onClick={cancelDeleteTemplate}
                            variant="secondary"
                            className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteTemplate}
                            variant="destructive"
                            className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full hover:from-red-500 hover:to-red-400"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}