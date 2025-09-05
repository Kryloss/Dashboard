"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
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
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden">
                <DialogHeader className="pb-3">
                    <DialogTitle className="text-lg font-semibold text-[#F3F4F6]">
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Custom Tab List positioned on the left */}
                    <div className="flex flex-col gap-4">
                        {/* Tab Navigation - Bookmark Style */}
                        <div className="flex space-x-1 border-b border-[#212227]">
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`
                                    flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-all relative
                                    ${activeTab === "account" 
                                        ? "text-[#2A8CEA] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2A8CEA] after:rounded-t" 
                                        : "text-[#A1A1AA] hover:text-[#F3F4F6]"
                                    }
                                `}
                            >
                                <User className="w-4 h-4" />
                                <span>Account</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("goals")}
                                className={`
                                    flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-all relative
                                    ${activeTab === "goals" 
                                        ? "text-[#2A8CEA] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2A8CEA] after:rounded-t" 
                                        : "text-[#A1A1AA] hover:text-[#F3F4F6]"
                                    }
                                `}
                            >
                                <Target className="w-4 h-4" />
                                <span>Set Goals</span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        {/* Tab Content */}
                        <div className="overflow-y-auto max-h-[65vh]">
                            <TabsContent value="account" className="mt-0">
                                <div className="space-y-4">

                                    {/* Profile Information */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center space-x-3 mb-4">
                                                {/* Me - Profile Photo */}
                                                <div className="w-12 h-12 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[12px] flex items-center justify-center">
                                                    <User className="w-6 h-6 text-[#A1A1AA]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-[#F3F4F6] font-medium">Me</p>
                                                    <p className="text-xs text-[#A1A1AA]">Profile info</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                            {/* Weight */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-2">
                                                    <Label htmlFor="weight" className="text-xs text-[#A1A1AA]">Weight</Label>
                                                    <Input
                                                        id="weight"
                                                        type="number"
                                                        value={profile.weight}
                                                        onChange={(e) => setProfile({...profile, weight: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                        placeholder="70"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="weightUnit" className="text-xs text-[#A1A1AA]">Unit</Label>
                                                    <Select value={profile.weightUnit} onValueChange={(value) => setProfile({...profile, weightUnit: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm">
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
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-2">
                                                    <Label htmlFor="height" className="text-xs text-[#A1A1AA]">Height</Label>
                                                    <Input
                                                        id="height"
                                                        type="number"
                                                        value={profile.height}
                                                        onChange={(e) => setProfile({...profile, height: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                        placeholder="175"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="heightUnit" className="text-xs text-[#A1A1AA]">Unit</Label>
                                                    <Select value={profile.heightUnit} onValueChange={(value) => setProfile({...profile, heightUnit: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm">
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
                                            <div className="max-w-[100px]">
                                                <Label htmlFor="age" className="text-xs text-[#A1A1AA]">Age</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    value={profile.age}
                                                    onChange={(e) => setProfile({...profile, age: e.target.value})}
                                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                    placeholder="25"
                                                />
                                            </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Save Button */}
                                    <Button 
                                        onClick={handleSaveProfile}
                                        className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-[8px] border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-8 text-sm"
                                    >
                                        Save Profile
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="goals" className="mt-0">
                                <div className="space-y-3">
                                    {/* Exercise Goals */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Dumbbell className="w-4 h-4 text-[#A1A1AA]" />
                                                <span className="text-sm font-medium text-[#F3F4F6]">Exercise Goals</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor="dailyExercise" className="text-xs text-[#A1A1AA]">Daily Minutes</Label>
                                                    <Input
                                                        id="dailyExercise"
                                                        type="number"
                                                        value={goals.dailyExerciseMinutes}
                                                        onChange={(e) => setGoals({...goals, dailyExerciseMinutes: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="weeklyExercise" className="text-xs text-[#A1A1AA]">Weekly Sessions</Label>
                                                    <Input
                                                        id="weeklyExercise"
                                                        type="number"
                                                        value={goals.weeklyExerciseSessions}
                                                        onChange={(e) => setGoals({...goals, weeklyExerciseSessions: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Calorie Goals */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Flame className="w-4 h-4 text-[#A1A1AA]" />
                                                <span className="text-sm font-medium text-[#F3F4F6]">Calorie Goals</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor="dailyCalories" className="text-xs text-[#A1A1AA]">Daily Calories</Label>
                                                    <Input
                                                        id="dailyCalories"
                                                        type="number"
                                                        value={goals.dailyCalories}
                                                        onChange={(e) => setGoals({...goals, dailyCalories: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="activityLevel" className="text-xs text-[#A1A1AA]">Activity Level</Label>
                                                    <Select value={goals.activityLevel} onValueChange={(value) => setGoals({...goals, activityLevel: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm">
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
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Recovery Goals */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Moon className="w-4 h-4 text-[#A1A1AA]" />
                                                <span className="text-sm font-medium text-[#F3F4F6]">Recovery Goals</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor="sleepHours" className="text-xs text-[#A1A1AA]">Sleep Hours</Label>
                                                    <Input
                                                        id="sleepHours"
                                                        type="number"
                                                        value={goals.sleepHours}
                                                        onChange={(e) => setGoals({...goals, sleepHours: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                        step="0.5"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="recoveryTime" className="text-xs text-[#A1A1AA]">Recovery Minutes</Label>
                                                    <Input
                                                        id="recoveryTime"
                                                        type="number"
                                                        value={goals.recoveryMinutes}
                                                        onChange={(e) => setGoals({...goals, recoveryMinutes: e.target.value})}
                                                        className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Goal Weight */}
                                    <Card className="bg-[#121318] border-[#212227]">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Weight className="w-4 h-4 text-[#A1A1AA]" />
                                                <span className="text-sm font-medium text-[#F3F4F6]">Goal Weight</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label htmlFor="dietType" className="text-xs text-[#A1A1AA]">Diet Type</Label>
                                                    <Select value={goals.dietType} onValueChange={(value) => setGoals({...goals, dietType: value})}>
                                                        <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cutting">Cutting (Lose Weight)</SelectItem>
                                                            <SelectItem value="bulking">Bulking (Gain Weight)</SelectItem>
                                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor="startingWeight" className="text-xs text-[#A1A1AA]">Starting Weight</Label>
                                                        <Input
                                                            id="startingWeight"
                                                            type="number"
                                                            value={goals.startingWeight}
                                                            onChange={(e) => setGoals({...goals, startingWeight: e.target.value})}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                            placeholder="70"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="goalWeight" className="text-xs text-[#A1A1AA]">Goal Weight</Label>
                                                        <Input
                                                            id="goalWeight"
                                                            type="number"
                                                            value={goals.goalWeight}
                                                            onChange={(e) => setGoals({...goals, goalWeight: e.target.value})}
                                                            className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] mt-1 h-8 text-sm"
                                                            placeholder="75"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Save Button */}
                                    <Button 
                                        onClick={handleSaveGoals}
                                        className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-[8px] border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all h-8 text-sm"
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