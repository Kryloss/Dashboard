"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dumbbell, Run, Heart, Bike, FileText, Plus, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkoutStorage, WorkoutTemplate } from "@/lib/workout-storage"
import { useAuth } from "@/lib/hooks/useAuth"

interface QuickLogSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProceedToQuickLog?: (workoutType: string, templateId?: string) => void
}

const workoutTypes = [
    {
        id: 'strength',
        name: 'Strength Training',
        description: 'Weight lifting and resistance training',
        icon: <Dumbbell className="w-6 h-6" />,
        color: 'text-[#9BE15D]'
    },
    {
        id: 'running',
        name: 'Running',
        description: 'Cardio and endurance training',
        icon: <Run className="w-6 h-6" />,
        color: 'text-[#FF2D55]'
    },
    {
        id: 'yoga',
        name: 'Yoga',
        description: 'Flexibility and mindfulness',
        icon: <Heart className="w-6 h-6" />,
        color: 'text-[#2BD2FF]'
    },
    {
        id: 'cycling',
        name: 'Cycling',
        description: 'Indoor and outdoor cycling',
        icon: <Bike className="w-6 h-6" />,
        color: 'text-[#FF375F]'
    }
]

export function QuickLogSelectionDialog({ open, onOpenChange, onProceedToQuickLog }: QuickLogSelectionDialogProps) {
    const { user, supabase } = useAuth()
    const [selectedType, setSelectedType] = useState<string>('')
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
    const [step, setStep] = useState<'type' | 'template'>('type')

    const loadTemplates = useCallback(async () => {
        if (!user || !supabase) return

        setIsLoadingTemplates(true)
        try {
            // Initialize storage
            WorkoutStorage.initialize(user, supabase)

            // Get templates for the selected workout type
            const userTemplates = await WorkoutStorage.getTemplates(selectedType as 'strength' | 'running' | 'yoga' | 'cycling')
            setTemplates(userTemplates)
        } catch (error) {
            console.error('Error loading templates:', error)
            setTemplates([])
        } finally {
            setIsLoadingTemplates(false)
        }
    }, [user, supabase, selectedType])

    // Load templates when workout type is selected
    useEffect(() => {
        if (selectedType && user && supabase) {
            loadTemplates()
        }
    }, [selectedType, user, supabase, loadTemplates])

    const handleClose = () => {
        // Reset state
        setSelectedType('')
        setSelectedTemplate('')
        setTemplates([])
        setStep('type')
        onOpenChange(false)
    }

    const handleWorkoutTypeSelect = (typeId: string) => {
        setSelectedType(typeId)
        setSelectedTemplate('')
        setStep('template')
    }

    const handleBackToType = () => {
        setStep('type')
        setSelectedTemplate('')
    }

    const handleProceed = () => {
        if (selectedType && onProceedToQuickLog) {
            onProceedToQuickLog(selectedType, selectedTemplate || undefined)
            handleClose()
        }
    }

    const selectedWorkoutType = workoutTypes.find(type => type.id === selectedType)

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader className="mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[14px] flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#F3F4F6]" />
                        </div>
                        <div>
                            <DialogTitle>
                                {step === 'type' ? 'Choose Workout Type' : 'Choose Template (Optional)'}
                            </DialogTitle>
                            <DialogDescription>
                                {step === 'type'
                                    ? 'Select the type of workout you want to log'
                                    : `Select a ${selectedWorkoutType?.name.toLowerCase()} template or start from scratch`
                                }
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0">
                    {step === 'type' && (
                        <div className="space-y-3">
                            {workoutTypes.map((workout) => (
                                <button
                                    key={workout.id}
                                    onClick={() => handleWorkoutTypeSelect(workout.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-[12px] border transition-all text-left",
                                        "bg-[#0E0F13] border-[#212227]",
                                        "hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                                    )}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-[10px] flex items-center justify-center",
                                            "bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]",
                                            workout.color
                                        )}>
                                            {workout.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[#F3F4F6] text-sm">
                                                {workout.name}
                                            </h3>
                                            <p className="text-xs text-[#A1A1AA] mt-0.5">
                                                {workout.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[#A1A1AA]" />
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'template' && (
                        <div className="space-y-4">
                            {/* Back button */}
                            <Button
                                onClick={handleBackToType}
                                variant="ghost"
                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full px-3"
                            >
                                ← Back to Workout Types
                            </Button>

                            {/* Selected workout type indicator */}
                            <div className="flex items-center space-x-3 p-3 bg-[rgba(42,140,234,0.10)] border border-[rgba(42,140,234,0.20)] rounded-[10px]">
                                <div className={cn(
                                    "w-8 h-8 rounded-[8px] flex items-center justify-center",
                                    "bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]",
                                    selectedWorkoutType?.color
                                )}>
                                    {selectedWorkoutType?.icon}
                                </div>
                                <div>
                                    <h4 className="font-medium text-[#F3F4F6] text-sm">
                                        {selectedWorkoutType?.name}
                                    </h4>
                                </div>
                            </div>

                            {/* Template selection */}
                            <div>
                                <Label className="text-sm font-medium text-[#F3F4F6] mb-3 block">Templates</Label>

                                <ScrollArea className="max-h-[200px]">
                                    <div className="space-y-2">
                                        {/* Start from scratch option */}
                                        <button
                                            onClick={() => setSelectedTemplate('')}
                                            className={cn(
                                                "w-full flex items-center space-x-3 p-3 rounded-[10px] border transition-all text-left",
                                                "bg-[#0E0F13] border-[#212227]",
                                                "hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
                                                selectedTemplate === '' && "border-[#2A8CEA] bg-[rgba(42,140,234,0.10)]"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]">
                                                <Plus className="w-4 h-4 text-[#A1A1AA]" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-[#F3F4F6] text-sm">
                                                    Start from scratch
                                                </h3>
                                                <p className="text-xs text-[#A1A1AA] mt-0.5">
                                                    Create a new workout without a template
                                                </p>
                                            </div>
                                        </button>

                                        {isLoadingTemplates ? (
                                            <div className="flex items-center justify-center py-6">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2A8CEA]"></div>
                                            </div>
                                        ) : templates.length === 0 ? (
                                            <div className="text-center py-6 text-[#A1A1AA]">
                                                <p className="text-sm">No templates found for {selectedWorkoutType?.name.toLowerCase()}</p>
                                                <p className="text-xs mt-1">You can create templates by saving workouts</p>
                                            </div>
                                        ) : (
                                            templates.map((template) => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => setSelectedTemplate(template.id)}
                                                    className={cn(
                                                        "w-full flex items-center space-x-3 p-3 rounded-[10px] border transition-all text-left",
                                                        "bg-[#0E0F13] border-[#212227]",
                                                        "hover:border-[#2A2B31] hover:bg-[#17181D] cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
                                                        selectedTemplate === template.id && "border-[#2A8CEA] bg-[rgba(42,140,234,0.10)]"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-[8px] flex items-center justify-center",
                                                        "bg-[rgba(255,255,255,0.03)] border border-[#2A2B31]",
                                                        selectedWorkoutType?.color
                                                    )}>
                                                        {selectedWorkoutType?.icon && React.cloneElement(selectedWorkoutType.icon, { className: "w-4 h-4" })}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-[#F3F4F6] text-sm truncate">
                                                            {template.name}
                                                        </h3>
                                                        <p className="text-xs text-[#A1A1AA] mt-0.5">
                                                            {template.exercises?.length || 0} exercises
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 pt-4 border-t border-[#212227]">
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                    >
                        Cancel
                    </Button>
                    {step === 'template' && (
                        <Button
                            onClick={handleProceed}
                            disabled={!selectedType}
                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue to Quick Log
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}