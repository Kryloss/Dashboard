"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WorkoutActivity, WorkoutExercise } from "@/lib/workout-storage"
import { X, Plus, GripVertical, Save, Clock } from "lucide-react"

interface ActivityEditModalProps {
    activity: WorkoutActivity
    onClose: () => void
    onSave: (updatedActivity: WorkoutActivity) => void
}

export function ActivityEditModal({ activity, onClose, onSave }: ActivityEditModalProps) {
    const [editedActivity, setEditedActivity] = useState<WorkoutActivity>({
        ...activity,
        exercises: JSON.parse(JSON.stringify(activity.exercises)) // Deep clone
    })
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        
        // Ensure the activity has a valid structure before saving
        const activityToSave = {
            ...editedActivity,
            // Ensure exercises have proper structure
            exercises: editedActivity.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(set => ({
                    ...set,
                    completed: set.completed || false
                }))
            }))
        }
        
        // Call the save function (optimistic update will happen in parent)
        onSave(activityToSave)
        // Note: Modal will close immediately due to optimistic update
    }

    const updateExercise = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
        setEditedActivity(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex =>
                ex.id === exerciseId ? { ...ex, ...updates } : ex
            )
        }))
    }

    const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutExercise['sets'][0], value: string | number | boolean) => {
        setEditedActivity(prev => ({
            ...prev,
            exercises: prev.exercises.map(exercise =>
                exercise.id === exerciseId
                    ? {
                        ...exercise,
                        sets: exercise.sets.map(set =>
                            set.id === setId ? { ...set, [field]: value } : set
                        )
                    }
                    : exercise
            )
        }))
    }

    const addSet = (exerciseId: string) => {
        const newSet = {
            id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            reps: '',
            weight: '',
            notes: '',
            completed: false,
            restTime: 60
        }

        setEditedActivity(prev => ({
            ...prev,
            exercises: prev.exercises.map(exercise =>
                exercise.id === exerciseId
                    ? { ...exercise, sets: [...exercise.sets, newSet] }
                    : exercise
            )
        }))
    }

    const removeSet = (exerciseId: string, setId: string) => {
        setEditedActivity(prev => ({
            ...prev,
            exercises: prev.exercises.map(exercise =>
                exercise.id === exerciseId
                    ? { ...exercise, sets: exercise.sets.filter(set => set.id !== setId) }
                    : exercise
            )
        }))
    }

    const addExercise = () => {
        const newExercise: WorkoutExercise = {
            id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '',
            description: '',
            category: 'general',
            targetMuscles: [],
            equipment: 'bodyweight',
            difficulty: 'beginner',
            restTime: 60,
            instructions: [],
            tips: [],
            alternatives: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sets: [{
                id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                reps: '',
                weight: '',
                notes: '',
                completed: false,
                restTime: 60
            }]
        }

        setEditedActivity(prev => ({
            ...prev,
            exercises: [...prev.exercises, newExercise]
        }))
    }

    const removeExercise = (exerciseId: string) => {
        setEditedActivity(prev => ({
            ...prev,
            exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
        }))
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    const parseDuration = (durationStr: string): number => {
        const hourMatch = durationStr.match(/(\d+)h/)
        const minuteMatch = durationStr.match(/(\d+)m/)

        const hours = hourMatch ? parseInt(hourMatch[1]) : 0
        const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0

        return (hours * 3600) + (minutes * 60)
    }

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-[#F3F4F6]">Edit Workout Activity</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 max-h-[calc(90vh-120px)]">
                    <div className="space-y-6 p-2">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="workout-name" className="text-[#A1A1AA]">Workout Name</Label>
                                <Input
                                    id="workout-name"
                                    value={editedActivity.name || ''}
                                    onChange={(e) => setEditedActivity(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter workout name..."
                                    className="mt-1 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px]"
                                />
                            </div>
                            <div>
                                <Label htmlFor="duration" className="text-[#A1A1AA]">Duration</Label>
                                <div className="relative mt-1">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] w-4 h-4" />
                                    <Input
                                        id="duration"
                                        value={formatDuration(editedActivity.durationSeconds)}
                                        onChange={(e) => {
                                            const newDuration = parseDuration(e.target.value)
                                            setEditedActivity(prev => ({ ...prev, durationSeconds: newDuration }))
                                        }}
                                        placeholder="e.g., 1h 30m or 45m"
                                        className="pl-10 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label htmlFor="notes" className="text-[#A1A1AA]">Notes</Label>
                            <Textarea
                                id="notes"
                                value={editedActivity.notes || ''}
                                onChange={(e) => setEditedActivity(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add any notes about this workout..."
                                className="mt-1 bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[14px] min-h-[80px]"
                            />
                        </div>

                        {/* Exercises */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-[#A1A1AA] text-lg">Exercises</Label>
                                <Button
                                    onClick={addExercise}
                                    className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Exercise
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {editedActivity.exercises.map((exercise) => (
                                    <div
                                        key={exercise.id}
                                        className="bg-[#0E0F13] border border-[#212227] rounded-[16px] p-4"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3 flex-1">
                                                <GripVertical className="w-5 h-5 text-[#A1A1AA] cursor-move" />
                                                <Input
                                                    value={exercise.name}
                                                    onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                                                    placeholder="Exercise name"
                                                    className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[10px] font-semibold"
                                                />
                                            </div>
                                            <Button
                                                onClick={() => removeExercise(exercise.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Sets */}
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-[#A1A1AA] px-2">
                                                <div className="col-span-1">Set</div>
                                                <div className="col-span-3">Reps</div>
                                                <div className="col-span-3">Weight</div>
                                                <div className="col-span-4">Notes</div>
                                                <div className="col-span-1"></div>
                                            </div>

                                            {exercise.sets.map((set, setIndex) => (
                                                <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                                                    <div className="col-span-1 text-center text-sm text-[#A1A1AA]">
                                                        {setIndex + 1}
                                                    </div>
                                                    <div className="col-span-3">
                                                        <Input
                                                            value={set.reps}
                                                            onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                                                            placeholder="12"
                                                            className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[8px] text-sm h-8"
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <Input
                                                            value={set.weight}
                                                            onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                                                            placeholder="135 lbs"
                                                            className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[8px] text-sm h-8"
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <Input
                                                            value={set.notes}
                                                            onChange={(e) => updateSet(exercise.id, set.id, 'notes', e.target.value)}
                                                            placeholder="Notes..."
                                                            className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] rounded-[8px] text-sm h-8"
                                                        />
                                                    </div>
                                                    <div className="col-span-1">
                                                        {exercise.sets.length > 1 && (
                                                            <Button
                                                                onClick={() => removeSet(exercise.id, set.id)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-8 h-8"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => addSet(exercise.id)}
                                            variant="ghost"
                                            className="w-full mt-3 text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-[10px] border-2 border-dashed border-[#212227] hover:border-[#2A2B31]"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Set
                                        </Button>
                                    </div>
                                ))}

                                {editedActivity.exercises.length === 0 && (
                                    <div className="text-center py-8 text-[#A1A1AA]">
                                        <p>No exercises yet. Click &quot;Add Exercise&quot; to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-[#212227]">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                        disabled={isSaving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}