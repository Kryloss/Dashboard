"use client"

import { useEffect, useState } from "react"
import { isOnSubdomain } from "@/lib/subdomains"
import { HealssNav } from "@/app/healss/components/healss-nav"

export default function NutritionPage() {
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)

    useEffect(() => {
        // Check if we're on the healss subdomain
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)
    }, [])

    // If we're on healss.kryloss.com, show healss content
    if (isHealssSubdomain) {
        return (
            <div className="min-h-screen bg-[#0B0C0D]">
                <HealssNav />
                <div className="container mx-auto max-w-7xl px-6 py-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-6 tracking-tight">
                            Nutrition Tracker
                        </h1>
                        <p className="text-xl text-[#9CA9B7] max-w-3xl mx-auto">
                            Track your daily nutrition, monitor macronutrients, and maintain a balanced diet to support your fitness goals.
                        </p>
                    </div>

                    {/* Daily Nutrition Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-[#4AA7FF] mb-2">1,850</div>
                            <div className="text-sm text-[#9CA9B7]">Calories</div>
                            <div className="text-xs text-[#6B7280] mt-1">Goal: 2,000</div>
                        </div>

                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-[#4AA7FF] mb-2">145g</div>
                            <div className="text-sm text-[#9CA9B7]">Protein</div>
                            <div className="text-xs text-[#6B7280] mt-1">Goal: 150g</div>
                        </div>

                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-[#4AA7FF] mb-2">65g</div>
                            <div className="text-sm text-[#9CA9B7]">Fat</div>
                            <div className="text-xs text-[#6B7280] mt-1">Goal: 67g</div>
                        </div>

                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-[#4AA7FF] mb-2">180g</div>
                            <div className="text-sm text-[#9CA9B7]">Carbs</div>
                            <div className="text-xs text-[#6B7280] mt-1">Goal: 200g</div>
                        </div>
                    </div>

                    {/* Meal Tracking */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Today's Meals */}
                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-[#FBF7FA] mb-4">Today&apos;s Meals</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-[#0B0C0D] rounded-lg">
                                    <div>
                                        <div className="font-medium text-[#FBF7FA]">Breakfast</div>
                                        <div className="text-sm text-[#9CA9B7]">Oatmeal with berries</div>
                                    </div>
                                    <div className="text-[#4AA7FF] font-semibold">320 cal</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#0B0C0D] rounded-lg">
                                    <div>
                                        <div className="font-medium text-[#FBF7FA]">Lunch</div>
                                        <div className="text-sm text-[#9CA9B7]">Grilled chicken salad</div>
                                    </div>
                                    <div className="text-[#4AA7FF] font-semibold">450 cal</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#0B0C0D] rounded-lg">
                                    <div>
                                        <div className="font-medium text-[#FBF7FA]">Dinner</div>
                                        <div className="text-sm text-[#9CA9B7]">Salmon with vegetables</div>
                                    </div>
                                    <div className="text-[#4AA7FF] font-semibold">580 cal</div>
                                </div>
                            </div>
                        </div>

                        {/* Water Intake */}
                        <div className="bg-[#1A1D21] border border-[#2A3442] rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-[#FBF7FA] mb-4">Water Intake</h3>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-[#4AA7FF] mb-2">6/8</div>
                                <div className="text-sm text-[#9CA9B7] mb-4">glasses today</div>
                                <div className="w-full bg-[#0B0C0D] rounded-full h-3">
                                    <div className="bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] h-3 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                                <div className="text-xs text-[#6B7280] mt-2">Goal: 8 glasses (2L)</div>
                            </div>
                        </div>
                    </div>

                    {/* Add Meal Button */}
                    <div className="text-center mt-8">
                        <button className="bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] text-white px-8 py-3 rounded-full hover:from-[#3B82F6] hover:to-[#7C3AED] transition-all">
                            + Add Meal
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // If not on healss subdomain, redirect to main site or show error
    return (
        <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-[#FBF7FA] mb-4">Page Not Found</h1>
                <p className="text-[#9CA9B7]">This page is only available on the healss subdomain.</p>
            </div>
        </div>
    )
}
