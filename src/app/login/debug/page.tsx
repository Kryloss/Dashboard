'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DebugInfo {
    env: {
        hasUrl: boolean
        hasKey: boolean
        urlPreview: string
        keyPreview: string
        siteUrl: string
    }
    connection: {
        status: 'checking' | 'success' | 'error'
        error?: string
        details?: string
    }
    auth: {
        status: 'checking' | 'success' | 'error'
        error?: string
        details?: string
    }
    profile: {
        status: 'checking' | 'success' | 'error' | 'missing'
        error?: string
        details?: string
    }
}

export default function DebugPage() {
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({
        env: {
            hasUrl: false,
            hasKey: false,
            urlPreview: '',
            keyPreview: '',
            siteUrl: ''
        },
        connection: { status: 'checking' },
        auth: { status: 'checking' },
        profile: { status: 'checking' }
    })

    const [isRunning, setIsRunning] = useState(false)

    const runDebugChecks = async () => {
        setIsRunning(true)
        setDebugInfo(prev => ({
            ...prev,
            connection: { status: 'checking' },
            auth: { status: 'checking' },
            profile: { status: 'checking' }
        }))

        try {
            // Check environment variables
            const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
            const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            const urlPreview = process.env.NEXT_PUBLIC_SUPABASE_URL ?
                `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'Not set'
            const keyPreview = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
                `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'Not set'
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'Not set'

            setDebugInfo(prev => ({
                ...prev,
                env: { hasUrl, hasKey, urlPreview, keyPreview, siteUrl }
            }))

            // Test Supabase connection
            try {
                const supabase = createClient()

                // Test basic connection
                const { error: connError } = await supabase
                    .from('profiles')
                    .select('count')
                    .limit(0)

                if (connError) {
                    setDebugInfo(prev => ({
                        ...prev,
                        connection: {
                            status: 'error',
                            error: connError.message,
                            details: `Code: ${connError.code}, Details: ${connError.details}`
                        }
                    }))
                } else {
                    setDebugInfo(prev => ({
                        ...prev,
                        connection: { status: 'success' }
                    }))
                }

                // Test authentication
                try {
                    const { data: { user }, error: authError } = await supabase.auth.getUser()

                    if (authError) {
                        setDebugInfo(prev => ({
                            ...prev,
                            auth: {
                                status: 'error',
                                error: authError.message,
                                details: `Code: ${authError.code}`
                            }
                        }))
                    } else if (user) {
                        setDebugInfo(prev => ({
                            ...prev,
                            auth: {
                                status: 'success',
                                details: `User: ${user.email} (${user.id})`
                            }
                        }))

                        // Test profile access
                        const { data: profile, error: profileError } = await supabase
                            .from('profiles')
                            .select('id, email, username')
                            .eq('id', user.id)
                            .single()

                        if (profileError) {
                            if (profileError.code === 'PGRST116') {
                                setDebugInfo(prev => ({
                                    ...prev,
                                    profile: {
                                        status: 'missing',
                                        details: 'Profile not found - needs to be created'
                                    }
                                }))
                            } else {
                                setDebugInfo(prev => ({
                                    ...prev,
                                    profile: {
                                        status: 'error',
                                        error: profileError.message,
                                        details: `Code: ${profileError.code}`
                                    }
                                }))
                            }
                        } else {
                            setDebugInfo(prev => ({
                                ...prev,
                                profile: {
                                    status: 'success',
                                    details: `Profile found: ${profile.username || 'No username'}`
                                }
                            }))
                        }
                    } else {
                        setDebugInfo(prev => ({
                            ...prev,
                            auth: {
                                status: 'success',
                                details: 'No user authenticated'
                            }
                        }))
                    }
                } catch (authException) {
                    setDebugInfo(prev => ({
                        ...prev,
                        auth: {
                            status: 'error',
                            error: 'Exception occurred',
                            details: String(authException)
                        }
                    }))
                }

            } catch (connException) {
                setDebugInfo(prev => ({
                    ...prev,
                    connection: {
                        status: 'error',
                        error: 'Connection failed',
                        details: String(connException)
                    }
                }))
            }

        } catch (error) {
            console.error('Debug check failed:', error)
        } finally {
            setIsRunning(false)
        }
    }

    useEffect(() => {
        runDebugChecks()
    }, [])

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
        <div className="min-h-screen bg-[#0B0C0D] pt-6">
            <div className="container mx-auto max-w-4xl px-6">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-4 tracking-tight">
                        Debug Information
                    </h1>
                    <p className="text-xl text-[#9CA9B7]">
                        Detailed debugging information for Supabase connection issues.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Environment Variables */}
                    <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold">
                                Environment Variables
                            </CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                Check if your Supabase configuration is properly set
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-[#556274] mb-1">SUPABASE_URL</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm ${debugInfo.env.hasUrl ? 'text-green-400' : 'text-red-400'}`}>
                                            {debugInfo.env.hasUrl ? '✅ Set' : '❌ Missing'}
                                        </span>
                                        {debugInfo.env.hasUrl && (
                                            <span className="text-xs text-[#9CA9B7] font-mono">
                                                {debugInfo.env.urlPreview}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-[#556274] mb-1">SUPABASE_ANON_KEY</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm ${debugInfo.env.hasKey ? 'text-green-400' : 'text-red-400'}`}>
                                            {debugInfo.env.hasKey ? '✅ Set' : '❌ Missing'}
                                        </span>
                                        {debugInfo.env.hasKey && (
                                            <span className="text-xs text-[#9CA9B7] font-mono">
                                                {debugInfo.env.keyPreview}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-[#556274] mb-1">SITE_URL</p>
                                <span className="text-sm text-[#9CA9B7]">{debugInfo.env.siteUrl}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Connection Status */}
                    <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-xl font-bold">
                                Connection Status
                            </CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                Real-time connection and authentication status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[#FBF7FA]">Database Connection:</span>
                                <span className={`${getStatusColor(debugInfo.connection.status)}`}>
                                    {getStatusIcon(debugInfo.connection.status)} {debugInfo.connection.status}
                                </span>
                            </div>
                            {debugInfo.connection.error && (
                                <div className="p-3 bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] rounded text-red-400 text-sm">
                                    <strong>Error:</strong> {debugInfo.connection.error}
                                    {debugInfo.connection.details && (
                                        <div className="mt-1 text-xs">{debugInfo.connection.details}</div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-[#FBF7FA]">Authentication:</span>
                                <span className={`${getStatusColor(debugInfo.auth.status)}`}>
                                    {getStatusIcon(debugInfo.auth.status)} {debugInfo.auth.status}
                                </span>
                            </div>
                            {debugInfo.auth.error && (
                                <div className="p-3 bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] rounded text-red-400 text-sm">
                                    <strong>Error:</strong> {debugInfo.auth.error}
                                    {debugInfo.auth.details && (
                                        <div className="mt-1 text-xs">{debugInfo.auth.details}</div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-[#FBF7FA]">Profile Access:</span>
                                <span className={`${getStatusColor(debugInfo.profile.status)}`}>
                                    {getStatusIcon(debugInfo.profile.status)} {debugInfo.profile.status}
                                </span>
                            </div>
                            {debugInfo.profile.error && (
                                <div className="p-3 bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] rounded text-red-400 text-sm">
                                    <strong>Error:</strong> {debugInfo.profile.error}
                                    {debugInfo.profile.details && (
                                        <div className="mt-1 text-xs">{debugInfo.profile.details}</div>
                                    )}
                                </div>
                            )}
                            {debugInfo.profile.details && !debugInfo.profile.error && (
                                <div className="p-3 bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] rounded text-[#4AA7FF] text-sm">
                                    {debugInfo.profile.details}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-center">
                        <Button
                            onClick={runDebugChecks}
                            disabled={isRunning}
                            className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all disabled:opacity-60 disabled:hover:transform-none px-8"
                        >
                            {isRunning ? 'Running Checks...' : 'Run Debug Checks'}
                        </Button>
                    </div>

                    {/* Instructions */}
                    <Card className="bg-[rgba(37,122,218,0.10)] border-[rgba(37,122,218,0.35)] rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-[#4AA7FF] text-lg font-semibold">
                                How to Fix Common Issues
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-[#9CA9B7]">
                            <div>
                                <strong className="text-[#FBF7FA]">Missing Environment Variables:</strong>
                                <p>Create a <code className="bg-[rgba(0,0,0,0.20)] px-1 rounded">.env.local</code> file in your project root with:</p>
                                <pre className="bg-[rgba(0,0,0,0.20)] p-2 rounded mt-1 text-xs font-mono">
                                    {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000`}
                                </pre>
                            </div>
                            <div>
                                <strong className="text-[#FBF7FA]">Database Connection Errors:</strong>
                                <p>Run the SQL commands from <code className="bg-[rgba(0,0,0,0.20)] px-1 rounded">DATABASE_SETUP_COMPLETE.sql</code> in your Supabase SQL Editor.</p>
                            </div>
                            <div>
                                <strong className="text-[#FBF7FA]">Permission Errors:</strong>
                                <p>Check your Row Level Security (RLS) policies in Supabase and ensure the <code className="bg-[rgba(0,0,0,0.20)] px-1 rounded">profiles</code> table has proper policies.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


