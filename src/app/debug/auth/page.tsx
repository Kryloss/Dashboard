'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createMissingProfile } from '@/lib/actions/fix-profile'

export default function AuthDebugPage() {
    const [authState, setAuthState] = useState<{
        session: {
            exists: boolean;
            user: User | null;
            error: Error | null;
        };
        user: {
            exists: boolean;
            data: User | null;
            error: Error | null;
        };
        profile: {
            exists: boolean;
            data: Record<string, unknown> | null;
            error: Error | null;
        };
        timestamp: string;
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const checkAuthState = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // Get session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            // Get user
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            // Try to get profile if user exists
            let profile = null
            let profileError = null
            if (user) {
                const { data: profileData, error: profErr } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                profile = profileData
                profileError = profErr
            }

            setAuthState({
                session: {
                    exists: !!session,
                    user: session?.user || null,
                    error: sessionError
                },
                user: {
                    exists: !!user,
                    data: user,
                    error: userError
                },
                profile: {
                    exists: !!profile,
                    data: profile,
                    error: profileError
                },
                timestamp: new Date().toISOString()
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        checkAuthState()
    }, [checkAuthState])

    const handleRefresh = () => {
        checkAuthState()
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        await checkAuthState()
    }

    const handleCreateProfile = async () => {
        try {
            const result = await createMissingProfile()
            if (result.error) {
                setError(result.error)
            } else {
                // Refresh auth state to show new profile
                await checkAuthState()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create profile')
        }
    }

    if (loading && !authState) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] p-6 flex items-center justify-center">
                <div className="text-[#FBF7FA]">Loading auth state...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0B0C0D] p-6">
            <div className="container mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-[#FBF7FA]">Authentication Debug</h1>
                    <div className="space-x-2">
                        <Button onClick={handleRefresh} variant="outline">
                            Refresh
                        </Button>
                        <Button onClick={handleSignOut} variant="destructive">
                            Sign Out
                        </Button>
                    </div>
                </div>

                {error && (
                    <Card className="bg-red-500/10 border-red-500/30">
                        <CardContent className="p-4">
                            <div className="text-red-400">Error: {error}</div>
                        </CardContent>
                    </Card>
                )}

                {authState && (
                    <div className="grid gap-6">
                        {/* Session Info */}
                        <Card className="bg-[#121922] border-[#2A3442]">
                            <CardHeader>
                                <CardTitle className="text-[#FBF7FA]">
                                    Session Status: {authState.session.exists ? '✅ Active' : '❌ No Session'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-sm text-[#9CA9B7] bg-[#0F101A] p-4 rounded overflow-auto">
                                    {JSON.stringify(authState.session, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>

                        {/* User Info */}
                        <Card className="bg-[#121922] border-[#2A3442]">
                            <CardHeader>
                                <CardTitle className="text-[#FBF7FA]">
                                    User Status: {authState.user.exists ? '✅ Found' : '❌ No User'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-sm text-[#9CA9B7] bg-[#0F101A] p-4 rounded overflow-auto">
                                    {JSON.stringify(authState.user, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>

                        {/* Profile Info */}
                        <Card className="bg-[#121922] border-[#2A3442]">
                            <CardHeader>
                                <CardTitle className="text-[#FBF7FA]">
                                    Profile Status: {authState.profile.exists ? '✅ Found' : '❌ No Profile'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-sm text-[#9CA9B7] bg-[#0F101A] p-4 rounded overflow-auto">
                                    {JSON.stringify(authState.profile, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>

                        {/* Diagnosis */}
                        <Card className="bg-[#121922] border-[#2A3442]">
                            <CardHeader>
                                <CardTitle className="text-[#FBF7FA]">Diagnosis</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-[#9CA9B7]">
                                    <div>✅ Session exists: {authState.session.exists ? 'Yes' : 'No'}</div>
                                    <div>✅ User exists: {authState.user.exists ? 'Yes' : 'No'}</div>
                                    <div>✅ Profile exists: {authState.profile.exists ? 'Yes' : 'No'}</div>
                                    <div>✅ Email verified: {authState.user.data?.email_confirmed_at ? 'Yes' : 'No'}</div>
                                    <div>✅ Provider: {authState.user.data?.app_metadata?.provider || 'None'}</div>
                                </div>

                                {authState.session.exists && authState.user.exists && !authState.profile.exists && (
                                    <div className="text-yellow-400 mt-4">
                                        ⚠️ Issue: User has valid session but no profile in database. This will cause redirects to login page.
                                        <Button
                                            onClick={handleCreateProfile}
                                            className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                                            size="sm"
                                        >
                                            Create Missing Profile
                                        </Button>
                                    </div>
                                )}

                                {!authState.session.exists && authState.user.exists && (
                                    <div className="text-yellow-400 mt-4">
                                        ⚠️ Issue: User token exists but session is invalid. This can cause inconsistent auth state.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="text-center">
                    <div className="text-sm text-[#556274]">
                        Last updated: {authState?.timestamp}
                    </div>
                </div>
            </div>
        </div>
    )
}