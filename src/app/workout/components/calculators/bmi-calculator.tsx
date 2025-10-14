"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Activity, Info, TrendingUp } from "lucide-react"

interface BMICalculatorProps {
    initialWeight?: number
    initialHeight?: number
    weightUnit?: string
    heightUnit?: string
    onApplyToProfile?: (bmi: number) => void
}

interface BMIResult {
    bmi: number
    category: 'underweight' | 'normal' | 'overweight' | 'obese'
    categoryLabel: string
    healthyWeightRange: { min: number; max: number }
}

export function BMICalculator({
    initialWeight = 0,
    initialHeight = 0,
    weightUnit = 'kg',
    heightUnit = 'cm',
    onApplyToProfile
}: BMICalculatorProps) {
    const [weight, setWeight] = useState<string>(initialWeight > 0 ? initialWeight.toString() : "")
    const [height, setHeight] = useState<string>(initialHeight > 0 ? initialHeight.toString() : "")
    const [result, setResult] = useState<BMIResult | null>(null)

    const calculateBMI = useCallback(() => {
        const weightNum = parseFloat(weight)
        const heightNum = parseFloat(height)

        if (!weightNum || !heightNum || weightNum <= 0 || heightNum <= 0) {
            setResult(null)
            return
        }

        // Convert to metric for calculation
        let weightInKg = weightNum
        let heightInM = heightNum / 100 // cm to m

        if (weightUnit === 'lbs') {
            weightInKg = weightNum * 0.453592
        }

        if (heightUnit === 'ft') {
            // Height is in feet (decimal), convert to meters
            heightInM = heightNum * 0.3048
        }

        // Calculate BMI
        const bmi = weightInKg / (heightInM * heightInM)

        // Determine category
        let category: BMIResult['category']
        let categoryLabel: string

        if (bmi < 18.5) {
            category = 'underweight'
            categoryLabel = 'Underweight'
        } else if (bmi >= 18.5 && bmi < 25) {
            category = 'normal'
            categoryLabel = 'Normal Weight'
        } else if (bmi >= 25 && bmi < 30) {
            category = 'overweight'
            categoryLabel = 'Overweight'
        } else {
            category = 'obese'
            categoryLabel = 'Obese'
        }

        // Calculate healthy weight range
        const minHealthyBMI = 18.5
        const maxHealthyBMI = 24.9
        const minHealthyWeight = minHealthyBMI * (heightInM * heightInM)
        const maxHealthyWeight = maxHealthyBMI * (heightInM * heightInM)

        // Convert back to user's unit
        let minDisplay = minHealthyWeight
        let maxDisplay = maxHealthyWeight

        if (weightUnit === 'lbs') {
            minDisplay = minHealthyWeight / 0.453592
            maxDisplay = maxHealthyWeight / 0.453592
        }

        setResult({
            bmi: Math.round(bmi * 10) / 10,
            category,
            categoryLabel,
            healthyWeightRange: {
                min: Math.round(minDisplay * 10) / 10,
                max: Math.round(maxDisplay * 10) / 10
            }
        })
    }, [weight, height, weightUnit, heightUnit])

    // Calculate BMI whenever weight or height changes
    useEffect(() => {
        if (weight && height && parseFloat(weight) > 0 && parseFloat(height) > 0) {
            calculateBMI()
        } else {
            setResult(null)
        }
    }, [weight, height, weightUnit, heightUnit, calculateBMI])

    const getBMIColor = (category: BMIResult['category']) => {
        switch (category) {
            case 'underweight':
                return 'from-[#2BD2FF] to-[#2A8CEA]'
            case 'normal':
                return 'from-[#9BE15D] to-[#00E676]'
            case 'overweight':
                return 'from-[#FFA500] to-[#FF8C00]'
            case 'obese':
                return 'from-[#FF2D55] to-[#FF375F]'
        }
    }

    const getBMITextColor = (category: BMIResult['category']) => {
        switch (category) {
            case 'underweight':
                return 'text-[#2BD2FF]'
            case 'normal':
                return 'text-[#9BE15D]'
            case 'overweight':
                return 'text-[#FFA500]'
            case 'obese':
                return 'text-[#FF2D55]'
        }
    }

    const getBMIProgress = (bmi: number) => {
        // Map BMI to progress bar (0-100)
        // Scale: 0-15 = 0%, 15-40 = 100%
        if (bmi <= 15) return 0
        if (bmi >= 40) return 100
        return ((bmi - 15) / (40 - 15)) * 100
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
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2A8CEA] to-[#1659BF] rounded-full flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-[#F3F4F6]">BMI Calculator</h3>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-[#A1A1AA]" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#121318] border-[#212227] text-[#F3F4F6] max-w-xs">
                                        <p className="text-sm">BMI (Body Mass Index) is a measure of body fat based on height and weight. It&apos;s a useful screening tool but doesn&apos;t directly measure body fat percentage.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-xs text-[#A1A1AA]">Calculate your Body Mass Index</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Weight Input */}
                    <div className="space-y-2">
                        <Label htmlFor="bmi-weight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                            Weight ({weightUnit})
                        </Label>
                        <Input
                            id="bmi-weight"
                            type="text"
                            value={weight}
                            onChange={(e) => setWeight(handleNumericInput(e.target.value, 3, true))}
                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder={weightUnit === 'kg' ? "70" : "154"}
                            inputMode="decimal"
                        />
                    </div>

                    {/* Height Input */}
                    <div className="space-y-2">
                        <Label htmlFor="bmi-height" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">
                            Height ({heightUnit})
                        </Label>
                        <Input
                            id="bmi-height"
                            type="text"
                            value={height}
                            onChange={(e) => setHeight(handleNumericInput(e.target.value, 3, true))}
                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder={heightUnit === 'cm' ? "175" : "5.7"}
                            inputMode="decimal"
                        />
                    </div>
                </div>

                {/* Result Display */}
                {result && (
                    <div className="space-y-4 mt-6">
                        {/* BMI Value and Category */}
                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[12px] p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs text-[#A1A1AA] uppercase tracking-wide font-medium mb-1">Your BMI</p>
                                    <p className={`text-4xl font-bold ${getBMITextColor(result.category)}`}>
                                        {result.bmi}
                                    </p>
                                </div>
                                <Badge
                                    className={`bg-gradient-to-r ${getBMIColor(result.category)} text-white border-0 px-4 py-2 text-sm font-medium`}
                                >
                                    {result.categoryLabel}
                                </Badge>
                            </div>

                            {/* BMI Scale Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-[#A1A1AA]">
                                    <span>15</span>
                                    <span className="text-[#9BE15D]">18.5 - 24.9</span>
                                    <span>40</span>
                                </div>
                                <div className="relative">
                                    <div className="h-2 bg-gradient-to-r from-[#2BD2FF] via-[#9BE15D] via-[#FFA500] to-[#FF2D55] rounded-full" />
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-lg"
                                        style={{ left: `${getBMIProgress(result.bmi)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Healthy Weight Range */}
                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[12px] p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-[rgba(155,225,93,0.1)] border border-[rgba(155,225,93,0.2)] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-4 h-4 text-[#9BE15D]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#F3F4F6] mb-1">Healthy Weight Range</p>
                                    <p className="text-lg font-bold text-[#9BE15D]">
                                        {result.healthyWeightRange.min} - {result.healthyWeightRange.max} {weightUnit}
                                    </p>
                                    <p className="text-xs text-[#A1A1AA] mt-1">
                                        For your height, a BMI between 18.5 and 24.9 is considered healthy
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Apply Button */}
                        {onApplyToProfile && (
                            <Button
                                onClick={() => onApplyToProfile(result.bmi)}
                                className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-lg border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-10 text-sm font-medium"
                            >
                                Save BMI to Profile
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
