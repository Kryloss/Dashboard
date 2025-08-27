import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()

    // Server-side authentication check
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile data server-side
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, username, full_name') // No updated_at
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

                {/* Pass initial data to client component */}
                <ProfileForm
                    initialProfile={finalProfile}
                    user={user}
                    initialMessage={((await searchParams)?.message as string) || undefined}
                />
            </div>
        </div>
    )
}