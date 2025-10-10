"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
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
import { getSubdomains, subdomains } from "@/lib/subdomains"
import { cn } from "@/lib/utils"
import { useAuthContext } from "@/lib/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import type { Profile } from "@/lib/types/database.types"

export function NavBar() {
    const { user, loading, signOut: authSignOut, isAuthenticated } = useAuthContext()
    const pathname = usePathname()

    // Debug authentication state changes
    useEffect(() => {
        console.log('NavBar: Auth state changed:', {
            user: user?.email || null,
            loading,
            isAuthenticated
        })
    }, [user, loading, isAuthenticated])
    const [profile, setProfile] = useState<Profile | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [dynamicSubdomains, setDynamicSubdomains] = useState(subdomains)
    const mobileMenuRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Update subdomains on client side
    useEffect(() => {
        setDynamicSubdomains(getSubdomains())
    }, [])

    // Single profile fetch effect - only runs when user changes
    useEffect(() => {
        if (!user?.id) {
            setProfile(null)
            return
        }

        async function fetchProfile() {
            if (!user?.id) return // Additional safety check

            try {
                console.log('NavBar: Fetching profile for user:', user.email)
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    console.error('NavBar: Profile fetch error:', error)
                }

                setProfile(profile || null)
                console.log('NavBar: Profile loaded for:', profile?.email || 'unknown user')
            } catch (err) {
                console.error('NavBar: Profile fetch failed:', err)
                setProfile(null)
            }
        }

        fetchProfile()
    }, [user, supabase])

    // Close mobile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false)
            }
        }

        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [mobileMenuOpen])

    const handleSignOut = useCallback(async () => {
        try {
            console.log('NavBar: Initiating sign out...')
            await authSignOut()
        } catch (error) {
            console.error('NavBar: Sign out error:', error)
        }
    }, [authSignOut])

    // Safe client-side hostname check
    const [isOnHealss, setIsOnHealss] = useState(false)
    useEffect(() => {
        setIsOnHealss(window.location.hostname.includes('healss.kryloss.com'))
    }, [])

    // Determine active tab for Healss navigation
    const getActiveTab = () => {
        if (pathname.startsWith('/workout')) return 'workout'
        if (pathname.startsWith('/nutrition')) return 'nutrition'
        if (pathname.startsWith('/progress')) return 'progress'
        return 'workout'
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#1C2430] bg-[#0B0C0D]/80 backdrop-blur">
            <div className="flex h-16 w-full items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center">
                    <Link
                        href="https://kryloss.com"
                        className="flex items-center space-x-2 font-bold text-xl text-[#FBF7FA] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#0B0C0D] rounded-md px-2 py-1"
                    >
                        <span>Kryloss</span>
                    </Link>
                </div>

                {/* Center Navigation - Responsive */}
                <div className="hidden md:flex items-center space-x-6">
                    {/* Individual tool links - show on larger screens (lg+) */}
                    <div className="hidden lg:flex items-center space-x-6">
                        {isOnHealss ? (
                            // Healss-specific navigation with Tabs
                            <Tabs value={getActiveTab()} className="w-auto">
                                <TabsList className="bg-transparent border-0 h-auto p-0 gap-6">
                                    <TabsTrigger
                                        value="workout"
                                        asChild
                                        className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#114EB2] data-[state=active]:via-[#257ADA] data-[state=active]:to-[#4AA7FF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(37,122,218,0.35)] data-[state=active]:px-4 data-[state=active]:py-1.5 data-[state=active]:rounded-full text-[#9CA9B7] hover:text-[#FBF7FA] transition-all bg-transparent shadow-none px-0 py-0"
                                    >
                                        <Link href="/workout">Workout</Link>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="nutrition"
                                        asChild
                                        className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#114EB2] data-[state=active]:via-[#257ADA] data-[state=active]:to-[#4AA7FF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(37,122,218,0.35)] data-[state=active]:px-4 data-[state=active]:py-1.5 data-[state=active]:rounded-full text-[#9CA9B7] hover:text-[#FBF7FA] transition-all bg-transparent shadow-none px-0 py-0"
                                    >
                                        <Link href="/nutrition">Nutrition</Link>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="progress"
                                        asChild
                                        className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#114EB2] data-[state=active]:via-[#257ADA] data-[state=active]:to-[#4AA7FF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(37,122,218,0.35)] data-[state=active]:px-4 data-[state=active]:py-1.5 data-[state=active]:rounded-full text-[#9CA9B7] hover:text-[#FBF7FA] transition-all bg-transparent shadow-none px-0 py-0"
                                    >
                                        <Link href="/progress">Progress</Link>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        ) : (
                            // Main site navigation
                            <>
                                {dynamicSubdomains.map((subdomain) => (
                                    <Link
                                        key={subdomain.name}
                                        href={subdomain.url}
                                        className="text-[#9CA9B7] hover:text-[#FBF7FA] transition-colors px-3 py-2 rounded-md hover:bg-white/5"
                                    >
                                        {subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}
                                    </Link>
                                ))}
                                <Link
                                    href="/docs"
                                    className="text-[#9CA9B7] hover:text-[#FBF7FA] transition-colors px-3 py-2 rounded-md hover:bg-white/5"
                                >
                                    Documentation
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Tools dropdown menu - show on medium screens only */}
                    <div className="lg:hidden">
                        <NavigationMenu>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="bg-transparent text-[#9CA9B7] hover:text-[#FBF7FA] hover:bg-white/5 data-[state=open]:bg-white/5 data-[state=open]:text-[#FBF7FA]">
                                        Tools
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[300px] gap-3 p-4 bg-[#121922] border border-[#2A3442]">
                                            {dynamicSubdomains.map((subdomain) => (
                                                <ListItem
                                                    key={subdomain.name}
                                                    title={subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}
                                                    href={subdomain.url}
                                                >
                                                    {subdomain.description}
                                                </ListItem>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            href="/docs"
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                "bg-transparent text-[#9CA9B7] hover:text-[#FBF7FA] hover:bg-white/5"
                                            )}
                                        >
                                            Documentation
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-[#9CA9B7] hover:text-[#FBF7FA] hover:bg-white/5 focus:ring-2 focus:ring-[#93C5FD]"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </Button>
                </div>

                {/* Auth Buttons / User Menu - Desktop */}
                <div className="hidden md:flex items-center space-x-2">
                    {loading ? (
                        <div className="w-8 h-8 rounded-full bg-[#121922] animate-pulse"></div>
                    ) : isAuthenticated ? (
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
                                    onClick={handleSignOut}
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

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden border-t border-[#1C2430] bg-[#0B0C0D]/95 backdrop-blur">
                    <div className="container mx-auto px-4 py-4 space-y-4">
                        {/* Mobile Navigation Links */}
                        <div className="space-y-2">
                            {isOnHealss ? (
                                // Healss-specific mobile navigation
                                <>
                                    <div className="text-sm font-semibold text-[#9CA9B7] uppercase tracking-wide px-2">
                                        Healss Tools
                                    </div>
                                    <Link
                                        href="https://healss.kryloss.com/workout"
                                        className="block px-2 py-2 text-[#FBF7FA] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="font-medium">Workout</div>
                                        <div className="text-sm text-[#9CA9B7]">Track your fitness sessions</div>
                                    </Link>
                                    <Link
                                        href="https://healss.kryloss.com/nutrition"
                                        className="block px-2 py-2 text-[#FBF7FA] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="font-medium">Nutrition</div>
                                        <div className="text-sm text-[#9CA9B7]">Manage your nutrition plan</div>
                                    </Link>
                                    <Link
                                        href="https://healss.kryloss.com/progress"
                                        className="block px-2 py-2 text-[#FBF7FA] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="font-medium">Progress</div>
                                        <div className="text-sm text-[#9CA9B7]">Monitor your fitness journey</div>
                                    </Link>
                                </>
                            ) : (
                                // Main site mobile navigation
                                <>
                                    <div className="text-sm font-semibold text-[#9CA9B7] uppercase tracking-wide px-2">
                                        Tools
                                    </div>
                                    {dynamicSubdomains.map((subdomain) => (
                                        <Link
                                            key={subdomain.name}
                                            href={subdomain.url}
                                            className="block px-2 py-2 text-[#FBF7FA] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <div className="font-medium">{subdomain.name.charAt(0).toUpperCase() + subdomain.name.slice(1)}</div>
                                            <div className="text-sm text-[#9CA9B7]">{subdomain.description}</div>
                                        </Link>
                                    ))}

                                    <Link
                                        href="/docs"
                                        className="block px-2 py-2 text-[#FBF7FA] hover:text-white hover:bg-white/5 rounded-md transition-colors font-medium"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Documentation
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Auth Section */}
                        <div className="border-t border-[#1C2430] pt-4">
                            {loading ? (
                                <div className="flex items-center space-x-3 px-2">
                                    <div className="w-8 h-8 rounded-full bg-[#121922] animate-pulse"></div>
                                    <div className="text-[#9CA9B7]">Loading...</div>
                                </div>
                            ) : isAuthenticated ? (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-3 px-2 py-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
                                            <AvatarFallback className="bg-[#0F101A] text-[#FBF7FA] text-xs font-semibold border border-[#2A3442]">
                                                {profile?.username ? profile.username[0].toUpperCase() : 'K'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-medium text-[#FBF7FA]">
                                                {profile?.username || profile?.full_name || 'User'}
                                            </div>
                                            <div className="text-xs text-[#9CA9B7]">
                                                {user?.email}
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/dashboard"
                                        className="block px-2 py-2 text-[#FBF7FA] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>

                                    <Link
                                        href="/profile"
                                        className="block px-2 py-2 text-[#FBF7FA] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>

                                    <button
                                        onClick={() => {
                                            handleSignOut()
                                            setMobileMenuOpen(false)
                                        }}
                                        className="block w-full text-left px-2 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Link
                                        href="/login"
                                        className="block w-full text-center py-2 text-[#FBF7FA] hover:text-white border border-[#2A3442] hover:bg-white/5 rounded-full transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="block w-full text-center py-2 text-white bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] hover:from-[#257ADA] hover:to-[#90C9FF] rounded-full transition-all"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

function ListItem({
    title,
    children,
    href,
    ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#0F101A] hover:text-[#FBF7FA] focus:bg-[#0F101A] focus:text-[#FBF7FA] text-[#9CA9B7]"
                >
                    <div className="text-sm font-medium leading-none text-[#FBF7FA]">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-[#9CA9B7]">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
}
