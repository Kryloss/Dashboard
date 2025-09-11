'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileForm from '@/components/profile-form'
import ProgressPhotosTab from '@/components/progress-photos-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthContext } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database.types'

function ProfilePageContent() {
    const { user, loading, isAuthenticated, initialized } = useAuthContext()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null)
    const searchParams = useSearchParams()
    const message = searchParams.get('message')
    
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
                console.log(`[${timestamp}] Profile: Fetching profile for ${user!.email}`)
                const supabase = createClient()
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user!.id)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    console.error('Profile: Profile fetch error:', error)
                } else {
                    setProfile(profileData || null)
                    console.log(`[${timestamp}] Profile: Profile loaded for ${user!.email}`)
                }
            } catch (err) {
                console.error('Profile: Profile fetch failed:', err)
            } finally {
                setProfileLoading(false)
            }
        }

        fetchProfile()
    }, [user])
    
    // Handle redirect to login with delay for auth sync
    useEffect(() => {
        if (!loading && initialized && !isAuthenticated) {
            // Give a brief moment for session sync, then redirect
            const timeout = setTimeout(() => {
                window.location.href = '/login?message=Please sign in to access your profile'
            }, 1000) // 1 second delay
            
            setRedirectTimeout(timeout)
            return () => clearTimeout(timeout)
        } else if (redirectTimeout && isAuthenticated) {
            // Clear redirect if user becomes authenticated
            clearTimeout(redirectTimeout)
            setRedirectTimeout(null)
        }
    }, [loading, initialized, isAuthenticated, redirectTimeout])

    // Show loading state while auth is initializing
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] pt-6">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                        <p className="text-[#9CA9B7] ml-4">Loading profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Don't redirect immediately - let auth sync complete
    if (!loading && initialized && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] pt-6">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                        <p className="text-[#9CA9B7] ml-4">Verifying authentication...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show loading state while profile is being fetched
    if (profileLoading) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] pt-6">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                        <p className="text-[#9CA9B7] ml-4">Loading profile data...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0C0D] pt-6">
            <div className="container mx-auto max-w-6xl px-6">
                {/* Debug Info (temporary) */}
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h3 className="text-yellow-400 font-semibold mb-2">Profile Debug Info (Page Rendered: {timestamp})</h3>
                    <div className="text-sm text-yellow-200 space-y-1">
                        <div>User ID: {user!.id}</div>
                        <div>Email: {user!.email}</div>
                        <div>Profile Email: {profile?.email || 'Not found'}</div>
                        <div>Profile Username: {profile?.username || 'Not set'}</div>
                        <div>Profile Full Name: {profile?.full_name || 'Not set'}</div>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-4 tracking-tight">
                        Profile Settings
                    </h1>
                    <p className="text-xl text-[#9CA9B7]">
                        Manage your account information and preferences.
                    </p>
                </div>

                {/* Tabbed interface */}
                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#121922] border-[#2A3442] rounded-xl">
                        <TabsTrigger 
                            value="account" 
                            className="data-[state=active]:bg-[#4AA7FF] data-[state=active]:text-white text-[#9CA9B7] hover:text-[#FBF7FA] rounded-lg transition-all"
                        >
                            Account Settings
                        </TabsTrigger>
                        <TabsTrigger 
                            value="progress" 
                            className="data-[state=active]:bg-[#4AA7FF] data-[state=active]:text-white text-[#9CA9B7] hover:text-[#FBF7FA] rounded-lg transition-all"
                        >
                            Progress Photos
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="account" className="mt-6">
                        <ProfileForm
                            initialProfile={profile}
                            user={user!}
                            initialMessage={message || undefined}
                        />
                    </TabsContent>
                    
                    <TabsContent value="progress" className="mt-6">
                        <ProgressPhotosTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0B0C0D] pt-6">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                        <p className="text-[#9CA9B7] ml-4">Loading...</p>
                    </div>
                </div>
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    )
}