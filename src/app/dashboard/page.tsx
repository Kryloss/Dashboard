'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { triggerWelcomeEmail } from '@/lib/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useAuthContext } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database.types'

export default function DashboardPage() {
    const { user, loading, signOut } = useAuthContext()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    
    const timestamp = new Date().toISOString()
    
    // Fetch profile data when user is available
    useEffect(() => {
        if (!user?.id) {
            setProfile(null)
            setProfileLoading(false)
            return
        }

        async function fetchProfile() {
            try {
                console.log(`Dashboard: Fetching profile for ${user!.email}`)
                const supabase = createClient()
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user!.id)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    console.error('Dashboard: Profile fetch error:', error)
                } else {
                    setProfile(profileData || null)
                    console.log(`Dashboard: Profile loaded for ${user!.email}`)
                }
            } catch (err) {
                console.error('Dashboard: Profile fetch failed:', err)
            } finally {
                setProfileLoading(false)
            }
        }

        fetchProfile()
    }, [user])

    const handleSignOut = async () => {
        try {
            console.log('Dashboard: Initiating sign out...')
            await signOut()
        } catch (error) {
            console.error('Dashboard: Sign out error:', error)
        }
    }

    // Simple loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] pt-6">
                <div className="container mx-auto max-w-7xl px-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                        <p className="text-[#9CA9B7] ml-4">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        )
    }

    // If not authenticated after loading, let AuthContext/middleware handle redirect
    // Don't interfere with the natural auth flow

    // Show loading state while profile is being fetched
    if (profileLoading) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] pt-6">
                <div className="container mx-auto max-w-7xl px-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                        <p className="text-[#9CA9B7] ml-4">Loading profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0C0D] pt-6">
            <div className="container mx-auto max-w-7xl px-6">
                {/* Username Prompt for Google OAuth users */}
                {profile && !profile.username && (
                    <div className="mb-6">
                        <Card className="bg-[rgba(37,122,218,0.10)] border-[rgba(37,122,218,0.35)] rounded-2xl">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[#4AA7FF] font-semibold mb-1">
                                            Complete Your Profile
                                        </h3>
                                        <p className="text-[#9CA9B7] text-sm">
                                            Please set a username to complete your account setup and enable username login.
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all"
                                    >
                                        <Link href="/profile">Set Username</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Debug Info (temporary) */}
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h3 className="text-yellow-400 font-semibold mb-2">Debug Info (Page Rendered: {timestamp})</h3>
                    <div className="text-sm text-yellow-200 space-y-1">
                        <div>User ID: {user!.id}</div>
                        <div>Email: {user!.email}</div>
                        <div>Profile Email: {profile?.email || 'Not found'}</div>
                        <div>Profile Username: {profile?.username || 'Not set'}</div>
                        <div>Profile Full Name: {profile?.full_name || 'Not set'}</div>
                    </div>
                </div>

                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-4 tracking-tight">
                        Welcome back{profile?.username || profile?.full_name ? `, ${profile.username || profile.full_name}` : ''}!
                    </h1>
                    <p className="text-xl text-[#9CA9B7]">
                        Access your productivity tools and manage your account from your dashboard.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Healss Card */}
                    <Card className="group bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] hover:bg-[#0F101A] hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />

                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold group-hover:text-white transition-colors">
                                Healss
                            </CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                Advanced health analytics with AI-powered insights and comprehensive tracking.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Button
                                asChild
                                className="w-full rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all"
                            >
                                <Link href="https://healss.kryloss.com">Launch Healss →</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Notify Card */}
                    <Card className="group bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] hover:bg-[#0F101A] hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />

                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold group-hover:text-white transition-colors">
                                Notify
                            </CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                Smart notification management with intelligent priority filtering.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Button
                                asChild
                                className="w-full rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all"
                            >
                                <Link href="https://notify.kryloss.com">Launch Notify →</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Profile Management Card */}
                    <Card className="group bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] hover:bg-[#0F101A] hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />

                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold group-hover:text-white transition-colors">
                                Profile Settings
                            </CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                Manage your account information, preferences, and security settings.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Button
                                variant="outline"
                                asChild
                                className="w-full rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] transition-all"
                            >
                                <Link href="/profile">Manage Profile →</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Welcome Email Test Card */}
                    <Card className="group bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] hover:bg-[#0F101A] hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />

                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold group-hover:text-white transition-colors">
                                Test Welcome Email
                            </CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                Send yourself a welcome email to test the email functionality.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form action={triggerWelcomeEmail}>
                                <Button
                                    type="submit"
                                    className="w-full rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all"
                                >
                                    Send Welcome Email →
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Account Info */}
                <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                    <div
                        className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                        style={{
                            background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                        }}
                    />

                    <CardHeader>
                        <CardTitle className="text-[#FBF7FA] text-xl font-bold">
                            Account Information
                        </CardTitle>
                        <CardDescription className="text-[#9CA9B7]">
                            Your current account details and status
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-[#556274] mb-1">Email</p>
                                <p className="text-[#FBF7FA] font-medium">{user!.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#556274] mb-1">Username</p>
                                <p className="text-[#FBF7FA] font-medium">{profile?.username || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#556274] mb-1">Account Status</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] text-[#4AA7FF] text-sm font-medium">
                                    <div className="w-2 h-2 bg-[#4AA7FF] rounded-full"></div>
                                    Active
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-[#556274] mb-1">Member Since</p>
                                <p className="text-[#FBF7FA] font-medium">
                                    {new Date(user!.created_at).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] transition-all px-6"
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    )
}
