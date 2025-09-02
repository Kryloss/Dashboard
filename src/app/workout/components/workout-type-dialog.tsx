"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Dumbbell, Target, Heart, Bike, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkoutStorage, WorkoutTemplate } from "@/lib/workout-storage"
import { useAuth } from "@/lib/hooks/useAuth"

interface WorkoutTypeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const workoutTypes = [
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
        icon: <Target className="w-8 h-8" />,
        available: false,
        color: 'text-[#FF2D55]'
    },
    {
        id: 'yoga',
        name: 'Yoga',
        description: 'Flexibility and mindfulness',
        icon: <Heart className="w-8 h-8" />,
        available: false,
        color: 'text-[#2BD2FF]'
    },
    {
        id: 'cycling',
        name: 'Cycling',
        description: 'Indoor and outdoor cycling',
        icon: <Bike className="w-8 h-8" />,
        available: false,
        color: 'text-[#FF375F]'
    }
]

export function WorkoutTypeDialog({ open, onOpenChange }: WorkoutTypeDialogProps) {
    const router = useRouter()
    const { user, supabase } = useAuth()
    const [selectedType, setSelectedType] = useState<string>('')
    const [showTemplates, setShowTemplates] = useState(false)
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showConflictDialog, setShowConflictDialog] = useState(false)

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
        if (!available || !user || !supabase) return

        setSelectedType(workoutType)

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

    const createWorkoutDirectly = async (workoutType: string) => {
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
        try {
            setIsLoading(true)

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
        } catch (error) {
            console.error('Error creating workout from template:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartEmpty = () => {
        createWorkoutDirectly(selectedType)
    }

    const handleBack = () => {
        setShowTemplates(false)
        setSelectedType('')
        setTemplates([])
    }

    const startNewWorkout = (workoutType: string) => {
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


    return (
        <>
            <Dialog open={open && !showConflictDialog && !showTemplates} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle>Choose Workout Type</DialogTitle>
                        <DialogDescription>
                            Select the type of workout you want to start
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-3">
                        {workoutTypes.map((workout) => (
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
                            Select a pre-made workout template or start with an empty workout
                        </DialogDescription>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8CEA]"></div>
                        </div>
                    ) : (
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
                                    <h3 className="font-semibold text-[#F3F4F6] text-sm">Empty Workout</h3>
                                    <p className="text-xs text-[#A1A1AA] mt-1">Start fresh and add exercises as you go</p>
                                </div>
                            </button>

                            {/* Templates */}
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className="w-full flex items-center space-x-4 p-4 rounded-[14px] border bg-[#0E0F13] border-[#212227] hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all text-left"
                                >
                                    <div className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]">
                                        <Target className="w-8 h-8 text-[#9BE15D]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[#F3F4F6] text-sm">{template.name}</h3>
                                        <p className="text-xs text-[#A1A1AA] mt-1">
                                            {template.exercises?.length || 0} exercises
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
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
        </>
    )
}