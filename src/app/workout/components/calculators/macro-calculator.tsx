"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calculator, Info } from "lucide-react"

interface MacroCalculatorProps {
    initialCalories?: number
    onApplyToGoals?: (macros: { carbs: number; protein: number; fats: number }) => void
}

interface MacroPreset {
    id: string
    name: string
    description: string
    percentages: {
        carbs: number
        protein: number
        fats: number
    }
}

const presets: MacroPreset[] = [
    {
        id: 'balanced',
        name: 'Balanced',
        description: 'Balanced macros for general health',
        percentages: { carbs: 45, protein: 25, fats: 30 }
    },
    {
        id: 'highProtein',
        name: 'High Protein',
        description: 'Higher protein for muscle building',
        percentages: { carbs: 35, protein: 35, fats: 30 }
    },
    {
        id: 'lowCarb',
        name: 'Low Carb',
        description: 'Lower carbs for fat loss',
        percentages: { carbs: 20, protein: 30, fats: 50 }
    },
    {
        id: 'athlete',
        name: 'Athlete',
        description: 'Higher carbs for endurance',
        percentages: { carbs: 50, protein: 25, fats: 25 }
    }
]

export function MacroCalculator({ initialCalories = 2000, onApplyToGoals }: MacroCalculatorProps) {
    const [calories, setCalories] = useState<string>(initialCalories.toString())
    const [selectedPreset, setSelectedPreset] = useState<string>('balanced')
    const [carbsPercent, setCarbsPercent] = useState<number>(45)
    const [proteinPercent, setProteinPercent] = useState<number>(25)
    const [fatsPercent, setFatsPercent] = useState<number>(30)

    // Calculate grams from percentages
    const calculateMacroGrams = () => {
        const totalCalories = parseFloat(calories) || 2000

        // Calories per gram: Carbs=4, Protein=4, Fats=9
        const carbsCalories = (totalCalories * carbsPercent) / 100
        const proteinCalories = (totalCalories * proteinPercent) / 100
        const fatsCalories = (totalCalories * fatsPercent) / 100

        return {
            carbs: Math.round(carbsCalories / 4),
            protein: Math.round(proteinCalories / 4),
            fats: Math.round(fatsCalories / 9)
        }
    }

    const macros = calculateMacroGrams()

    // Handle preset selection
    const handlePresetClick = (preset: MacroPreset) => {
        setSelectedPreset(preset.id)
        setCarbsPercent(preset.percentages.carbs)
        setProteinPercent(preset.percentages.protein)
        setFatsPercent(preset.percentages.fats)
    }

    // Check if current percentages match a preset
    useEffect(() => {
        const matchingPreset = presets.find(
            p =>
                p.percentages.carbs === carbsPercent &&
                p.percentages.protein === proteinPercent &&
                p.percentages.fats === fatsPercent
        )
        if (matchingPreset) {
            setSelectedPreset(matchingPreset.id)
        } else {
            setSelectedPreset('custom')
        }
    }, [carbsPercent, proteinPercent, fatsPercent])

    // Adjust sliders to total 100%
    const handleCarbsChange = (value: number[]) => {
        const newCarbs = value[0]
        const remaining = 100 - newCarbs
        // Keep ratio of protein and fats
        const currentProteinFatsTotal = proteinPercent + fatsPercent
        if (currentProteinFatsTotal > 0) {
            const proteinRatio = proteinPercent / currentProteinFatsTotal
            setProteinPercent(Math.round(remaining * proteinRatio))
            setFatsPercent(Math.round(remaining * (1 - proteinRatio)))
        }
        setCarbsPercent(newCarbs)
    }

    const handleProteinChange = (value: number[]) => {
        const newProtein = value[0]
        const remaining = 100 - newProtein
        // Keep ratio of carbs and fats
        const currentCarbsFatsTotal = carbsPercent + fatsPercent
        if (currentCarbsFatsTotal > 0) {
            const carbsRatio = carbsPercent / currentCarbsFatsTotal
            setCarbsPercent(Math.round(remaining * carbsRatio))
            setFatsPercent(Math.round(remaining * (1 - carbsRatio)))
        }
        setProteinPercent(newProtein)
    }

    const handleFatsChange = (value: number[]) => {
        const newFats = value[0]
        const remaining = 100 - newFats
        // Keep ratio of carbs and protein
        const currentCarbsProteinTotal = carbsPercent + proteinPercent
        if (currentCarbsProteinTotal > 0) {
            const carbsRatio = carbsPercent / currentCarbsProteinTotal
            setCarbsPercent(Math.round(remaining * carbsRatio))
            setProteinPercent(Math.round(remaining * (1 - carbsRatio)))
        }
        setFatsPercent(newFats)
    }

    // Handle numeric input
    const handleNumericInput = (value: string, maxDigits: number) => {
        let cleanValue = value.replace(/[^0-9]/g, '')
        if (cleanValue.length > maxDigits) {
            cleanValue = cleanValue.substring(0, maxDigits)
        }
        return cleanValue
    }

    const totalPercent = carbsPercent + proteinPercent + fatsPercent

    return (
        <Card className="bg-[#121318] border-[#212227]">
            <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FFA500] to-[#FF8C00] rounded-full flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-[#F3F4F6]">Macro Calculator</h3>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-[#A1A1AA]" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#121318] border-[#212227] text-[#F3F4F6] max-w-xs">
                                        <p className="text-sm">Macronutrients (carbs, protein, fats) should total 100%. Carbs & Protein = 4 cal/g, Fats = 9 cal/g. Adjust sliders to see how grams change.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-xs text-[#A1A1AA]">Calculate your macro split</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Calories Input */}
                <div className="space-y-2">
                    <Label htmlFor="macro-calories" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                        Daily Calories
                    </Label>
                    <Input
                        id="macro-calories"
                        type="text"
                        value={calories}
                        onChange={(e) => setCalories(handleNumericInput(e.target.value, 5))}
                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center focus:ring-1 focus:ring-[#FFA500] focus:border-[#FFA500] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="2000"
                        inputMode="numeric"
                    />
                </div>

                <Separator className="bg-[#212227]" />

                {/* Preset Templates */}
                <div className="space-y-3">
                    <Label className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                        Preset Templates
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                        {presets.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetClick(preset)}
                                className={`
                                    flex flex-col items-start space-y-1 p-3 rounded-lg border transition-all text-left
                                    ${selectedPreset === preset.id
                                        ? 'bg-[#FFA500] border-[#FFA500] text-white'
                                        : 'bg-[#0E0F13] border-[#212227] text-[#F3F4F6] hover:border-[#FFA500]'
                                    }
                                `}
                            >
                                <span className="text-sm font-medium">{preset.name}</span>
                                <span className={`text-xs ${selectedPreset === preset.id ? 'text-white/80' : 'text-[#A1A1AA]'}`}>
                                    {preset.percentages.carbs}/{preset.percentages.protein}/{preset.percentages.fats}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <Separator className="bg-[#212227]" />

                {/* Macro Sliders */}
                <div className="space-y-5">
                    {/* Carbs Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-[#FFA500] font-medium">Carbohydrates</Label>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-[#FFA500]">{carbsPercent}%</span>
                                <span className="text-sm text-[#A1A1AA]">{macros.carbs}g</span>
                            </div>
                        </div>
                        <Slider
                            value={[carbsPercent]}
                            onValueChange={handleCarbsChange}
                            min={0}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-[#FFA500] [&_[role=slider]]:border-[#FFA500]"
                        />
                    </div>

                    {/* Protein Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-[#FF6B6B] font-medium">Protein</Label>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-[#FF6B6B]">{proteinPercent}%</span>
                                <span className="text-sm text-[#A1A1AA]">{macros.protein}g</span>
                            </div>
                        </div>
                        <Slider
                            value={[proteinPercent]}
                            onValueChange={handleProteinChange}
                            min={0}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-[#FF6B6B] [&_[role=slider]]:border-[#FF6B6B]"
                        />
                    </div>

                    {/* Fats Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-[#4ECDC4] font-medium">Fats</Label>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-[#4ECDC4]">{fatsPercent}%</span>
                                <span className="text-sm text-[#A1A1AA]">{macros.fats}g</span>
                            </div>
                        </div>
                        <Slider
                            value={[fatsPercent]}
                            onValueChange={handleFatsChange}
                            min={0}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-[#4ECDC4] [&_[role=slider]]:border-[#4ECDC4]"
                        />
                    </div>
                </div>

                {/* Total Check */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    totalPercent === 100
                        ? 'bg-[rgba(155,225,93,0.1)] border-[rgba(155,225,93,0.2)]'
                        : 'bg-[rgba(255,45,85,0.1)] border-[rgba(255,45,85,0.2)]'
                }`}>
                    <span className="text-sm font-medium text-[#F3F4F6]">Total</span>
                    <span className={`text-lg font-bold ${totalPercent === 100 ? 'text-[#9BE15D]' : 'text-[#FF2D55]'}`}>
                        {totalPercent}%
                    </span>
                </div>

                {/* Visual Breakdown */}
                <div className="bg-[#0E0F13] border border-[#212227] rounded-[12px] p-4 space-y-3">
                    <p className="text-xs text-[#A1A1AA] uppercase tracking-wide font-medium">Daily Macros</p>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FFA500]" />
                                <span className="text-[#F3F4F6]">Carbohydrates</span>
                            </div>
                            <span className="font-bold text-[#FFA500]">{macros.carbs}g</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
                                <span className="text-[#F3F4F6]">Protein</span>
                            </div>
                            <span className="font-bold text-[#FF6B6B]">{macros.protein}g</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#4ECDC4]" />
                                <span className="text-[#F3F4F6]">Fats</span>
                            </div>
                            <span className="font-bold text-[#4ECDC4]">{macros.fats}g</span>
                        </div>
                    </div>

                    {/* Pie Chart Visualization */}
                    <div className="flex items-center justify-center pt-4">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                {/* Carbs */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#FFA500"
                                    strokeWidth="20"
                                    strokeDasharray={`${(carbsPercent / 100) * 251.2} 251.2`}
                                    strokeDashoffset="0"
                                />
                                {/* Protein */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#FF6B6B"
                                    strokeWidth="20"
                                    strokeDasharray={`${(proteinPercent / 100) * 251.2} 251.2`}
                                    strokeDashoffset={`-${(carbsPercent / 100) * 251.2}`}
                                />
                                {/* Fats */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#4ECDC4"
                                    strokeWidth="20"
                                    strokeDasharray={`${(fatsPercent / 100) * 251.2} 251.2`}
                                    strokeDashoffset={`-${((carbsPercent + proteinPercent) / 100) * 251.2}`}
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Apply Button */}
                {onApplyToGoals && totalPercent === 100 && (
                    <Button
                        onClick={() => onApplyToGoals(macros)}
                        className="w-full bg-gradient-to-r from-[#FFA500] to-[#FF8C00] text-white rounded-lg hover:shadow-[0_6px_24px_rgba(255,165,0,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-10 text-sm font-medium"
                    >
                        Apply to Nutrition Goals
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
