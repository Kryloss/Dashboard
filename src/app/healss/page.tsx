export default function HealssHomePage() {
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
                    <h1 className="text-4xl font-bold mb-4">Workout Tracker</h1>
                    <p className="text-[#9CA9B7] text-lg">Plan, track, and optimize your fitness journey</p>
                </div>

                {/* Content Areas with Development Signs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Quick Stats */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Quick Stats
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[#9CA9B7]">This Week</span>
                                <span className="text-2xl font-bold text-green-400">--</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#9CA9B7]">Total Workouts</span>
                                <span className="text-2xl font-bold text-blue-400">--</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#9CA9B7]">Streak</span>
                                <span className="text-2xl font-bold text-yellow-400">--</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                            <p className="text-blue-400 text-sm">🚧 Stats tracking coming soon</p>
                        </div>
                    </div>

                    {/* Recent Workouts */}
                    <div className="bg-[#121922] border border-[#2A3442] rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Recent Workouts
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#0F101A] rounded-md border border-[#1C2430]">
                                <p className="font-medium text-[#9CA9B7]">No workouts yet</p>
                                <p className="text-sm text-[#556274]">Start your first workout to see it here</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-green-400 text-sm">🚧 Workout logging coming soon</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white p-6 rounded-lg hover:from-[#257ADA] hover:to-[#90C9FF] transition-all shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Start Workout</h3>
                            <p className="text-blue-100 text-sm">Begin a new workout session</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                            Soon
                        </div>
                    </button>

                    <button className="bg-[#121922] border border-[#2A3442] text-[#FBF7FA] p-6 rounded-lg hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Browse Plans</h3>
                            <p className="text-[#9CA9B7] text-sm">Explore workout templates</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                            Dev
                        </div>
                    </button>

                    <button className="bg-[#121922] border border-[#2A3442] text-[#FBF7FA] p-6 rounded-lg hover:bg-[#1C2430] transition-colors relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">View History</h3>
                            <p className="text-[#9CA9B7] text-sm">Check past workouts</p>
                        </div>
                        <div className="absolute top-2 right-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                            Dev
                        </div>
                    </button>
                </div>

                {/* Additional Navigation */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-4 p-4 bg-[#121922] border border-[#2A3442] rounded-lg">
                        <span className="text-[#9CA9B7]">Explore more features:</span>
                        <a href="/nutrition" className="text-[#4AA7FF] hover:text-[#90C9FF] transition-colors">
                            Nutrition Tracker
                        </a>
                        <a href="/progress" className="text-[#4AA7FF] hover:text-[#90C9FF] transition-colors">
                            Progress Tracker
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}