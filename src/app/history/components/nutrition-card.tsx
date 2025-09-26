"use client"

import { Button } from "@/components/ui/button"
import { NutritionEntry } from "@/lib/nutrition-storage"
import { Edit3, Calendar, Flame, Trash2 } from "lucide-react"

interface NutritionCardProps {
    date: string
    nutritionEntry: NutritionEntry | null
    onEdit: () => void
    onDelete: () => void
}

export function NutritionCard({ date, nutritionEntry, onEdit, onDelete }: NutritionCardProps) {
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
        <div className="bg-[#121318] border border-[#212227] rounded-[16px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)] hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)] transition-all duration-200 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                    {/* Nutrition Icon */}
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] text-[#9BE15D]">
                        <Flame className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <h3 className="text-base font-semibold text-[#F3F4F6]">
                                    Nutrition
                                </h3>
                                <div className="flex items-center space-x-1 text-xs text-[#9CA3AF]">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(date)}</span>
                                </div>
                            </div>
                        </div>

                        {nutritionEntry ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    {/* Main Stats */}
                                    <div className="flex items-center space-x-1">
                                        <span className="text-xl font-bold text-[#F3F4F6]">{nutritionEntry.totalCalories}</span>
                                        <span className="text-sm text-[#A1A1AA]">calories</span>
                                    </div>

                                    {/* Macro Breakdown */}
                                    <div className="flex items-center space-x-4 text-sm">
                                        <div className="flex items-center space-x-1">
                                            <span className="font-semibold text-[#FFA500]">{Math.round(nutritionEntry.totalMacros.carbs)}g</span>
                                            <span className="text-[#A1A1AA]">carbs</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="font-semibold text-[#FF6B6B]">{Math.round(nutritionEntry.totalMacros.protein)}g</span>
                                            <span className="text-[#A1A1AA]">protein</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="font-semibold text-[#4ECDC4]">{Math.round(nutritionEntry.totalMacros.fats)}g</span>
                                            <span className="text-[#A1A1AA]">fats</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Meals Summary */}
                                {nutritionEntry.meals.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-[#A1A1AA] mr-1">Meals:</span>
                                        <div className="flex items-center space-x-1">
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
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <span className="text-sm text-[#7A7F86]">No nutrition data recorded for this date</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        onClick={onEdit}
                        variant="ghost"
                        size="icon"
                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full w-7 h-7"
                    >
                        <Edit3 className="w-3 h-3" />
                    </Button>
                    {nutritionEntry && (
                        <Button
                            onClick={onDelete}
                            variant="ghost"
                            size="icon"
                            className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-7 h-7"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}