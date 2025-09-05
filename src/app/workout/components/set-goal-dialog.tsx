"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-[#F3F4F6]">
                        Profile & Goals
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Custom Tab List positioned on the left */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 min-w-[120px] overflow-x-auto sm:overflow-x-visible">
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`
                                    flex items-center space-x-2 px-4 py-3 rounded-[12px] sm:rounded-l-[16px] sm:rounded-r-[8px] text-sm font-medium transition-all text-left whitespace-nowrap flex-shrink-0
                                    ${activeTab === "account" 
                                        ? "bg-[#121318] border border-[#2A8CEA] text-[#F3F4F6] shadow-[0_0_0_1px_rgba(42,140,234,0.35)]" 
                                        : "bg-[#0E0F13] border border-[#212227] text-[#A1A1AA] hover:bg-[#17181D] hover:border-[#2A2B31] hover:text-[#F3F4F6]"
                                    }
                                `}
                            >
                                <User className="w-4 h-4" />
                                <span>Account</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("goals")}
                                className={`
                                    flex items-center space-x-2 px-4 py-3 rounded-[12px] sm:rounded-l-[16px] sm:rounded-r-[8px] text-sm font-medium transition-all text-left whitespace-nowrap flex-shrink-0
                                    ${activeTab === "goals" 
                                        ? "bg-[#121318] border border-[#2A8CEA] text-[#F3F4F6] shadow-[0_0_0_1px_rgba(42,140,234,0.35)]" 
                                        : "bg-[#0E0F13] border border-[#212227] text-[#A1A1AA] hover:bg-[#17181D] hover:border-[#2A2B31] hover:text-[#F3F4F6]"
                                    }
                                `}
                            >
                                <Target className="w-4 h-4" />
                                <span>Set Goals</span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
                            <TabsContent value="account" className="mt-0">
                                <div className="space-y-6">
                                    {/* Profile Photo Card */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-24 h-24 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[20px] flex items-center justify-center">
                                                    <User className="w-12 h-12 text-[#A1A1AA]" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-[#F3F4F6] font-medium">Profile Photo</p>
                                                    <p className="text-xs text-[#A1A1AA] mt-1">Body photo coming soon</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Profile Information */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#F3F4F6] flex items-center space-x-2">
                                                <User className="w-5 h-5" />
                                                <span>Profile Information</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Weight */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="col-span-1 sm:col-span-2">
                                                    <Label htmlFor="weight" className="text-sm text-[#A1A1AA]">Weight</Label>
                                                    <Input
                                                        id="weight"
                                                        type="number"
                                                        value={profile.weight}
                                                        onChange={(e) => setProfile({...profile, weight: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                        placeholder="70"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="weightUnit" className="text-sm text-[#A1A1AA]">Unit</Label>
                                                    <Select value={profile.weightUnit} onValueChange={(value) => setProfile({...profile, weightUnit: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="kg">kg</SelectItem>
                                                            <SelectItem value="lbs">lbs</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Height */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="col-span-1 sm:col-span-2">
                                                    <Label htmlFor="height" className="text-sm text-[#A1A1AA]">Height</Label>
                                                    <Input
                                                        id="height"
                                                        type="number"
                                                        value={profile.height}
                                                        onChange={(e) => setProfile({...profile, height: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                        placeholder="175"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="heightUnit" className="text-sm text-[#A1A1AA]">Unit</Label>
                                                    <Select value={profile.heightUnit} onValueChange={(value) => setProfile({...profile, heightUnit: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cm">cm</SelectItem>
                                                            <SelectItem value="ft">ft</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Age */}
                                            <div>
                                                <Label htmlFor="age" className="text-sm text-[#A1A1AA]">Age</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    value={profile.age}
                                                    onChange={(e) => setProfile({...profile, age: e.target.value})}
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 max-w-[120px]"
                                                    placeholder="25"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Save Button */}
                                    <Button 
                                        onClick={handleSaveProfile}
                                        className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                    >
                                        Save Profile
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="goals" className="mt-0">
                                <div className="space-y-6">
                                    {/* Exercise Goals */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#F3F4F6] flex items-center space-x-2">
                                                <Dumbbell className="w-5 h-5" />
                                                <span>Exercise Goals</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="dailyExercise" className="text-sm text-[#A1A1AA]">Daily Exercise (minutes)</Label>
                                                    <Input
                                                        id="dailyExercise"
                                                        type="number"
                                                        value={goals.dailyExerciseMinutes}
                                                        onChange={(e) => setGoals({...goals, dailyExerciseMinutes: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="weeklyExercise" className="text-sm text-[#A1A1AA]">Weekly Sessions</Label>
                                                    <Input
                                                        id="weeklyExercise"
                                                        type="number"
                                                        value={goals.weeklyExerciseSessions}
                                                        onChange={(e) => setGoals({...goals, weeklyExerciseSessions: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Calorie Goals */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#F3F4F6] flex items-center space-x-2">
                                                <Flame className="w-5 h-5" />
                                                <span>Calorie Goals</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <Label htmlFor="dailyCalories" className="text-sm text-[#A1A1AA]">Daily Calories</Label>
                                                <Input
                                                    id="dailyCalories"
                                                    type="number"
                                                    value={goals.dailyCalories}
                                                    onChange={(e) => setGoals({...goals, dailyCalories: e.target.value})}
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 max-w-[150px]"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="activityLevel" className="text-sm text-[#A1A1AA]">Activity Level</Label>
                                                <Select value={goals.activityLevel} onValueChange={(value) => setGoals({...goals, activityLevel: value})}>
                                                    <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 max-w-[200px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="sedentary">Sedentary</SelectItem>
                                                        <SelectItem value="light">Lightly Active</SelectItem>
                                                        <SelectItem value="moderate">Moderately Active</SelectItem>
                                                        <SelectItem value="active">Very Active</SelectItem>
                                                        <SelectItem value="extra">Extra Active</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Recovery Goals */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#F3F4F6] flex items-center space-x-2">
                                                <Moon className="w-5 h-5" />
                                                <span>Recovery Goals</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="sleepHours" className="text-sm text-[#A1A1AA]">Sleep Hours</Label>
                                                    <Input
                                                        id="sleepHours"
                                                        type="number"
                                                        value={goals.sleepHours}
                                                        onChange={(e) => setGoals({...goals, sleepHours: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                        step="0.5"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recoveryTime" className="text-sm text-[#A1A1AA]">Recovery Time (minutes)</Label>
                                                    <Input
                                                        id="recoveryTime"
                                                        type="number"
                                                        value={goals.recoveryMinutes}
                                                        onChange={(e) => setGoals({...goals, recoveryMinutes: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Goal Weight */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardHeader>
                                            <CardTitle className="text-lg text-[#F3F4F6] flex items-center space-x-2">
                                                <Weight className="w-5 h-5" />
                                                <span>Goal Weight</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <Label htmlFor="dietType" className="text-sm text-[#A1A1AA]">Diet Type</Label>
                                                <Select value={goals.dietType} onValueChange={(value) => setGoals({...goals, dietType: value})}>
                                                    <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 max-w-[200px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cutting">Cutting (Lose Weight)</SelectItem>
                                                        <SelectItem value="bulking">Bulking (Gain Weight)</SelectItem>
                                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="startingWeight" className="text-sm text-[#A1A1AA]">Starting Weight</Label>
                                                    <Input
                                                        id="startingWeight"
                                                        type="number"
                                                        value={goals.startingWeight}
                                                        onChange={(e) => setGoals({...goals, startingWeight: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                        placeholder="70"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="goalWeight" className="text-sm text-[#A1A1AA]">Goal Weight</Label>
                                                    <Input
                                                        id="goalWeight"
                                                        type="number"
                                                        value={goals.goalWeight}
                                                        onChange={(e) => setGoals({...goals, goalWeight: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1"
                                                        placeholder="75"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Save Button */}
                                    <Button 
                                        onClick={handleSaveGoals}
                                        className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                                    >
                                        Save Goals
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}