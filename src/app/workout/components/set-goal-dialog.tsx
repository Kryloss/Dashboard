"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { User, Target, Weight, Moon, Flame, Dumbbell } from "lucide-react"

interface SetGoalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface UserProfile {
    weight: string
    age: string
    height: string
    weightUnit: string
    heightUnit: string
}

interface Goals {
    dailyExerciseMinutes: string
    weeklyExerciseSessions: string
    dailyCalories: string
    activityLevel: string
    sleepHours: string
    recoveryMinutes: string
    startingWeight: string
    goalWeight: string
    dietType: string
}

export function SetGoalDialog({ open, onOpenChange }: SetGoalDialogProps) {
    const [activeTab, setActiveTab] = useState("account")
    
    const [profile, setProfile] = useState<UserProfile>({
        weight: "",
        age: "",
        height: "",
        weightUnit: "kg",
        heightUnit: "cm"
    })
    
    const [goals, setGoals] = useState<Goals>({
        dailyExerciseMinutes: "30",
        weeklyExerciseSessions: "3",
        dailyCalories: "2000",
        activityLevel: "moderate",
        sleepHours: "8",
        recoveryMinutes: "60",
        startingWeight: "",
        goalWeight: "",
        dietType: "maintenance"
    })

    const handleSaveProfile = () => {
        // TODO: Implement profile saving logic
        console.log("Saving profile:", profile)
    }

    const handleSaveGoals = () => {
        // TODO: Implement goals saving logic
        console.log("Saving goals:", goals)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl font-semibold text-[#F3F4F6]">
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col">
                        {/* Compact Tab Navigation */}
                        <div className="flex mx-6 mb-4 bg-[#0E0F13] border border-[#212227] rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`
                                    flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-all rounded-md
                                    ${activeTab === "account" 
                                        ? "bg-[#2A8CEA] text-white shadow-sm" 
                                        : "text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                    }
                                `}
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("goals")}
                                className={`
                                    flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-all rounded-md
                                    ${activeTab === "goals" 
                                        ? "bg-[#2A8CEA] text-white shadow-sm" 
                                        : "text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)]"
                                    }
                                `}
                            >
                                <Target className="w-4 h-4" />
                                <span>Goals</span>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[70vh]">
                            <TabsContent value="account" className="mt-0">
                                <Card className="bg-[#121318] border-[#212227]">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center">
                                                <User className="w-4 h-4 text-[#A1A1AA]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#F3F4F6] font-medium">Profile Information</p>
                                                <p className="text-xs text-[#A1A1AA]">Update your personal details</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Compact Profile Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Weight Section */}
                                            <div className="space-y-2">
                                                <Label htmlFor="weight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Weight</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="weight"
                                                        type="number"
                                                        value={profile.weight}
                                                        onChange={(e) => setProfile({...profile, weight: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center flex-1 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors"
                                                        placeholder="70"
                                                        inputMode="decimal"
                                                        min="0"
                                                        max="300"
                                                        step="0.1"
                                                    />
                                                    <Select value={profile.weightUnit} onValueChange={(value) => setProfile({...profile, weightUnit: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-xs w-16 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="kg">kg</SelectItem>
                                                            <SelectItem value="lbs">lbs</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Height Section */}
                                            <div className="space-y-2">
                                                <Label htmlFor="height" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Height</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="height"
                                                        type="number"
                                                        value={profile.height}
                                                        onChange={(e) => setProfile({...profile, height: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center flex-1 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors"
                                                        placeholder="175"
                                                        inputMode="decimal"
                                                        min="0"
                                                        max="250"
                                                        step="0.1"
                                                    />
                                                    <Select value={profile.heightUnit} onValueChange={(value) => setProfile({...profile, heightUnit: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-xs w-16 focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cm">cm</SelectItem>
                                                            <SelectItem value="ft">ft</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Age Section */}
                                            <div className="space-y-2">
                                                <Label htmlFor="age" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Age</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    value={profile.age}
                                                    onChange={(e) => setProfile({...profile, age: e.target.value})}
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-10 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors"
                                                    placeholder="25"
                                                    inputMode="numeric"
                                                    min="1"
                                                    max="120"
                                                />
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={handleSaveProfile}
                                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-lg border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-9 text-sm font-medium mt-6"
                                        >
                                            Save Profile
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="goals" className="mt-0">
                                {/* Single Consolidated Goals Card */}
                                <Card className="bg-[#121318] border-[#212227]">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center">
                                                <Target className="w-4 h-4 text-[#A1A1AA]" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#F3F4F6] font-medium">Health & Fitness Goals</p>
                                                <p className="text-xs text-[#A1A1AA]">Set your targets for optimal performance</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {/* Exercise Goals Section - Compact Grid */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#FF375F] flex items-center justify-center">
                                                    <Dumbbell className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Exercise</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dailyExercise" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Daily Minutes</Label>
                                                    <Input
                                                        id="dailyExercise"
                                                        type="number"
                                                        value={goals.dailyExerciseMinutes}
                                                        onChange={(e) => setGoals({...goals, dailyExerciseMinutes: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#FF2D55] focus:border-[#FF2D55] transition-colors"
                                                        placeholder="30"
                                                        inputMode="numeric"
                                                        min="0"
                                                        max="480"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="weeklyExercise" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Weekly Sessions</Label>
                                                    <Input
                                                        id="weeklyExercise"
                                                        type="number"
                                                        value={goals.weeklyExerciseSessions}
                                                        onChange={(e) => setGoals({...goals, weeklyExerciseSessions: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#FF2D55] focus:border-[#FF2D55] transition-colors"
                                                        placeholder="3"
                                                        inputMode="numeric"
                                                        min="0"
                                                        max="14"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nutrition Goals Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#9BE15D] to-[#00E676] flex items-center justify-center">
                                                    <Flame className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Nutrition</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dailyCalories" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Daily Calories</Label>
                                                    <Input
                                                        id="dailyCalories"
                                                        type="number"
                                                        value={goals.dailyCalories}
                                                        onChange={(e) => setGoals({...goals, dailyCalories: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D] transition-colors"
                                                        placeholder="2000"
                                                        inputMode="numeric"
                                                        min="500"
                                                        max="5000"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="activityLevel" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Activity Level</Label>
                                                    <Select value={goals.activityLevel} onValueChange={(value) => setGoals({...goals, activityLevel: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-xs focus:ring-1 focus:ring-[#9BE15D] focus:border-[#9BE15D]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sedentary">Sedentary</SelectItem>
                                                            <SelectItem value="light">Light</SelectItem>
                                                            <SelectItem value="moderate">Moderate</SelectItem>
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="extra">Extra Active</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recovery Goals Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2BD2FF] to-[#2A8CEA] flex items-center justify-center">
                                                    <Moon className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Recovery</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="sleepHours" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Sleep Hours</Label>
                                                    <Input
                                                        id="sleepHours"
                                                        type="number"
                                                        value={goals.sleepHours}
                                                        onChange={(e) => setGoals({...goals, sleepHours: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2BD2FF] focus:border-[#2BD2FF] transition-colors"
                                                        placeholder="8"
                                                        step="0.5"
                                                        inputMode="decimal"
                                                        min="4"
                                                        max="12"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="recoveryTime" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Recovery Minutes</Label>
                                                    <Input
                                                        id="recoveryTime"
                                                        type="number"
                                                        value={goals.recoveryMinutes}
                                                        onChange={(e) => setGoals({...goals, recoveryMinutes: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2BD2FF] focus:border-[#2BD2FF] transition-colors"
                                                        placeholder="60"
                                                        inputMode="numeric"
                                                        min="0"
                                                        max="240"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weight Goals Section */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[#2A2B31] flex items-center justify-center">
                                                    <Weight className="w-3.5 h-3.5 text-[#A1A1AA]" />
                                                </div>
                                                <span className="text-sm font-medium text-[#F3F4F6]">Weight Goals</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="dietType" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Goal Type</Label>
                                                    <Select value={goals.dietType} onValueChange={(value) => setGoals({...goals, dietType: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-xs focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cutting">Lose Weight</SelectItem>
                                                            <SelectItem value="bulking">Gain Weight</SelectItem>
                                                            <SelectItem value="maintenance">Maintain</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="startingWeight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Current Weight</Label>
                                                        <Input
                                                            id="startingWeight"
                                                            type="number"
                                                            value={goals.startingWeight}
                                                            onChange={(e) => setGoals({...goals, startingWeight: e.target.value})}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors"
                                                            placeholder="70"
                                                            inputMode="decimal"
                                                            min="0"
                                                            max="300"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="goalWeight" className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Target Weight</Label>
                                                        <Input
                                                            id="goalWeight"
                                                            type="number"
                                                            value={goals.goalWeight}
                                                            onChange={(e) => setGoals({...goals, goalWeight: e.target.value})}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] h-9 text-sm font-medium text-center focus:ring-1 focus:ring-[#2A8CEA] focus:border-[#2A8CEA] transition-colors"
                                                            placeholder="75"
                                                            inputMode="decimal"
                                                            min="0"
                                                            max="300"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={handleSaveGoals}
                                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-lg border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-9 text-sm font-medium mt-6"
                                        >
                                            Save Goals
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}