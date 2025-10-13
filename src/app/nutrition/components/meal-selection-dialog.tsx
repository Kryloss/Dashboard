"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Coffee, Sandwich, ChefHat, Cookie } from "lucide-react"

interface MealSelectionDialogProps {
    isOpen: boolean
    onClose: () => void
    onMealSelected: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => void
}

export function MealSelectionDialog({
    isOpen,
    onClose,
    onMealSelected
}: MealSelectionDialogProps) {
    const meals = [
        { type: 'breakfast' as const, name: 'Breakfast', icon: Coffee },
        { type: 'lunch' as const, name: 'Lunch', icon: Sandwich },
        { type: 'dinner' as const, name: 'Dinner', icon: ChefHat },
        { type: 'snacks' as const, name: 'Snacks', icon: Cookie }
    ]

    const handleMealSelect = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
        onMealSelected(mealType)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0F101A] border-[#2A3442] text-[#F3F4F6] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-center">Select Meal</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    {meals.map((meal) => {
                        const Icon = meal.icon
                        return (
                            <Button
                                key={meal.type}
                                onClick={() => handleMealSelect(meal.type)}
                                className="h-24 flex flex-col items-center justify-center gap-2 bg-[#121318] border border-[#212227] hover:border-[#2A8CEA] hover:bg-[#1A1D21] text-[#F3F4F6] rounded-[16px] transition-all"
                                variant="ghost"
                            >
                                <div className="w-10 h-10 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[12px] flex items-center justify-center">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium">{meal.name}</span>
                            </Button>
                        )
                    })}
                </div>

                <Button
                    onClick={onClose}
                    variant="ghost"
                    className="mt-4 text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                >
                    Cancel
                </Button>
            </DialogContent>
        </Dialog>
    )
}
