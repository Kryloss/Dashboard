"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FoodEntry } from "@/lib/nutrition-storage"
import { Edit3 } from "lucide-react"

interface EditFoodDialogProps {
    isOpen: boolean
    onClose: () => void
    foodEntry: FoodEntry
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
    onFoodUpdated: (updatedFoodEntry: FoodEntry) => Promise<void>
}

export function EditFoodDialog({ isOpen, onClose, foodEntry, mealType, onFoodUpdated }: EditFoodDialogProps) {
    // Helper function to format numbers to 1 decimal place, removing .0 for whole numbers
    const formatNutrientValue = (value: number): string => {
        const rounded = Math.round(value * 10) / 10
        return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)
    }

    const [quantity, setQuantity] = useState(foodEntry.quantity)
    const [notes, setNotes] = useState(foodEntry.notes || "")
    const [isLoading, setIsLoading] = useState(false)

    // Reset form when foodEntry changes
    useEffect(() => {
        setQuantity(foodEntry.quantity)
        setNotes(foodEntry.notes || "")
    }, [foodEntry])

    const handleSave = async () => {
        if (quantity <= 0) return

        setIsLoading(true)
        try {
            // Create updated food entry with recalculated values
            const updatedFoodEntry: FoodEntry = {
                ...foodEntry,
                quantity: quantity,
                notes: notes,
                adjustedCalories: Math.round(foodEntry.food.caloriesPerServing * quantity),
                adjustedMacros: {
                    carbs: foodEntry.food.macros.carbs * quantity,
                    protein: foodEntry.food.macros.protein * quantity,
                    fats: foodEntry.food.macros.fats * quantity,
                    fiber: (foodEntry.food.macros.fiber || 0) * quantity,
                    sugar: (foodEntry.food.macros.sugar || 0) * quantity,
                    sodium: (foodEntry.food.macros.sodium || 0) * quantity
                }
            }

            await onFoodUpdated(updatedFoodEntry)
            onClose()
        } catch (error) {
            console.error('Error updating food:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getMealDisplayName = () => {
        const names = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks'
        }
        return names[mealType]
    }

    const calculatedCalories = Math.round(foodEntry.food.caloriesPerServing * quantity)
    const calculatedCarbs = formatNutrientValue(foodEntry.food.macros.carbs * quantity)
    const calculatedProtein = formatNutrientValue(foodEntry.food.macros.protein * quantity)
    const calculatedFats = formatNutrientValue(foodEntry.food.macros.fats * quantity)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#9BE15D] to-[#00E676] rounded-full flex items-center justify-center">
                            <Edit3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-[#F3F4F6]">
                                Edit Food
                            </DialogTitle>
                            <p className="text-sm text-[#A1A1AA]">
                                {getMealDisplayName()} • {foodEntry.food.name}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Food Info */}
                    <div className="bg-[#0E0F13] border border-[#212227] rounded-[12px] p-4">
                        <h3 className="text-base font-semibold text-[#F3F4F6] mb-2">{foodEntry.food.name}</h3>
                        {foodEntry.food.brand && (
                            <p className="text-sm text-[#A1A1AA] mb-2">{foodEntry.food.brand}</p>
                        )}
                        <p className="text-sm text-[#7A7F86]">
                            {foodEntry.food.servingSize}{foodEntry.food.servingUnit} per serving • {foodEntry.food.caloriesPerServing} cal
                        </p>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-medium text-[#F3F4F6]">
                            Quantity (servings)
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            min="0.1"
                            step="0.1"
                            className="bg-[#121318] border-[#212227] text-[#F3F4F6] focus:border-[#9BE15D]"
                        />
                    </div>

                    {/* Calculated Nutrition */}
                    <div className="bg-[#0E0F13] border border-[#212227] rounded-[12px] p-4">
                        <h4 className="text-sm font-medium text-[#F3F4F6] mb-3">Nutrition (for {formatNutrientValue(quantity)} servings)</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-[#A1A1AA]">Calories:</span>
                                <span className="ml-2 font-medium text-[#F3F4F6]">{calculatedCalories}</span>
                            </div>
                            <div>
                                <span className="text-[#A1A1AA]">Carbs:</span>
                                <span className="ml-2 font-medium text-[#FFA500]">{calculatedCarbs}g</span>
                            </div>
                            <div>
                                <span className="text-[#A1A1AA]">Protein:</span>
                                <span className="ml-2 font-medium text-[#FF6B6B]">{calculatedProtein}g</span>
                            </div>
                            <div>
                                <span className="text-[#A1A1AA]">Fats:</span>
                                <span className="ml-2 font-medium text-[#4ECDC4]">{calculatedFats}g</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Input */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-[#F3F4F6]">
                            Notes (optional)
                        </Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this food..."
                            className="bg-[#121318] border-[#212227] text-[#F3F4F6] focus:border-[#9BE15D]"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-[#212227]">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-[#9BE15D] to-[#00E676] text-[#0B0B0F] rounded-full hover:shadow-lg disabled:opacity-50"
                        disabled={isLoading || quantity <= 0}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}