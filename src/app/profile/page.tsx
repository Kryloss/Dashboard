'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileForm from '@/components/profile-form'
import { useAuthContext } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database.types'

function ProfilePageContent() {
    const { user, loading } = useAuthContext()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const searchParams = useSearchParams()
    const message = searchParams.get('message')
    
    // Fetch profile data when user is available
    useEffect(() => {
        if (!user?.id) {
            setProfile(null)
            setProfileLoading(false)
            return
        }

        async function fetchProfile() {
            try {
                const timestamp = new Date().toISOString()
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
    
    // Simple loading state
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

    // If not authenticated after loading, let AuthContext/middleware handle redirect
    // Don't interfere with the natural auth flow

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
                    <h3 className="text-yellow-400 font-semibold mb-2">Profile Debug Info</h3>
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

                {/* Profile Form */}
                <div className="mt-6">
                    <ProfileForm
                        initialProfile={profile}
                        user={user!}
                        initialMessage={message || undefined}
                    />
                </div>
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