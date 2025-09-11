import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile-form'
import ProgressPhotosTab from '@/components/progress-photos-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()

    // Server-side authentication check with multiple methods
    let user = null
    let authMethod = 'none'

    try {
        // Method 1: Check session first
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            user = session.user
            authMethod = 'session'
        }
    } catch (sessionError) {
        console.error('Profile session check failed:', sessionError)
    }

    // Method 2: Fallback to getUser if session failed
    if (!user) {
        try {
            const { data: { user: tokenUser } } = await supabase.auth.getUser()
            if (tokenUser) {
                user = tokenUser
                authMethod = 'token'
            }
        } catch (userError) {
            console.error('Profile user check failed:', userError)
        }
    }

    console.log(`Profile auth check: ${authMethod}`, user?.email || 'No user')

    if (!user) {
        console.log('Profile: No user found, redirecting to login')
        redirect('/login')
    }

    // Fetch profile data server-side
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, username, full_name, avatar_url') // Added avatar_url
        .eq('id', user.id)
        .single()

    // Profile creation is now handled automatically by database trigger
    // If profile doesn't exist, it will be created automatically
    if (error) {
        console.error('Profile fetch error:', error.message, error.code, error.details)
        console.log('Profile not found, will be created automatically by database trigger')
    }

    const finalProfile = profile

    return (
        <div className="min-h-screen bg-[#0B0C0D] pt-6">
            <div className="container mx-auto max-w-6xl px-6">
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
                            initialProfile={finalProfile}
                            user={user}
                            initialMessage={((await searchParams)?.message as string) || undefined}
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