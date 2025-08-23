"use client"

import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useEffect, useTransition } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database.types'

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const supabase = createClient()

    useEffect(() => {
        async function loadUserData() {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (userError) throw userError
                if (!user) throw new Error('Not authenticated')

                setUser(user)

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profileError) throw profileError

                setProfile(profile)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        loadUserData()
    }, [supabase])

    const handleSubmit = async (formData: FormData) => {
        setError(null)
        setMessage(null)

        startTransition(async () => {
            const result = await updateProfile(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.message) {
                setMessage(result.message)
                // Refresh profile data
                if (user) {
                    const { data: updatedProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (updatedProfile) {
                        setProfile(updatedProfile)
                    }
                }
            }
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center">
                <div className="text-[#9CA9B7]">Loading...</div>
            </div>
        )
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center">
                <div className="text-red-400">Error: {error}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0C0D] pt-6">
            <div className="container mx-auto max-w-4xl px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-4 tracking-tight">
                        Profile Settings
                    </h1>
                    <p className="text-xl text-[#9CA9B7]">
                        Manage your account information and preferences.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Picture Card */}
                    <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />

                        <CardHeader className="text-center">
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold">
                                Profile Picture
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex flex-col items-center space-y-4">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                                <AvatarFallback className="bg-[#0F101A] text-[#FBF7FA] text-xl font-semibold border border-[#2A3442]">
                                    {profile?.full_name?.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>

                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] transition-all"
                                disabled
                            >
                                Upload Picture (Coming Soon)
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Profile Information Card */}
                    <div className="lg:col-span-2">
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
                                    Update your personal information and account details.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Success message */}
                                {message && (
                                    <div className="p-3 rounded-lg bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] text-[#4AA7FF] text-sm">
                                        {message}
                                    </div>
                                )}

                                {/* Error message */}
                                {error && (
                                    <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <form action={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-[#FBF7FA]">
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={user?.email || ''}
                                                className="bg-[#0F101A] border-[#2A3442] text-[#9CA9B7] placeholder-[#90A0A8] rounded-xl opacity-60 cursor-not-allowed"
                                                disabled
                                                readOnly
                                            />
                                            <p className="text-xs text-[#556274]">Email cannot be changed</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="full_name" className="text-[#FBF7FA]">
                                                Full Name
                                            </Label>
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                type="text"
                                                defaultValue={profile?.full_name || ''}
                                                placeholder="Enter your full name"
                                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                                disabled={isPending}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#FBF7FA]">
                                                Account Created
                                            </Label>
                                            <Input
                                                type="text"
                                                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                }) : 'Unknown'}
                                                className="bg-[#0F101A] border-[#2A3442] text-[#9CA9B7] placeholder-[#90A0A8] rounded-xl opacity-60 cursor-not-allowed"
                                                disabled
                                                readOnly
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#FBF7FA]">
                                                Last Updated
                                            </Label>
                                            <Input
                                                type="text"
                                                value={profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                }) : 'Never'}
                                                className="bg-[#0F101A] border-[#2A3442] text-[#9CA9B7] placeholder-[#90A0A8] rounded-xl opacity-60 cursor-not-allowed"
                                                disabled
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isPending}
                                            className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none px-8"
                                        >
                                            {isPending ? "Updating..." : "Update Profile"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
