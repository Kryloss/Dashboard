"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NutritionStorage, NutritionEntry, Food } from "@/lib/nutrition-storage"
import { AddMealDialog } from "../../nutrition/components/add-meal-dialog"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import {
    X,
    Plus,
    Trash2,
    Coffee,
    Sandwich,
    ChefHat,
    Cookie,
    Flame
} from "lucide-react"
import { format } from "date-fns"

interface NutritionEditModalProps {
    date: string
    nutritionEntry: NutritionEntry | null
    onClose: () => void
    onSave: (updatedEntry: NutritionEntry | null) => void
}

export function NutritionEditModal({ date, nutritionEntry: initialEntry, onClose, onSave }: NutritionEditModalProps) {
    const { user } = useAuth()
    const notifications = useNotifications()

    const [nutritionEntry, setNutritionEntry] = useState<NutritionEntry | null>(initialEntry)
    const [isLoading, setIsLoading] = useState(false)

    // Add food dialog state
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null)
    const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false)

    const getMealIcon = (mealType: string) => {
        switch (mealType) {
            case 'breakfast': return <Coffee className="w-4 h-4" />
            case 'lunch': return <Sandwich className="w-4 h-4" />
            case 'dinner': return <ChefHat className="w-4 h-4" />
            case 'snacks': return <Cookie className="w-4 h-4" />
            default: return <Coffee className="w-4 h-4" />
        }
    }

    const getMealDisplayName = (mealType: string) => {
        const names = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks'
        }
        return names[mealType as keyof typeof names] || mealType
    }

    const handleAddFood = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
        setSelectedMealType(mealType)
        setIsAddFoodDialogOpen(true)
    }

    const closeAddFoodDialog = () => {
        setIsAddFoodDialogOpen(false)
        setSelectedMealType(null)
    }

    const handleFoodAdded = async (food: Food, quantity: number, notes?: string) => {
        if (!selectedMealType || !user) return

        try {
            setIsLoading(true)
            let currentEntry = nutritionEntry

            if (!currentEntry) {
                currentEntry = {
                    id: `nutrition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    userId: user.id,
                    date: date,
                    meals: [],
                    totalCalories: 0,
                    totalMacros: { carbs: 0, protein: 0, fats: 0 },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            }

            const adjustedCalories = Math.round(food.caloriesPerServing * quantity)
            const adjustedMacros = {
                carbs: food.macros.carbs * quantity,
                protein: food.macros.protein * quantity,
                fats: food.macros.fats * quantity,
                fiber: (food.macros.fiber || 0) * quantity,
                sugar: (food.macros.sugar || 0) * quantity,
                sodium: (food.macros.sodium || 0) * quantity
            }

            const foodEntry = {
                id: `food-entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                foodId: food.id,
                food: food,
                quantity: quantity,
                adjustedCalories: adjustedCalories,
                adjustedMacros: adjustedMacros,
                notes: notes,
                createdAt: new Date().toISOString()
            }

            let meal = currentEntry.meals.find(m => m.type === selectedMealType)
            if (!meal) {
                meal = NutritionStorage.createEmptyMeal(selectedMealType)
                currentEntry.meals.push(meal)
            }

            meal.foods.push(foodEntry)

            const mealTotals = NutritionStorage.calculateMealTotals(meal)
            meal.totalCalories = mealTotals.calories
            meal.totalMacros = mealTotals.macros

            currentEntry.totalCalories = currentEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            currentEntry.totalMacros = {
                carbs: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: currentEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: currentEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            const savedEntry = await NutritionStorage.saveNutritionEntry(currentEntry)
            setNutritionEntry(savedEntry)
            closeAddFoodDialog()

        } catch (error) {
            console.error('Error adding food:', error)
            notifications.error('Add food failed', {
                description: 'Unable to add food. Please try again.',
                duration: 4000
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteFood = async (mealType: string, foodEntryId: string) => {
        if (!nutritionEntry || !user) return

        try {
            setIsLoading(true)
            const updatedEntry = { ...nutritionEntry }
            const meal = updatedEntry.meals.find(m => m.type === mealType)

            if (!meal) return

            meal.foods = meal.foods.filter(f => f.id !== foodEntryId)

            const mealTotals = NutritionStorage.calculateMealTotals(meal)
            meal.totalCalories = mealTotals.calories
            meal.totalMacros = mealTotals.macros

            updatedEntry.totalCalories = updatedEntry.meals.reduce((sum, m) => sum + m.totalCalories, 0)
            updatedEntry.totalMacros = {
                carbs: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.carbs, 0),
                protein: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.protein, 0),
                fats: updatedEntry.meals.reduce((sum, m) => sum + m.totalMacros.fats, 0),
                fiber: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.fiber || 0), 0),
                sugar: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sugar || 0), 0),
                sodium: updatedEntry.meals.reduce((sum, m) => sum + (m.totalMacros.sodium || 0), 0)
            }

            const savedEntry = await NutritionStorage.saveNutritionEntry(updatedEntry)
            setNutritionEntry(savedEntry)

            notifications.success('Food removed', {
                description: 'Food removed from your nutrition log',
                duration: 3000
            })

        } catch (error) {
            console.error('Error removing food:', error)
            notifications.error('Remove failed', {
                description: 'Unable to remove food. Please try again.',
                duration: 4000
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = () => {
        onSave(nutritionEntry)
        onClose()
    }

    return (
        <>
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#9BE15D] to-[#00E676] rounded-full flex items-center justify-center">
                                    <Flame className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-[#F3F4F6]">
                                        Edit Nutrition
                                    </DialogTitle>
                                    <p className="text-sm text-[#A1A1AA]">
                                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                size="icon"
                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        {/* Daily Summary */}
                        {nutritionEntry && (
                            <div className="bg-[#0E0F13] border border-[#212227] rounded-[20px] p-6 mb-6">
                                <h3 className="text-lg font-semibold text-[#F3F4F6] mb-4">Daily Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#F3F4F6]">{nutritionEntry.totalCalories}</div>
                                        <div className="text-sm text-[#A1A1AA]">Calories</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#FFA500]">{Math.round(nutritionEntry.totalMacros.carbs)}g</div>
                                        <div className="text-sm text-[#A1A1AA]">Carbs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#FF6B6B]">{Math.round(nutritionEntry.totalMacros.protein)}g</div>
                                        <div className="text-sm text-[#A1A1AA]">Protein</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#4ECDC4]">{Math.round(nutritionEntry.totalMacros.fats)}g</div>
                                        <div className="text-sm text-[#A1A1AA]">Fats</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Meals Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                                const meal = nutritionEntry?.meals.find(m => m.type === mealType)
                                const mealName = getMealDisplayName(mealType)

                                return (
                                    <div key={mealType} className="bg-[#0E0F13] border border-[#212227] rounded-[20px] p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center text-[#F3F4F6]">
                                                    {getMealIcon(mealType)}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-[#F3F4F6]">{mealName}</h3>
                                                    {meal && (
                                                        <p className="text-xs text-[#A1A1AA]">{meal.totalCalories} cal • {meal.foods.length} items</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleAddFood(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks')}
                                                variant="ghost"
                                                size="icon"
                                                className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-7 h-7"
                                                disabled={isLoading}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {meal ? (
                                            <div className="space-y-2">
                                                {meal.foods.map((food, index) => (
                                                    <div key={index} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)] group">
                                                        <div>
                                                            <p className="text-sm text-[#F3F4F6]">{food.food.name}</p>
                                                            <p className="text-xs text-[#7A7F86]">{food.adjustedCalories} cal</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleDeleteFood(mealType, food.id)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-6 h-6 text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-[#7A7F86]">No foods added yet</p>
                                                <p className="text-xs text-[#5A5F66] mt-1">Tap + to add food</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[#212227]">
                        <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-[#9BE15D] to-[#00E676] text-[#0B0B0F] rounded-full hover:shadow-lg disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Meal Dialog */}
            {selectedMealType && (
                <AddMealDialog
                    isOpen={isAddFoodDialogOpen}
                    onClose={closeAddFoodDialog}
                    mealType={selectedMealType}
                    onFoodAdded={handleFoodAdded}
                />
            )}
        </>
    )
}