import ProfileForm from '@/components/profile-form'
import ProgressPhotosTab from '@/components/progress-photos-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getServerAuthWithProfile } from '@/lib/auth/server'

// Keep dynamic for now but allow some caching for performance
export const dynamic = 'force-dynamic'

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] Profile: Starting auth check`)
    
    // Single, reliable auth check with profile
    const { user, profile } = await getServerAuthWithProfile()
    
    console.log(`[${timestamp}] Profile: Auth completed for ${user.email}`)
    
    const finalProfile = profile

    return (
        <div className="min-h-screen bg-[#0B0C0D] pt-6">
            <div className="container mx-auto max-w-6xl px-6">
                {/* Debug Info (temporary) */}
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h3 className="text-yellow-400 font-semibold mb-2">Profile Debug Info (Page Rendered: {timestamp})</h3>
                    <div className="text-sm text-yellow-200 space-y-1">
                        <div>User ID: {user.id}</div>
                        <div>Email: {user.email}</div>
                        <div>Profile Email: {finalProfile?.email || 'Not found'}</div>
                        <div>Profile Username: {finalProfile?.username || 'Not set'}</div>
                        <div>Profile Full Name: {finalProfile?.full_name || 'Not set'}</div>
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