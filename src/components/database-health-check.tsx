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

interface SimpleHealthStatus {
    connection: 'checking' | 'success' | 'error'
    environment: 'checking' | 'success' | 'error'
    details?: string
}

// Simple health check for auth pages (no authentication required)
export function AuthHealthCheck() {
    const [status, setStatus] = useState<SimpleHealthStatus>({
        connection: 'checking',
        environment: 'checking'
    })
    const [origin, setOrigin] = useState<string>('')

    useEffect(() => {
        // Compute origin on client only to avoid SSR/CSR mismatch
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin)
        }

        async function checkBasicHealth() {
            try {
                // Check environment variables
                const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
                const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL

                if (!hasUrl || !hasKey) {
                    setStatus(prev => ({
                        ...prev,
                        environment: 'error',
                        details: `Missing: ${!hasUrl ? 'SUPABASE_URL ' : ''}${!hasKey ? 'SUPABASE_ANON_KEY ' : ''}${!hasSiteUrl ? 'SITE_URL' : ''}`
                    }))
                } else {
                    setStatus(prev => ({ ...prev, environment: 'success' }))
                }

                // Test basic Supabase connection
                const supabase = createClient()

                try {
                    // Simple connection test (this should work without auth)
                    const { error } = await supabase.from('profiles').select('count').limit(0)

                    if (error) {
                        setStatus(prev => ({
                            ...prev,
                            connection: 'error',
                            details: `Connection error: ${error.code}: ${error.message}`
                        }))
                    } else {
                        setStatus(prev => ({ ...prev, connection: 'success' }))
                    }
                } catch (connError) {
                    setStatus(prev => ({
                        ...prev,
                        connection: 'error',
                        details: `Connection failed: ${connError}`
                    }))
                }

            } catch (error) {
                setStatus(prev => ({
                    ...prev,
                    environment: 'error',
                    details: `Health check failed: ${error}`
                }))
            }
        }

        // Always check on auth pages for debugging
        checkBasicHealth()
    }, [])

    // Show on auth pages in all environments for debugging
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-400'
            case 'error': return 'text-red-400'
            case 'checking': return 'text-[#9CA9B7]'
            default: return 'text-[#9CA9B7]'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'checking': return '🔄'
            default: return '❓'
        }
    }

    return (
        <Card className="bg-[rgba(37,122,218,0.10)] border-[rgba(37,122,218,0.35)] rounded-2xl">
            <CardHeader>
                <CardTitle className="text-[#4AA7FF] text-sm font-semibold">
                    🔧 Auth Health Check
                </CardTitle>
                <CardDescription className="text-[#9CA9B7] text-xs">
                    Vercel vs localhost debugging information
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#FBF7FA]">Environment:</span>
                    <span className={`text-xs ${getStatusColor(status.environment)}`}>
                        {getStatusIcon(status.environment)} {status.environment}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#FBF7FA]">Database Connection:</span>
                    <span className={`text-xs ${getStatusColor(status.connection)}`}>
                        {getStatusIcon(status.connection)} {status.connection}
                    </span>
                </div>

                <div className="mt-2 text-xs text-[#556274]">
                    🌍 Current URL: <span suppressHydrationWarning>{origin || '(detecting...)'}</span>
                </div>

                <div className="text-xs text-[#556274]">
                    🔗 Site URL: {process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}
                </div>

                {status.details && (
                    <div className="mt-2 p-2 bg-[rgba(0,0,0,0.20)] rounded text-xs text-[#9CA9B7] font-mono">
                        {status.details}
                    </div>
                )}

                <div className="mt-3 text-xs text-[#556274]">
                    💡 Check Vercel env vars if connection fails in production
                </div>
            </CardContent>
        </Card>
    )
}

export default function DatabaseHealthCheck() {
    const [status, setStatus] = useState<HealthStatus>({
        auth: 'checking',
        profile: 'checking',
        permissions: 'checking'
    })
    const [envStatus, setEnvStatus] = useState<{
        hasUrl: boolean
        hasKey: boolean
        urlPreview: string
        keyPreview: string
    }>({
        hasUrl: false,
        hasKey: false,
        urlPreview: '',
        keyPreview: ''
    })

    useEffect(() => {
        // Check environment variables first
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const urlPreview = process.env.NEXT_PUBLIC_SUPABASE_URL ?
            `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'Not set'
        const keyPreview = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
            `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'Not set'

        setEnvStatus({ hasUrl, hasKey, urlPreview, keyPreview })

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
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, email, username, full_name')
                    .eq('id', user.id)
                    .single()

                if (profileError) {
                    if (profileError.code === 'PGRST116') {
                        setStatus(prev => ({
                            ...prev,
                            profile: 'missing',
                            details: `Profile not found for user ${user.id} - will be auto-created. Error: ${profileError.message}`
                        }))
                    } else {
                        setStatus(prev => ({
                            ...prev,
                            profile: 'error',
                            details: `${profileError.code}: ${profileError.message}`
                        }))
                    }
                } else {
                    setStatus(prev => ({
                        ...prev,
                        profile: 'success',
                        details: `Profile found: ${profileData.username || 'No username'} | ${profileData.full_name || 'No full name'}`
                    }))
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
                {/* Environment Variables Status */}
                <div className="mb-4 p-3 bg-[rgba(0,0,0,0.20)] rounded">
                    <h4 className="text-xs text-[#4AA7FF] font-semibold mb-2">Environment Variables</h4>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#FBF7FA]">SUPABASE_URL:</span>
                            <span className={`text-xs ${envStatus.hasUrl ? 'text-green-400' : 'text-red-400'}`}>
                                {envStatus.hasUrl ? '✅ Set' : '❌ Missing'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#FBF7FA]">SUPABASE_ANON_KEY:</span>
                            <span className={`text-xs ${envStatus.hasKey ? 'text-green-400' : 'text-red-400'}`}>
                                {envStatus.hasKey ? '✅ Set' : '❌ Missing'}
                            </span>
                        </div>
                        {envStatus.hasUrl && (
                            <div className="text-xs text-[#556274] font-mono">
                                URL: {envStatus.urlPreview}
                            </div>
                        )}
                        {envStatus.hasKey && (
                            <div className="text-xs text-[#556274] font-mono">
                                Key: {envStatus.keyPreview}
                            </div>
                        )}
                    </div>
                </div>

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
