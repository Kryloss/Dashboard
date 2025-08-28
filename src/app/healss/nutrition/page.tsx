export default function NutritionPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0D] text-[#FBF7FA]">
            <div className="container mx-auto px-4 py-8">
                {/* Development Banner */}
                <div className="mb-8 p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-orange-400 font-medium">Development Mode</span>
                    </div>
                    <p className="text-[#9CA9B7] text-sm mt-1">This feature is currently under development and will be available soon.</p>
                </div>

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">Nutrition Tracker</h1>
                    <p className="text-[#9CA9B7] text-lg">Track your daily nutrition and reach your dietary goals</p>
                </div>

                {/* Daily Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Calories */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Calories
                        </h2>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-400 mb-2">--</div>
                            <div className="text-[#9CA9B7] text-sm">of -- goal</div>
                            <div className="w-full bg-[#0F101A] rounded-full h-2 mt-4">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-red-400 text-sm">🚧 Calorie tracking coming soon</p>
                        </div>
                    </div>

                    {/* Macros */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Macros
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[#9CA9B7]">Protein</span>
                                <span className="text-blue-400 font-semibold">--g</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#9CA9B7]">Carbs</span>
                                <span className="text-green-400 font-semibold">--g</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#9CA9B7]">Fat</span>
                                <span className="text-yellow-400 font-semibold">--g</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                            <p className="text-blue-400 text-sm">🚧 Macro tracking coming soon</p>
                        </div>
                    </div>

                    {/* Water Intake */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            Water
                        </h2>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-cyan-400 mb-2">--</div>
                            <div className="text-[#9CA9B7] text-sm">glasses today</div>
                            <div className="grid grid-cols-4 gap-1 mt-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-8 bg-[#0F101A] rounded border border-[#1C2430]"></div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-md">
                            <p className="text-cyan-400 text-sm">🚧 Water tracking coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Recent Meals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Today&apos;s Meals
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-[#9CA9B7]">Breakfast</p>
                                        <p className="text-sm text-[#556274]">No meals logged</p>
                                    </div>
                                    <span className="text-[#556274]">-- cal</span>
                                </div>
                            </div>
                            <div className="p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-[#9CA9B7]">Lunch</p>
                                        <p className="text-sm text-[#556274]">No meals logged</p>
                                    </div>
                                    <span className="text-[#556274]">-- cal</span>
                                </div>
                            </div>
                            <div className="p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-[#9CA9B7]">Dinner</p>
                                        <p className="text-sm text-[#556274]">No meals logged</p>
                                    </div>
                                    <span className="text-[#556274]">-- cal</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-green-400 text-sm">🚧 Meal logging coming soon</p>
                        </div>
                    </div>

                    {/* Quick Add */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <button className="w-full p-3 bg-[#0F101A] border border-[#1C2430] rounded-md text-left hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#FBF7FA]">Search Foods</span>
                                    <span className="text-[#9CA9B7]">🔍</span>
                                </div>
                                <div className="absolute top-1 right-1 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                                    Dev
                                </div>
                            </button>
                            <button className="w-full p-3 bg-[#0F101A] border border-[#1C2430] rounded-md text-left hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#FBF7FA]">Barcode Scanner</span>
                                    <span className="text-[#9CA9B7]">📱</span>
                                </div>
                                <div className="absolute top-1 right-1 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                                    Dev
                                </div>
                            </button>
                            <button className="w-full p-3 bg-[#0F101A] border border-[#1C2430] rounded-md text-left hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#FBF7FA]">Recipe Builder</span>
                                    <span className="text-[#9CA9B7]">🍳</span>
                                </div>
                                <div className="absolute top-1 right-1 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                                    Dev
                                </div>
                            </button>
                            <button className="w-full p-3 bg-[#0F101A] border border-[#1C2430] rounded-md text-left hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#FBF7FA]">Meal Plans</span>
                                    <span className="text-[#9CA9B7]">📋</span>
                                </div>
                                <div className="absolute top-1 right-1 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                                    Dev
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white p-6 rounded-lg hover:from-[#257ADA] hover:to-[#90C9FF] transition-all shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Add Food</h3>
                            <p className="text-blue-100 text-sm">Log your meals and snacks</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                            Soon
                        </div>
                    </button>

                    <button className="bg-[#121922] border border-[#2A3442] text-[#FBF7FA] p-6 rounded-lg hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Set Goals</h3>
                            <p className="text-[#9CA9B7] text-sm">Configure nutrition targets</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                            Dev
                        </div>
                    </button>

                    <button className="bg-[#121922] border border-[#2A3442] text-[#FBF7FA] p-6 rounded-lg hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">View Reports</h3>
                            <p className="text-[#9CA9B7] text-sm">Analyze nutrition trends</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                            Dev
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}