'use client'

import { useAuthRedirect } from '@/lib/hooks/use-auth-redirect'
import ProfileForm from '@/components/profile-form'

export default function ProfilePage() {
    const { user, loading } = useAuthRedirect({ requireAuth: true })

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AA7FF]"></div>
                    <p className="text-[#FBF7FA] mt-4">Loading...</p>
                </div>
            </div>
        )
    }

    // Don't render if not authenticated (will redirect via hook)
    if (!user) {
        return null
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

                {/* Profile form with auth context */}
                <ProfileForm />
            </div>
        </div>
    )
}