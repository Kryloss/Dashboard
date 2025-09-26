"use client"

import { Button } from "@/components/ui/button"
import { NutritionEntry } from "@/lib/nutrition-storage"
import { Edit3, Calendar, Flame } from "lucide-react"

interface NutritionCardProps {
    date: string
    nutritionEntry: NutritionEntry | null
    onEdit: () => void
}

export function NutritionCard({ date, nutritionEntry, onEdit }: NutritionCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return "Today"
        if (diffDays === 2) return "Yesterday"
        if (diffDays <= 7) return `${diffDays - 1} days ago`

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
    }

    return (
        <div className="bg-[#121318] border border-[#212227] rounded-[20px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200 group">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                    {/* Nutrition Icon */}
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] text-[#9BE15D]">
                        <Flame className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-lg font-semibold text-[#F3F4F6] mb-1">
                                    Nutrition
                                </h3>
                                <div className="flex items-center space-x-4 text-xs text-[#9CA3AF]">
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(date)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {nutritionEntry ? (
                            <>
                                {/* Main Stats */}
                                <div className="mb-4">
                                    <div className="text-2xl font-bold text-[#F3F4F6] mb-1">
                                        {nutritionEntry.totalCalories} cal
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">
                                        {nutritionEntry.meals.length} meal{nutritionEntry.meals.length !== 1 ? 's' : ''} • {nutritionEntry.meals.reduce((sum, meal) => sum + meal.foods.length, 0)} items
                                    </div>
                                </div>

                                {/* Macro Breakdown */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-[#FFA500] mb-1">{Math.round(nutritionEntry.totalMacros.carbs)}g</div>
                                        <div className="text-xs text-[#A1A1AA]">Carbs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-[#FF6B6B] mb-1">{Math.round(nutritionEntry.totalMacros.protein)}g</div>
                                        <div className="text-xs text-[#A1A1AA]">Protein</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-[#4ECDC4] mb-1">{Math.round(nutritionEntry.totalMacros.fats)}g</div>
                                        <div className="text-xs text-[#A1A1AA]">Fats</div>
                                    </div>
                                </div>

                                {/* Meals Summary */}
                                {nutritionEntry.meals.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-[#2A2B31]">
                                        <div className="flex flex-wrap gap-1">
                                            {nutritionEntry.meals.map((meal, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded-md bg-[rgba(155,225,93,0.15)] text-xs font-medium text-[#9BE15D]"
                                                >
                                                    {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-sm text-[#7A7F86] mb-1">No data recorded</div>
                                <div className="text-xs text-[#5A5F66]">Click Edit to add nutrition data</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        onClick={onEdit}
                        variant="ghost"
                        size="icon"
                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-8 h-8"
                    >
                        <Edit3 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}