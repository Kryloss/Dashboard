import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Healthify Card */}
                    <Card className="group bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] hover:bg-[#0F101A] hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />

                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold group-hover:text-white transition-colors">
                                Healthify
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
                                <Link href="https://healthify.kryloss.com">Launch Healthify →</Link>
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
                                <p className="text-[#FBF7FA] font-medium">{user.email}</p>
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
                                    {new Date(user.created_at).toLocaleDateString('en-US', {
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
                    <form action={signOut}>
                        <Button
                            type="submit"
                            variant="outline"
                            className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] transition-all px-6"
                        >
                            Sign Out
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
