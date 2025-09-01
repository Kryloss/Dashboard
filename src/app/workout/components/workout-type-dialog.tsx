"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Dumbbell, Target, Heart, Bike, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkoutStorage } from "@/lib/workout-storage"

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
    const [selectedType, setSelectedType] = useState<string>('')
    const [showConflictDialog, setShowConflictDialog] = useState(false)
    const [pendingWorkoutType, setPendingWorkoutType] = useState<string>('')

    useEffect(() => {
        if (open) {
            setSelectedType('')
            setShowConflictDialog(false)
        }
    }, [open])

    const handleWorkoutSelect = (workoutType: string, available: boolean) => {
        if (!available) return

        setSelectedType(workoutType)
        
        // Check if there's an ongoing workout
        const existingWorkout = WorkoutStorage.getOngoingWorkout()
        if (existingWorkout) {
            // Show conflict dialog
            setPendingWorkoutType(workoutType)
            setShowConflictDialog(true)
            return
        }
        
        // No conflict, create new workout
        startNewWorkout(workoutType)
    }
    
    const startNewWorkout = (workoutType: string) => {
        const workoutId = `${workoutType}-${Date.now()}`
        router.push(`/workout/${workoutType}/${workoutId}`)
        onOpenChange(false)
        setShowConflictDialog(false)
    }
    
    const handleFinishAndStart = () => {
        WorkoutStorage.clearOngoingWorkout()
        startNewWorkout(pendingWorkoutType)
    }
    
    const handleKeepCurrent = () => {
        setShowConflictDialog(false)
        onOpenChange(false)
    }


    return (
        <>
            <Dialog open={open && !showConflictDialog} onOpenChange={onOpenChange}>
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