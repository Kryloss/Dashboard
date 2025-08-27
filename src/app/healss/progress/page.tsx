export default function ProgressPage() {
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
                    <h1 className="text-4xl font-bold mb-4">Progress Tracker</h1>
                    <p className="text-[#9CA9B7] text-lg">Monitor your fitness journey and celebrate achievements</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h3 className="text-sm font-medium text-[#9CA9B7] mb-2">Current Weight</h3>
                        <div className="text-2xl font-bold text-blue-400">-- lbs</div>
                        <div className="text-xs text-[#556274] mt-1">Last recorded: --</div>
                        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                            <p className="text-blue-400 text-xs">🚧 Weight tracking coming soon</p>
                        </div>
                    </div>

                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h3 className="text-sm font-medium text-[#9CA9B7] mb-2">Body Fat %</h3>
                        <div className="text-2xl font-bold text-green-400">--%</div>
                        <div className="text-xs text-[#556274] mt-1">Target: --%</div>
                        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-green-400 text-xs">🚧 Body composition coming soon</p>
                        </div>
                    </div>

                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h3 className="text-sm font-medium text-[#9CA9B7] mb-2">Muscle Mass</h3>
                        <div className="text-2xl font-bold text-purple-400">-- lbs</div>
                        <div className="text-xs text-[#556274] mt-1">Change: +-- lbs</div>
                        <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-md">
                            <p className="text-purple-400 text-xs">🚧 Muscle tracking coming soon</p>
                        </div>
                    </div>

                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h3 className="text-sm font-medium text-[#9CA9B7] mb-2">Streak</h3>
                        <div className="text-2xl font-bold text-yellow-400">-- days</div>
                        <div className="text-xs text-[#556274] mt-1">Personal best: -- days</div>
                        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                            <p className="text-yellow-400 text-xs">🚧 Streak tracking coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Weight Progress Chart */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Weight Progress
                        </h2>
                        <div className="h-48 bg-[#0F101A] rounded-md border border-[#1C2430] flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-[#556274] text-lg mb-2">📊</div>
                                <p className="text-[#9CA9B7] text-sm">Chart will appear here</p>
                                <p className="text-[#556274] text-xs mt-1">Start tracking to see progress</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                            <p className="text-blue-400 text-sm">🚧 Weight charts coming soon</p>
                        </div>
                    </div>

                    {/* Workout Progress Chart */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Workout Frequency
                        </h2>
                        <div className="h-48 bg-[#0F101A] rounded-md border border-[#1C2430] flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-[#556274] text-lg mb-2">📈</div>
                                <p className="text-[#9CA9B7] text-sm">Activity chart will appear here</p>
                                <p className="text-[#556274] text-xs mt-1">Complete workouts to see trends</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-green-400 text-sm">🚧 Activity charts coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Achievements & Goals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Achievements */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            Recent Achievements
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#1C2430] rounded-full flex items-center justify-center">
                                        <span className="text-[#556274]">🏆</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#9CA9B7]">No achievements yet</p>
                                        <p className="text-sm text-[#556274]">Start your fitness journey!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                            <p className="text-yellow-400 text-sm">🚧 Achievement system coming soon</p>
                        </div>
                    </div>

                    {/* Current Goals */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Current Goals
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-[#9CA9B7]">No goals set</p>
                                        <p className="text-sm text-[#556274]">Set your first goal to get started</p>
                                    </div>
                                    <div className="text-xs text-[#556274]">0%</div>
                                </div>
                                <div className="w-full bg-[#1C2430] rounded-full h-1.5 mt-2">
                                    <div className="bg-red-500 h-1.5 rounded-full" style={{width: '0%'}}></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-red-400 text-sm">🚧 Goal setting coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Body Measurements */}
                <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        Body Measurements
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                            <div className="text-sm text-[#9CA9B7] mb-1">Chest</div>
                            <div className="text-lg font-semibold text-[#FBF7FA]">-- in</div>
                        </div>
                        <div className="text-center p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                            <div className="text-sm text-[#9CA9B7] mb-1">Waist</div>
                            <div className="text-lg font-semibold text-[#FBF7FA]">-- in</div>
                        </div>
                        <div className="text-center p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                            <div className="text-sm text-[#9CA9B7] mb-1">Arms</div>
                            <div className="text-lg font-semibold text-[#FBF7FA]">-- in</div>
                        </div>
                        <div className="text-center p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                            <div className="text-sm text-[#9CA9B7] mb-1">Thighs</div>
                            <div className="text-lg font-semibold text-[#FBF7FA]">-- in</div>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-md">
                        <p className="text-cyan-400 text-sm">🚧 Body measurements coming soon</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white p-6 rounded-lg hover:from-[#257ADA] hover:to-[#90C9FF] transition-all shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Log Weight</h3>
                            <p className="text-blue-100 text-sm">Record your current weight</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                            Soon
                        </div>
                    </button>

                    <button className="bg-[#121922] border border-[#2A3442] text-[#FBF7FA] p-6 rounded-lg hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Set Goals</h3>
                            <p className="text-[#9CA9B7] text-sm">Define your fitness targets</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                            Dev
                        </div>
                    </button>

                    <button className="bg-[#121922] border border-[#2A3442] text-[#FBF7FA] p-6 rounded-lg hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Take Photos</h3>
                            <p className="text-[#9CA9B7] text-sm">Document your transformation</p>
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