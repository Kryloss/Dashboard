import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile-form'

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>
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

    let finalProfile = profile

    if (error) {
        console.error('Profile fetch error:', error.message, error.code, error.details)

        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') { // No rows returned
            console.log('Profile not found, creating new profile for user:', user.id)

            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                        email: user.email!,
                        username: null,
                        full_name: user.user_metadata?.full_name || null,
                    }
                ])
                .select('id, email, username, full_name')
                .single()

            if (createError) {
                console.error('Profile creation error:', createError.message, createError.code, createError.details)
            } else {
                finalProfile = newProfile
                console.log('Profile created successfully:', newProfile)
            }
        }
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

                {/* Pass initial data to client component */}
                <ProfileForm
                    initialProfile={finalProfile}
                    user={user}
                    initialMessage={(await searchParams).message}
                />
            </div>
        </div>
    )
}