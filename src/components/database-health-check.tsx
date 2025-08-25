'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HealthStatus {
    auth: 'checking' | 'success' | 'error'
    profile: 'checking' | 'success' | 'error' | 'missing'
    permissions: 'checking' | 'success' | 'error'
    details?: string
}

export default function DatabaseHealthCheck() {
    const [status, setStatus] = useState<HealthStatus>({
        auth: 'checking',
        profile: 'checking',
        permissions: 'checking'
    })

    useEffect(() => {
        async function checkHealth() {
            const supabase = createClient()

            try {
                // Check authentication
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    setStatus(prev => ({
                        ...prev,
                        auth: 'error',
                        details: authError?.message || 'No user found'
                    }))
                    return
                }

                setStatus(prev => ({ ...prev, auth: 'success' }))

                // Check profile exists
                const { error: profileError } = await supabase
                    .from('profiles')
                    .select('id, email, username, full_name')
                    .eq('id', user.id)
                    .single()

                if (profileError) {
                    if (profileError.code === 'PGRST116') {
                        setStatus(prev => ({
                            ...prev,
                            profile: 'missing',
                            details: 'Profile not found - will be auto-created'
                        }))
                    } else {
                        setStatus(prev => ({
                            ...prev,
                            profile: 'error',
                            details: `${profileError.code}: ${profileError.message}`
                        }))
                    }
                } else {
                    setStatus(prev => ({ ...prev, profile: 'success' }))
                }

                // Check update permissions
                try {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('id', user.id)

                    if (updateError) {
                        setStatus(prev => ({
                            ...prev,
                            permissions: 'error',
                            details: `Update permission error: ${updateError.code}: ${updateError.message}`
                        }))
                    } else {
                        setStatus(prev => ({ ...prev, permissions: 'success' }))
                    }
                } catch (permError) {
                    setStatus(prev => ({
                        ...prev,
                        permissions: 'error',
                        details: `Permission check failed: ${permError}`
                    }))
                }

            } catch (error) {
                setStatus(prev => ({
                    ...prev,
                    auth: 'error',
                    details: `Health check failed: ${error}`
                }))
            }
        }

        if (process.env.NODE_ENV === 'development') {
            checkHealth()
        }
    }, [])

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-400'
            case 'error': return 'text-red-400'
            case 'missing': return 'text-yellow-400'
            case 'checking': return 'text-[#9CA9B7]'
            default: return 'text-[#9CA9B7]'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'missing': return '⚠️'
            case 'checking': return '🔄'
            default: return '❓'
        }
    }

    return (
        <Card className="bg-[rgba(37,122,218,0.10)] border-[rgba(37,122,218,0.35)] rounded-2xl mb-6">
            <CardHeader>
                <CardTitle className="text-[#4AA7FF] text-sm font-semibold">
                    🔧 Database Health Check (Development)
                </CardTitle>
                <CardDescription className="text-[#9CA9B7] text-xs">
                    Diagnostic information for debugging database issues
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#FBF7FA]">Authentication:</span>
                    <span className={`text-xs ${getStatusColor(status.auth)}`}>
                        {getStatusIcon(status.auth)} {status.auth}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#FBF7FA]">Profile:</span>
                    <span className={`text-xs ${getStatusColor(status.profile)}`}>
                        {getStatusIcon(status.profile)} {status.profile}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#FBF7FA]">Permissions:</span>
                    <span className={`text-xs ${getStatusColor(status.permissions)}`}>
                        {getStatusIcon(status.permissions)} {status.permissions}
                    </span>
                </div>

                {status.details && (
                    <div className="mt-2 p-2 bg-[rgba(0,0,0,0.20)] rounded text-xs text-[#9CA9B7] font-mono">
                        {status.details}
                    </div>
                )}

                <div className="mt-3 text-xs text-[#556274]">
                    💡 Run DATABASE_SETUP_COMPLETE.sql if you see permission errors
                </div>
            </CardContent>
        </Card>
    )
}
