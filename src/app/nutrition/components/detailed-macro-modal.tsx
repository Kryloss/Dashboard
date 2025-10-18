"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DetailedNutrients } from "@/lib/nutrition-storage"
import { X } from "lucide-react"

interface DetailedMacroModalProps {
    isOpen: boolean
    onClose: () => void
    macroType: 'carbs' | 'protein' | 'fats'
    currentValue: number
    targetValue: number
    detailedNutrients: DetailedNutrients
    foods: Array<{
        name: string
        servingSize: string
        macroValue: number
        detailedNutrients: DetailedNutrients
    }>
}

export function DetailedMacroModal({
    isOpen,
    onClose,
    macroType,
    currentValue,
    targetValue,
    detailedNutrients,
    foods
}: DetailedMacroModalProps) {
    // Helper function to format numbers to 1 decimal place, removing .0 for whole numbers
    const formatNutrientValue = (value: number): string => {
        const rounded = Math.round(value * 10) / 10
        return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)
    }

    const getMacroTitle = () => {
        switch (macroType) {
            case 'carbs': return 'Carbohydrates'
            case 'protein': return 'Protein'
            case 'fats': return 'Fats'
            default: return 'Macronutrient'
        }
    }

    const getMacroColor = () => {
        switch (macroType) {
            case 'carbs': return {
                primary: '#9BE15D',
                secondary: '#00E676',
                background: 'from-[#9BE15D]/10 via-[#00E676]/5 to-transparent',
                border: 'border-[#9BE15D]/20'
            }
            case 'protein': return {
                primary: '#2A8CEA',
                secondary: '#1659BF',
                background: 'from-[#2A8CEA]/10 via-[#1659BF]/5 to-transparent',
                border: 'border-[#2A8CEA]/20'
            }
            case 'fats': return {
                primary: '#FF2D55',
                secondary: '#FF375F',
                background: 'from-[#FF2D55]/10 via-[#FF375F]/5 to-transparent',
                border: 'border-[#FF2D55]/20'
            }
            default: return {
                primary: '#A1A1AA',
                secondary: '#7A7F86',
                background: 'from-[#A1A1AA]/10 via-[#7A7F86]/5 to-transparent',
                border: 'border-[#A1A1AA]/20'
            }
        }
    }

    const getDetailedBreakdown = () => {
        switch (macroType) {
            case 'carbs':
                return [
                    { label: 'Total Carbs', value: detailedNutrients.carbs, unit: 'g', target: targetValue },
                    { label: 'Fiber', value: detailedNutrients.fiber || 0, unit: 'g', target: 25 },
                    { label: 'Sugar', value: detailedNutrients.sugar || 0, unit: 'g', target: null },
                    { label: 'Net Carbs', value: (detailedNutrients.carbs || 0) - (detailedNutrients.fiber || 0), unit: 'g', target: null }
                ]
            case 'protein':
                return [
                    { label: 'Total Protein', value: detailedNutrients.protein, unit: 'g', target: targetValue },
                    // Add amino acid breakdown if available in the future
                    { label: 'Complete Protein', value: detailedNutrients.protein, unit: 'g', target: null },
                ]
            case 'fats':
                return [
                    { label: 'Total Fats', value: detailedNutrients.fats, unit: 'g', target: targetValue },
                    { label: 'Saturated Fat', value: detailedNutrients.saturatedFat || 0, unit: 'g', target: 22 },
                    { label: 'Trans Fat', value: detailedNutrients.transFat || 0, unit: 'g', target: 0 },
                    { label: 'Monounsaturated', value: detailedNutrients.monounsaturatedFat || 0, unit: 'g', target: null },
                    { label: 'Polyunsaturated', value: detailedNutrients.polyunsaturatedFat || 0, unit: 'g', target: null },
                    { label: 'Cholesterol', value: detailedNutrients.cholesterol || 0, unit: 'mg', target: 300 }
                ]
            default:
                return []
        }
    }

    const getHealthRecommendations = () => {
        switch (macroType) {
            case 'carbs':
                return [
                    'Focus on complex carbohydrates for sustained energy',
                    'Aim for 25-35g of fiber daily for digestive health',
                    'Limit added sugars to less than 10% of daily calories'
                ]
            case 'protein':
                return [
                    'Include complete proteins with all essential amino acids',
                    'Distribute protein intake throughout the day',
                    'Combine plant proteins for complete amino acid profiles'
                ]
            case 'fats':
                return [
                    'Limit saturated fats to less than 10% of daily calories',
                    'Avoid trans fats completely when possible',
                    'Include omega-3 fatty acids from fish, nuts, and seeds'
                ]
            default:
                return []
        }
    }

    const colors = getMacroColor()
    const breakdown = getDetailedBreakdown()
    const recommendations = getHealthRecommendations()
    const progressPercentage = (currentValue / targetValue) * 100

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0B0B0F] border border-[#212227] text-[#F3F4F6] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-[#F3F4F6]">
                        {getMacroTitle()} Breakdown
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Overview Card */}
                    <div className={`p-6 bg-gradient-to-br ${colors.background} border-2 ${colors.border} rounded-[20px]`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#F3F4F6]">Today&apos;s Progress</h3>
                            <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                                    {Math.round(progressPercentage)}%
                                </div>
                                <div className="text-sm text-[#A1A1AA]">
                                    {formatNutrientValue(currentValue)}g / {targetValue}g
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-[#212227] rounded-full h-3 mb-2">
                            <div
                                className="h-3 rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(progressPercentage, 100)}%`,
                                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
                                }}
                            ></div>
                        </div>

                        <div className="text-xs text-[#7A7F86]">
                            {progressPercentage > 100 ? 'Target exceeded' : `${formatNutrientValue(targetValue - currentValue)}g remaining`}
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-[#F3F4F6]">Detailed Breakdown</h4>

                        <div className="grid gap-3">
                            {breakdown.map((item, index) => (
                                <div key={index} className="bg-[#121318] border border-[#212227] rounded-[12px] p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-[#F3F4F6]">{item.label}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-[#F3F4F6]">
                                                {formatNutrientValue(item.value)}{item.unit}
                                            </span>
                                            {item.target && (
                                                <span className="text-xs text-[#A1A1AA] ml-1">
                                                    / {item.target}{item.unit}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {item.target && (
                                        <div className="w-full bg-[#212227] rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min((item.value / item.target) * 100, 100)}%`,
                                                    background: `linear-gradient(90deg, ${colors.primary}66, ${colors.secondary}66)`
                                                }}
                                            ></div>
                                        </div>
                                    )}

                                    {/* Special warnings for trans fats */}
                                    {item.label === 'Trans Fat' && item.value > 0 && (
                                        <div className="mt-2 text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-2">
                                            ⚠️ Trans fats should be avoided when possible
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Food Sources */}
                    {foods.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-[#F3F4F6]">Top Sources</h4>

                            <div className="space-y-2">
                                {foods.slice(0, 5).map((food, index) => (
                                    <div key={index} className="bg-[#121318] border border-[#212227] rounded-[12px] p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-[#F3F4F6]">{food.name}</div>
                                                <div className="text-xs text-[#A1A1AA]">{food.servingSize}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold" style={{ color: colors.primary }}>
                                                    {formatNutrientValue(food.macroValue)}g
                                                </div>
                                                <div className="text-xs text-[#7A7F86]">
                                                    {Math.round((food.macroValue / currentValue) * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {foods.length > 5 && (
                                    <div className="text-center py-2">
                                        <span className="text-xs text-[#7A7F86]">
                                            +{foods.length - 5} more sources
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Health Recommendations */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-[#F3F4F6]">Health Tips</h4>

                        <div className="bg-[#121318] border border-[#212227] rounded-[16px] p-4">
                            <div className="space-y-3">
                                {recommendations.map((tip, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div
                                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                            style={{ backgroundColor: colors.primary }}
                                        ></div>
                                        <p className="text-sm text-[#A1A1AA] leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#212227]">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="border-[#212227] text-[#A1A1AA] hover:text-[#F3F4F6] hover:border-[#2A2B31] bg-transparent"
                        >
                            Close
                        </Button>
                        <Button
                            className="text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                            }}
                        >
                            Add Food
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}