"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Dumbbell, Target, Heart, Bike, Plus, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkoutStorageSupabase, WorkoutTemplate } from "@/lib/workout-storage-supabase"
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

    useEffect(() => {
        if (open) {
            setSelectedType('')
            setShowTemplates(false)
        }
    }, [open])

    // Initialize WorkoutStorageSupabase when dialog opens
    useEffect(() => {
        if (open && user && supabase) {
            console.log('Initializing WorkoutStorageSupabase in dialog for user:', user.id)
            WorkoutStorageSupabase.initialize(user, supabase)
        }
    }, [open, user, supabase])

    const handleWorkoutSelect = async (workoutType: string, available: boolean) => {
        if (!available) return

        setSelectedType(workoutType)

        if (workoutType === 'strength') {
            try {
                // Ensure we have user context before loading templates
                if (!user || !supabase) {
                    console.error('No user or supabase client available for template loading')
                    // Fallback to creating workout directly
                    const workoutId = `${workoutType}-${Date.now()}`
                    router.push(`/workout/${workoutType}/${workoutId}`)
                    onOpenChange(false)
                    return
                }

                console.log('Loading strength templates for user:', user.id)
                // Show templates for strength workouts
                const strengthTemplates = await WorkoutStorageSupabase.getTemplates('strength')
                console.log('Loaded strength templates:', {
                    count: strengthTemplates.length,
                    templates: strengthTemplates.map(t => ({
                        id: t.id,
                        name: t.name,
                        exerciseCount: t.exercises.length,
                        isBuiltIn: t.isBuiltIn,
                        userId: t.userId
                    }))
                })
                setTemplates(strengthTemplates)
                setShowTemplates(true)
            } catch (error) {
                console.error('Failed to load templates:', error)
                // Fallback to creating workout directly
                const workoutId = `${workoutType}-${Date.now()}`
                router.push(`/workout/${workoutType}/${workoutId}`)
                onOpenChange(false)
            }
        } else {
            // For other types, create workout directly (when available)
            const workoutId = `${workoutType}-${Date.now()}`
            router.push(`/workout/${workoutType}/${workoutId}`)
            onOpenChange(false)
        }
    }

    const handleTemplateSelect = async (template: WorkoutTemplate) => {
        try {
            console.log('Creating workout from template:', template.name, template.id, template.exercises.length)
            // Generate a consistent workout ID based on template and timestamp
            const workoutId = `${template.type}-${Date.now()}`
            const workout = await WorkoutStorageSupabase.createWorkoutFromTemplate(template, workoutId)
            console.log('Created workout:', workout.id, workout.exercises.length)
            router.push(`/workout/${template.type}/${workout.id}`)
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to create workout from template:', error)
        }
    }

    const handleStartEmpty = () => {
        const workoutId = `${selectedType}-${Date.now()}`
        router.push(`/workout/${selectedType}/${workoutId}`)
        onOpenChange(false)
    }

    const handleBack = () => {
        setShowTemplates(false)
        setSelectedType('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-md", showTemplates && "sm:max-w-lg")}>
                <DialogHeader className="mb-4">
                    {showTemplates ? (
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBack}
                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <DialogTitle>Choose Template</DialogTitle>
                                <DialogDescription>
                                    Select a template or start with an empty workout
                                </DialogDescription>
                            </div>
                        </div>
                    ) : (
                        <>
                            <DialogTitle>Choose Workout Type</DialogTitle>
                            <DialogDescription>
                                Select the type of workout you want to start
                            </DialogDescription>
                        </>
                    )}
                </DialogHeader>

                {showTemplates ? (
                    <div className="space-y-4">
                        {/* Start Empty Option */}
                        <button
                            onClick={handleStartEmpty}
                            className="w-full flex items-center space-x-4 p-4 rounded-[14px] border transition-all text-left bg-[#0E0F13] border-[#212227] hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <div className="w-12 h-12 rounded-[10px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] text-[#9BE15D]">
                                <Plus className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[#F3F4F6] text-sm">
                                    Start Empty Workout
                                </h3>
                                <p className="text-xs text-[#A1A1AA] mt-1">
                                    Create a custom workout from scratch
                                </p>
                            </div>
                        </button>

                        {/* Template List */}
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className="w-full flex items-center justify-between p-3 rounded-[14px] border transition-all text-left bg-[#0E0F13] border-[#212227] hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-[#F3F4F6] text-sm">
                                                {template.name}
                                            </h3>
                                            {template.isBuiltIn && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-[rgba(155,225,93,0.25)] text-[#9BE15D] rounded-full border border-[rgba(155,225,93,0.35)]">
                                                    Built-in
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#A1A1AA] mt-1">
                                            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Dumbbell className="w-4 h-4 text-[#9BE15D]" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
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
                )}

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
    )
}