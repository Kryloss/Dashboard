"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Flame, Info, TrendingDown, TrendingUp, Minus } from "lucide-react"

interface TDEECalculatorProps {
    initialWeight?: number
    initialHeight?: number
    initialAge?: number
    weightUnit?: string
    heightUnit?: string
    onApplyToGoals?: (calories: number) => void
}

interface TDEEResult {
    bmr: number
    tdee: number
    cuttingCalories: number // 20% deficit for weight loss
    bulkingCalories: number // 10% surplus for weight gain
    maintenanceCalories: number
}

export function TDEECalculator({
    initialWeight = 0,
    initialHeight = 0,
    initialAge = 0,
    weightUnit = 'kg',
    heightUnit = 'cm',
    onApplyToGoals
}: TDEECalculatorProps) {
    const [weight, setWeight] = useState<string>(initialWeight > 0 ? initialWeight.toString() : "")
    const [height, setHeight] = useState<string>(initialHeight > 0 ? initialHeight.toString() : "")
    const [age, setAge] = useState<string>(initialAge > 0 ? initialAge.toString() : "")
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [activityLevel, setActivityLevel] = useState<string>('moderate')
    const [goal, setGoal] = useState<'cutting' | 'maintenance' | 'bulking'>('maintenance')
    const [result, setResult] = useState<TDEEResult | null>(null)

    const calculateTDEE = useCallback(() => {
        const weightNum = parseFloat(weight)
        const heightNum = parseFloat(height)
        const ageNum = parseInt(age)

        if (!weightNum || !heightNum || !ageNum || weightNum <= 0 || heightNum <= 0 || ageNum <= 0) {
            setResult(null)
            return
        }

        // Convert to metric for calculation
        let weightInKg = weightNum
        let heightInCm = heightNum

        if (weightUnit === 'lbs') {
            weightInKg = weightNum * 0.453592
        }

        if (heightUnit === 'ft') {
            // Height is in feet (decimal), convert to cm
            heightInCm = heightNum * 30.48
        }

        // Calculate BMR using Mifflin-St Jeor Equation (most accurate)
        let bmr: number
        if (gender === 'male') {
            bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * ageNum) + 5
        } else {
            bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * ageNum) - 161
        }

        // Activity multipliers
        const activityMultipliers: Record<string, number> = {
            'sedentary': 1.2,      // Little or no exercise
            'light': 1.375,        // Light exercise 1-3 days/week
            'moderate': 1.55,      // Moderate exercise 3-5 days/week
            'active': 1.725,       // Hard exercise 6-7 days/week
            'extra': 1.9           // Very hard exercise & physical job
        }

        // Calculate TDEE
        const multiplier = activityMultipliers[activityLevel] || 1.55
        const tdee = bmr * multiplier

        // Calculate goal-based calories
        const maintenanceCalories = Math.round(tdee)
        const cuttingCalories = Math.round(tdee * 0.80) // 20% deficit
        const bulkingCalories = Math.round(tdee * 1.10) // 10% surplus

        setResult({
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            cuttingCalories,
            bulkingCalories,
            maintenanceCalories
        })
    }, [weight, height, age, gender, activityLevel, weightUnit, heightUnit])

    // Calculate TDEE whenever inputs change
    useEffect(() => {
        if (weight && height && age && parseFloat(weight) > 0 && parseFloat(height) > 0 && parseInt(age) > 0) {
            calculateTDEE()
        } else {
            setResult(null)
        }
    }, [weight, height, age, gender, activityLevel, weightUnit, heightUnit, calculateTDEE])

    const getRecommendedCalories = (): number => {
        if (!result) return 0
        switch (goal) {
            case 'cutting':
                return result.cuttingCalories
            case 'maintenance':
                return result.maintenanceCalories
            case 'bulking':
                return result.bulkingCalories
            default:
                return result.maintenanceCalories
        }
    }

    const getGoalColor = (goalType: typeof goal) => {
        switch (goalType) {
            case 'cutting':
                return 'from-[#FF2D55] to-[#FF375F]'
            case 'maintenance':
                return 'from-[#2BD2FF] to-[#2A8CEA]'
            case 'bulking':
                return 'from-[#9BE15D] to-[#00E676]'
        }
    }

    const getGoalIcon = (goalType: typeof goal) => {
        switch (goalType) {
            case 'cutting':
                return <TrendingDown className="w-4 h-4" />
            case 'maintenance':
                return <Minus className="w-4 h-4" />
            case 'bulking':
                return <TrendingUp className="w-4 h-4" />
        }
    }

    // Handle numeric input with validation
    const handleNumericInput = (value: string, maxDigits: number, allowDecimal: boolean = false) => {
        let cleanValue = value.replace(/[^0-9.]/g, '')

        if (allowDecimal) {
            const parts = cleanValue.split('.')
            if (parts.length > 2) {
                cleanValue = parts[0] + '.' + parts.slice(1).join('')
            }
            if (parts[1] && parts[1].length > 1) {
                cleanValue = parts[0] + '.' + parts[1].substring(0, 1)
            }
        } else {
            cleanValue = cleanValue.replace(/\./g, '')
        }

        const wholePart = cleanValue.split('.')[0]
        if (wholePart.length > maxDigits) {
            const decimalPart = cleanValue.includes('.') ? '.' + cleanValue.split('.')[1] : ''
            cleanValue = wholePart.substring(0, maxDigits) + decimalPart
        }

        return cleanValue
    }

    return (
        <Card className="bg-[#121318] border-[#212227]">
            <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#9BE15D] to-[#00E676] rounded-full flex items-center justify-center">
                        <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-[#F3F4F6]">TDEE Calculator</h3>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-[#A1A1AA]" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#121318] border-[#212227] text-[#F3F4F6] max-w-xs">
                                        <p className="text-sm">TDEE (Total Daily Energy Expenditure) is the total number of calories you burn per day, including exercise. BMR is your Basal Metabolic Rate - calories burned at rest.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-xs text-[#A1A1AA]">Calculate your daily calorie needs</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Input Fields */}
                <div className="space-y-4">
                    {/* Basic Info Row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="tdee-weight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                                Weight ({weightUnit})
                            </Label>
                            <Input
                                id="tdee-weight"
                                type="text"
                                value={weight}
                                onChange={(e) => setWeight(handleNumericInput(e.target.value, 3, true))}
                                className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder={weightUnit === 'kg' ? "70" : "154"}
                                inputMode="decimal"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tdee-height" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                                Height ({heightUnit})
                            </Label>
                            <Input
                                id="tdee-height"
                                type="text"
                                value={height}
                                onChange={(e) => setHeight(handleNumericInput(e.target.value, 3, true))}
                                className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder={heightUnit === 'cm' ? "175" : "5.7"}
                                inputMode="decimal"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tdee-age" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                                Age
                            </Label>
                            <Input
                                id="tdee-age"
                                type="text"
                                value={age}
                                onChange={(e) => setAge(handleNumericInput(e.target.value, 3, false))}
                                className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="25"
                                inputMode="numeric"
                            />
                        </div>
                    </div>

                    {/* Gender and Activity Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="tdee-gender" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                                Gender
                            </Label>
                            <Select value={gender} onValueChange={(value) => setGender(value as 'male' | 'female')}>
                                <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#121318] border-[#212227] z-[9999]">
                                    <SelectItem value="male" className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31]">Male</SelectItem>
                                    <SelectItem value="female" className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31]">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tdee-activity" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                                Activity Level
                            </Label>
                            <Select value={activityLevel} onValueChange={setActivityLevel}>
                                <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#121318] border-[#212227] z-[9999]">
                                    <SelectItem value="sedentary" className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31]">Sedentary</SelectItem>
                                    <SelectItem value="light" className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31]">Light</SelectItem>
                                    <SelectItem value="moderate" className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31]">Moderate</SelectItem>
                                    <SelectItem value="active" className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31]">Active</SelectItem>
                                    <SelectItem value="extra" className="text-[#F3F4F6] hover:bg-[#2A2B31] focus:bg-[#2A2B31]">Very Active</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Goal Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                            Goal
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setGoal('cutting')}
                                className={`
                                    flex flex-col items-center justify-center space-y-2 p-3 rounded-lg border transition-all
                                    ${goal === 'cutting'
                                        ? 'bg-gradient-to-br from-[#FF2D55] to-[#FF375F] border-[#FF2D55] text-white'
                                        : 'bg-[#0E0F13] border-[#212227] text-[#A1A1AA] hover:border-[#FF2D55]'
                                    }
                                `}
                            >
                                <TrendingDown className="w-5 h-5" />
                                <span className="text-xs font-medium">Weight Loss</span>
                                <span className="text-[10px] opacity-80">-20%</span>
                            </button>

                            <button
                                onClick={() => setGoal('maintenance')}
                                className={`
                                    flex flex-col items-center justify-center space-y-2 p-3 rounded-lg border transition-all
                                    ${goal === 'maintenance'
                                        ? 'bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] border-[#2BD2FF] text-white'
                                        : 'bg-[#0E0F13] border-[#212227] text-[#A1A1AA] hover:border-[#2BD2FF]'
                                    }
                                `}
                            >
                                <Minus className="w-5 h-5" />
                                <span className="text-xs font-medium">Maintain</span>
                                <span className="text-[10px] opacity-80">0%</span>
                            </button>

                            <button
                                onClick={() => setGoal('bulking')}
                                className={`
                                    flex flex-col items-center justify-center space-y-2 p-3 rounded-lg border transition-all
                                    ${goal === 'bulking'
                                        ? 'bg-gradient-to-br from-[#9BE15D] to-[#00E676] border-[#9BE15D] text-white'
                                        : 'bg-[#0E0F13] border-[#212227] text-[#A1A1AA] hover:border-[#9BE15D]'
                                    }
                                `}
                            >
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-xs font-medium">Muscle Gain</span>
                                <span className="text-[10px] opacity-80">+10%</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Result Display */}
                {result && (
                    <div className="space-y-4 mt-6">
                        <Separator className="bg-[#212227]" />

                        {/* Main Result */}
                        <div className={`bg-gradient-to-br ${getGoalColor(goal)} rounded-[12px] p-4`}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-white/80 uppercase tracking-wide font-medium">
                                    Recommended Daily Calories
                                </p>
                                <div className="text-white">
                                    {getGoalIcon(goal)}
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-white">
                                {getRecommendedCalories()}
                            </p>
                            <p className="text-xs text-white/80 mt-1">
                                {goal === 'cutting' && 'For weight loss (20% deficit)'}
                                {goal === 'maintenance' && 'To maintain current weight'}
                                {goal === 'bulking' && 'For muscle gain (10% surplus)'}
                            </p>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[12px] p-4 space-y-3">
                            <p className="text-xs text-[#A1A1AA] uppercase tracking-wide font-medium mb-3">Calorie Breakdown</p>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#F3F4F6]">BMR (at rest)</span>
                                <span className="text-sm font-medium text-[#A1A1AA]">{result.bmr} cal</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#F3F4F6]">TDEE (with activity)</span>
                                <span className="text-sm font-medium text-[#2BD2FF]">{result.tdee} cal</span>
                            </div>

                            <Separator className="bg-[#212227]" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#F3F4F6]">Weight Loss (-20%)</span>
                                <span className="text-sm font-medium text-[#FF2D55]">{result.cuttingCalories} cal</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#F3F4F6]">Maintenance (0%)</span>
                                <span className="text-sm font-medium text-[#2BD2FF]">{result.maintenanceCalories} cal</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#F3F4F6]">Muscle Gain (+10%)</span>
                                <span className="text-sm font-medium text-[#9BE15D]">{result.bulkingCalories} cal</span>
                            </div>
                        </div>

                        {/* Apply Button */}
                        {onApplyToGoals && (
                            <Button
                                onClick={() => onApplyToGoals(getRecommendedCalories())}
                                className="w-full bg-gradient-to-r from-[#9BE15D] to-[#00E676] text-[#0B0B0F] rounded-lg hover:shadow-[0_6px_24px_rgba(155,225,93,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-10 text-sm font-medium"
                            >
                                Apply to Nutrition Goals
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
