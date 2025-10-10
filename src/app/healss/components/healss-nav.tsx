"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useAuthContext } from "@/lib/contexts/AuthContext"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/database.types"

export function HealssNav() {
    const pathname = usePathname()
    const { user, loading, signOut } = useAuthContext()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [hasAccount, setHasAccount] = useState(false)
    const supabase = createClient()

    // Check authentication status and load profile
    useEffect(() => {
        async function checkAuthAndProfile() {
            let accountSignedIn = false

            // Method 1: Check if user exists from AuthContext
            if (user) {
                accountSignedIn = true
            }

            // Method 2: Check session directly from Supabase
            if (!accountSignedIn) {
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session?.user) {
                        accountSignedIn = true
                    }
                } catch (err) {
                    console.log('Auth check failed:', err)
                }
            }

            // If authenticated, fetch profile
            if (accountSignedIn && user) {
                try {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (error && error.code !== 'PGRST116') {
                        console.error('Profile fetch error:', error)
                    }

                    setProfile(profile || null)
                } catch (err) {
                    console.error('Profile fetch failed:', err)
                    setProfile(null)
                }
            } else {
                setProfile(null)
            }

            setHasAccount(accountSignedIn)
        }

        checkAuthAndProfile()
    }, [user, supabase])

    const navItems = [
        { href: "https://healss.kryloss.com/workout", label: "Workout", current: pathname === "/workout" },
        { href: "https://healss.kryloss.com/nutrition", label: "Nutrition", current: pathname === "/nutrition" },
        { href: "https://healss.kryloss.com/progress", label: "Progress", current: pathname === "/progress" },
    ]

    return (
        <nav className="bg-[#1A1D21] border-b border-[#2A3442] sticky top-0 z-50">
            <div className="container mx-auto max-w-7xl px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/workout" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#4AA7FF] to-[#6B46C1] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">H</span>
                            </div>
                            <span className="text-xl font-bold text-[#FBF7FA]">Healss</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center">
                        <Tabs
                            value={pathname.includes('/workout') ? 'workout' : pathname.includes('/nutrition') ? 'nutrition' : pathname.includes('/progress') ? 'progress' : 'workout'}
                            className="w-auto"
                        >
                            <TabsList className="bg-[#0F101A] border border-[#2A3442] h-11 p-1">
                                <TabsTrigger
                                    value="workout"
                                    asChild
                                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#114EB2] data-[state=active]:via-[#257ADA] data-[state=active]:to-[#4AA7FF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(37,122,218,0.35)] text-[#9CA9B7] hover:text-[#FBF7FA] transition-all"
                                >
                                    <Link href="https://healss.kryloss.com/workout">Workout</Link>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="nutrition"
                                    asChild
                                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#114EB2] data-[state=active]:via-[#257ADA] data-[state=active]:to-[#4AA7FF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(37,122,218,0.35)] text-[#9CA9B7] hover:text-[#FBF7FA] transition-all"
                                >
                                    <Link href="https://healss.kryloss.com/nutrition">Nutrition</Link>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="progress"
                                    asChild
                                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#114EB2] data-[state=active]:via-[#257ADA] data-[state=active]:to-[#4AA7FF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(37,122,218,0.35)] text-[#9CA9B7] hover:text-[#FBF7FA] transition-all"
                                >
                                    <Link href="https://healss.kryloss.com/progress">Progress</Link>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-[#121922] animate-pulse"></div>
                        ) : user || hasAccount ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
                                            <AvatarFallback className="bg-[#0F101A] text-[#FBF7FA] text-xs font-semibold border border-[#2A3442]">
                                                {profile?.username ? profile.username[0].toUpperCase() : 'K'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 bg-[#121922] border-[#2A3442] shadow-[0_14px_40px_rgba(0,0,0,0.55)]" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal p-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
                                                <AvatarFallback className="bg-[#0F101A] text-[#FBF7FA] text-sm font-semibold border border-[#2A3442]">
                                                    {profile?.username ? profile.username[0].toUpperCase() : 'K'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-semibold leading-none text-[#FBF7FA]">
                                                    {profile?.username || profile?.full_name || 'User'}
                                                </p>
                                                <p className="text-xs leading-none text-[#9CA9B7] truncate max-w-[120px]">
                                                    {user?.email}
                                                </p>
                                                <div className="inline-flex items-center gap-1.5 mt-1">
                                                    <div className="w-1.5 h-1.5 bg-[#4AA7FF] rounded-full"></div>
                                                    <span className="text-xs text-[#4AA7FF] font-medium">Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-[#2A3442]" />
                                    <DropdownMenuItem asChild className="text-[#FBF7FA] hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white px-4 py-2">
                                        <Link href="/dashboard">
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="text-[#FBF7FA] hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white px-4 py-2">
                                        <Link href="/profile">
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#2A3442]" />
                                    <DropdownMenuItem
                                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300 cursor-pointer px-4 py-2"
                                        onClick={signOut}
                                    >
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    asChild
                                    className="rounded-full border-[#2A3442] text-[#FBF7FA] hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-[#93C5FD]"
                                >
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button
                                    asChild
                                    className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#0B0C0D] active:brightness-95 transition-all"
                                >
                                    <Link href="/signup">Sign Up</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}