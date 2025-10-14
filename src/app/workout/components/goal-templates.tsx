"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingDown, TrendingUp, Activity, Flame, Heart } from "lucide-react"

interface GoalTemplate {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
    borderColor: string
    values: {
        dailyExerciseMinutes: number
        weeklyExerciseSessions: number
        dailyCalories: number
        activityLevel: string
        sleepHours: number
        recoveryMinutes: number
        dietType: string
        carbsGrams: number
        proteinGrams: number
        fatsGrams: number
        macroPreference: 'balanced' | 'highProtein' | 'lowCarb' | 'custom'
    }
}

interface GoalTemplatesProps {
    onApplyTemplate: (template: GoalTemplate) => void
}

const templates: GoalTemplate[] = [
    {
        id: 'weight-loss',
        name: 'Weight Loss',
        description: 'Lose fat with a moderate calorie deficit and cardio focus',
        icon: <TrendingDown className="w-5 h-5" />,
        color: 'text-[#FF2D55]',
        bgColor: 'from-[#FF2D55] to-[#FF375F]',
        borderColor: 'border-[#FF2D55]',
        values: {
            dailyExerciseMinutes: 45,
            weeklyExerciseSessions: 5,
            dailyCalories: 1800,
            activityLevel: 'active',
            sleepHours: 8,
            recoveryMinutes: 60,
            dietType: 'cutting',
            carbsGrams: 180, // 40%
            proteinGrams: 135, // 30%
            fatsGrams: 60,    // 30%
            macroPreference: 'highProtein'
        }
    },
    {
        id: 'muscle-gain',
        name: 'Muscle Gain',
        description: 'Build muscle with high protein and calorie surplus',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-[#9BE15D]',
        bgColor: 'from-[#9BE15D] to-[#00E676]',
        borderColor: 'border-[#9BE15D]',
        values: {
            dailyExerciseMinutes: 60,
            weeklyExerciseSessions: 5,
            dailyCalories: 2800,
            activityLevel: 'active',
            sleepHours: 8,
            recoveryMinutes: 90,
            dietType: 'bulking',
            carbsGrams: 350, // 50%
            proteinGrams: 210, // 30%
            fatsGrams: 62,    // 20%
            macroPreference: 'highProtein'
        }
    },
    {
        id: 'maintenance',
        name: 'Maintenance',
        description: 'Maintain current weight with balanced nutrition',
        icon: <Activity className="w-5 h-5" />,
        color: 'text-[#2BD2FF]',
        bgColor: 'from-[#2BD2FF] to-[#2A8CEA]',
        borderColor: 'border-[#2BD2FF]',
        values: {
            dailyExerciseMinutes: 30,
            weeklyExerciseSessions: 3,
            dailyCalories: 2200,
            activityLevel: 'moderate',
            sleepHours: 8,
            recoveryMinutes: 60,
            dietType: 'maintenance',
            carbsGrams: 248, // 45%
            proteinGrams: 138, // 25%
            fatsGrams: 73,    // 30%
            macroPreference: 'balanced'
        }
    },
    {
        id: 'endurance',
        name: 'Endurance Training',
        description: 'High cardio volume with carb-focused nutrition',
        icon: <Heart className="w-5 h-5" />,
        color: 'text-[#FFA500]',
        bgColor: 'from-[#FFA500] to-[#FF8C00]',
        borderColor: 'border-[#FFA500]',
        values: {
            dailyExerciseMinutes: 75,
            weeklyExerciseSessions: 6,
            dailyCalories: 2600,
            activityLevel: 'extra',
            sleepHours: 8.5,
            recoveryMinutes: 75,
            dietType: 'maintenance',
            carbsGrams: 358, // 55%
            proteinGrams: 130, // 20%
            fatsGrams: 72,    // 25%
            macroPreference: 'custom'
        }
    },
    {
        id: 'strength',
        name: 'Strength Focus',
        description: 'Build strength with compound lifts and high protein',
        icon: <Flame className="w-5 h-5" />,
        color: 'text-[#FF6B6B]',
        bgColor: 'from-[#FF6B6B] to-[#EE5A6F]',
        borderColor: 'border-[#FF6B6B]',
        values: {
            dailyExerciseMinutes: 50,
            weeklyExerciseSessions: 4,
            dailyCalories: 2500,
            activityLevel: 'moderate',
            sleepHours: 9,
            recoveryMinutes: 120,
            dietType: 'bulking',
            carbsGrams: 281, // 45%
            proteinGrams: 219, // 35%
            fatsGrams: 56,    // 20%
            macroPreference: 'highProtein'
        }
    },
    {
        id: 'beginner',
        name: 'Beginner Friendly',
        description: 'Start your fitness journey with sustainable habits',
        icon: <Target className="w-5 h-5" />,
        color: 'text-[#A78BFA]',
        bgColor: 'from-[#A78BFA] to-[#8B5CF6]',
        borderColor: 'border-[#A78BFA]',
        values: {
            dailyExerciseMinutes: 20,
            weeklyExerciseSessions: 3,
            dailyCalories: 2000,
            activityLevel: 'light',
            sleepHours: 8,
            recoveryMinutes: 45,
            dietType: 'maintenance',
            carbsGrams: 225, // 45%
            proteinGrams: 125, // 25%
            fatsGrams: 67,    // 30%
            macroPreference: 'balanced'
        }
    }
]

export function GoalTemplates({ onApplyTemplate }: GoalTemplatesProps) {
    return (
        <Card className="bg-[#121318] border-[#212227]">
            <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-[#A1A1AA]" />
                    </div>
                    <div>
                        <p className="text-sm text-[#F3F4F6] font-medium">Goal Templates</p>
                        <p className="text-xs text-[#A1A1AA]">Quick-start presets for common fitness goals</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => onApplyTemplate(template)}
                            className="group relative bg-[#0E0F13] border-2 rounded-[12px] p-4 transition-all text-left hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                borderColor: template.borderColor.replace('border-[', '').replace(']', ''),
                                opacity: 0.85
                            }}
                        >
                            {/* Icon and Badge */}
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${template.bgColor} rounded-lg flex items-center justify-center`}>
                                    <div className="text-white">
                                        {template.icon}
                                    </div>
                                </div>
                                <Badge
                                    className={`bg-gradient-to-r ${template.bgColor} text-white border-0 text-[10px] font-medium px-2 py-1`}
                                >
                                    Apply
                                </Badge>
                            </div>

                            {/* Template Info */}
                            <div className="space-y-2">
                                <h3 className={`text-sm font-semibold ${template.color}`}>
                                    {template.name}
                                </h3>
                                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                                    {template.description}
                                </p>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#212227]">
                                    <div>
                                        <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wide">Calories</p>
                                        <p className="text-xs font-medium text-[#F3F4F6]">{template.values.dailyCalories}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wide">Sessions/Week</p>
                                        <p className="text-xs font-medium text-[#F3F4F6]">{template.values.weeklyExerciseSessions}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wide">Minutes/Day</p>
                                        <p className="text-xs font-medium text-[#F3F4F6]">{template.values.dailyExerciseMinutes}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wide">Sleep</p>
                                        <p className="text-xs font-medium text-[#F3F4F6]">{template.values.sleepHours}h</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity rounded-[12px] pointer-events-none"
                                style={{
                                    backgroundImage: `linear-gradient(to bottom right, ${template.bgColor.replace('from-[', '').replace('] to-[', ', ').replace(']', '')})`
                                }}
                            />
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
