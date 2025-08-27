'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateProfile, uploadProfileImage, removeProfileImage } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import DatabaseHealthCheck from '@/components/database-health-check'
import { resizeImageTo256x256, getFileExtension } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface ProfileData {
    id: string
    email: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
}

interface ProfileFormProps {
    initialProfile: ProfileData | null
    user: User
    initialMessage?: string
}

export default function ProfileForm({ initialProfile, user, initialMessage }: ProfileFormProps) {
    const [profile, setProfile] = useState<ProfileData | null>(initialProfile)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(initialMessage || null)
    const [isPending, startTransition] = useTransition()
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setError(null)
        setMessage(null)

        startTransition(async () => {
            const result = await updateProfile(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.message) {
                setMessage(result.message)

                // Optimistic UI update
                const username = formData.get('username') as string
                const fullName = formData.get('full_name') as string

                if (profile) {
                    setProfile({
                        ...profile,
                        username: username || profile.username,
                        full_name: fullName || profile.full_name,
                    })
                }

                // Refresh profile data from server
                const supabase = createClient()
                const { data: updatedProfile } = await supabase
                    .from('profiles')
                    .select('id, email, username, full_name, avatar_url')
                    .eq('id', user.id)
                    .single()

                if (updatedProfile) {
                    setProfile({
                        id: updatedProfile.id,
                        email: updatedProfile.email,
                        username: updatedProfile.username,
                        full_name: updatedProfile.full_name,
                        avatar_url: updatedProfile.avatar_url,
                    })
                }
            }
        })
    }

    const handleImageUpload = async (formData: FormData) => {
        setError(null)
        setMessage(null)

        try {
            const result = await uploadProfileImage(formData)
            if (result?.error) {
                setError(result.error)
            } else if (result?.message) {
                setMessage(result.message)

                // Update profile state with new avatar URL
                if (profile && result.avatar_url) {
                    setProfile({
                        ...profile,
                        avatar_url: result.avatar_url,
                    })
                }
            }
        } catch (error) {
            setError('Failed to upload image')
        }
    }

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            try {
                setIsUploading(true)
                setError(null)
                setMessage(null)

                // Debug: Log file details
                console.log('Original file:', {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified
                })

                // Resize image to 256x256 before upload
                const resizedBlob = await resizeImageTo256x256(file)

                // Debug: Log resized blob details
                console.log('Resized blob:', {
                    type: resizedBlob.type,
                    size: resizedBlob.size
                })

                // Create a new file with the resized blob, preserving original type for GIFs
                const resizedFile = new File(
                    [resizedBlob],
                    `avatar.${getFileExtension(file.type)}`,
                    { type: file.type } // Preserve original MIME type
                )

                // Debug: Log final file details
                console.log('Final file:', {
                    name: resizedFile.name,
                    type: resizedFile.type,
                    size: resizedFile.size
                })

                const formData = new FormData()
                formData.append('image', resizedFile)

                await handleImageUpload(formData)
            } catch (error) {
                console.error('Image processing error:', error)
                setError('Failed to process image. Please try again.')
            } finally {
                setIsUploading(false)
            }
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    // Environment check for development
    const showEnvWarning = process.env.NODE_ENV === 'development' &&
        (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    return (
        <>
            {/* Database Health Check for Development */}
            <DatabaseHealthCheck />

            {/* Environment Warning Banner */}
            {showEnvWarning && (
                <div className="mb-6">
                    <Card className="bg-[rgba(220,38,38,0.10)] border-[rgba(220,38,38,0.35)] rounded-2xl">
                        <CardContent className="p-4">
                            <p className="text-red-400 text-sm">
                                <strong>Development Warning:</strong> Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                            <AvatarImage
                                src={profile?.avatar_url || undefined}
                                alt={profile?.username || profile?.full_name || 'User'}
                                onLoad={(e) => {
                                    // Debug: Log when image loads
                                    const img = e.target as HTMLImageElement
                                    console.log('Avatar image loaded:', {
                                        src: img.src,
                                        naturalWidth: img.naturalWidth,
                                        naturalHeight: img.naturalHeight,
                                        complete: img.complete
                                    })
                                }}
                                onError={(e) => {
                                    // Debug: Log any image loading errors
                                    console.error('Avatar image failed to load:', e)
                                }}
                            />
                            <AvatarFallback className="bg-[#0F101A] text-[#FBF7FA] text-xl font-semibold border border-[#2A3442]">
                                {profile?.username?.slice(0, 2).toUpperCase() ||
                                    profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ||
                                    profile?.email?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={triggerFileInput}
                            disabled={isUploading}
                            className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] transition-all"
                        >
                            {isUploading ? 'Processing...' : 'Upload Picture'}
                        </Button>

                        {profile?.avatar_url && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const result = await removeProfileImage()
                                        if (result?.error) {
                                            setError(result.error)
                                        } else if (result?.message) {
                                            setMessage(result.message)
                                            // Update profile state
                                            if (profile) {
                                                setProfile({ ...profile, avatar_url: null })
                                            }
                                        }
                                    } catch (error) {
                                        setError('Failed to remove image')
                                    }
                                }}
                                className="rounded-full border-[#2A3442] bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#121922] transition-all"
                            >
                                Remove Picture
                            </Button>
                        )}

                        <p className="text-xs text-[#556274] text-center">
                            Images automatically resized to 256x256 • Max 1MB
                        </p>
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
                                            value={user.email || ''}
                                            className="bg-[#0F101A] border-[#2A3442] text-[#9CA9B7] placeholder-[#90A0A8] rounded-xl opacity-60 cursor-not-allowed"
                                            disabled
                                            readOnly
                                        />
                                        <p className="text-xs text-[#556274]">Email cannot be changed</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-[#FBF7FA]">
                                            Username
                                        </Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            defaultValue={profile?.username || ''}
                                            placeholder="Choose a unique username"
                                            className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                            disabled={isPending}
                                            minLength={3}
                                            maxLength={20}
                                            pattern="^[a-zA-Z0-9_-]+$"
                                            title="Username can only contain letters, numbers, underscores, and hyphens"
                                        />
                                        {!profile?.username && (
                                            <p className="text-xs text-[#4AA7FF]">
                                                Please set your username to complete your profile
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div className="space-y-2">
                                        <Label className="text-[#FBF7FA]">
                                            Account Created
                                        </Label>
                                        <Input
                                            type="text"
                                            value={user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : 'Unknown'}
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
        </>
    )
}
