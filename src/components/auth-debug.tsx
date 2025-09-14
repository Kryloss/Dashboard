'use client'

import { useAuthContext } from '@/lib/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Session } from '@supabase/supabase-js'

export function AuthDebug() {
    const { user, loading, isAuthenticated, supabase } = useAuthContext()
    const [showDebug, setShowDebug] = useState(false)
    const [sessionInfo, setSessionInfo] = useState<Session | null>(null)

    // Only show in development
    useEffect(() => {
        setShowDebug(process.env.NODE_ENV === 'development')
    }, [])

    // Get detailed session info
    useEffect(() => {
        if (!showDebug || !user) return

        async function getSessionInfo() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setSessionInfo(session)
            } catch (err) {
                console.error('AuthDebug: Failed to get session:', err)
            }
        }

        getSessionInfo()
    }, [user, supabase, showDebug])

    if (!showDebug) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Card className="bg-black/90 border-yellow-500/50 text-yellow-200 text-xs">
                <CardHeader className="pb-2">
                    <CardTitle className="text-yellow-400 text-sm flex items-center justify-between">
                        Auth Debug
                        <Button
                            onClick={() => setShowDebug(false)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-yellow-400 hover:text-yellow-200"
                        >
                            ×
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                    <div>Status: {loading ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
                    <div>User ID: {user?.id || 'None'}</div>
                    <div>Email: {user?.email || 'None'}</div>
                    <div>Provider: {user?.app_metadata?.provider || 'None'}</div>
                    <div>Email Verified: {user?.email_confirmed_at ? 'Yes' : 'No'}</div>
                    {sessionInfo && (
                        <>
                            <div>Session Expires: {sessionInfo.expires_at ? new Date(sessionInfo.expires_at * 1000).toLocaleTimeString() : 'Unknown'}</div>
                            <div>Access Token: {sessionInfo.access_token ? 'Present' : 'Missing'}</div>
                        </>
                    )}
                    <div className="text-yellow-500 text-xs mt-2">
                        Rendered: {new Date().toLocaleTimeString()}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Minimal floating debug indicator
export function AuthDebugIndicator() {
    const { isAuthenticated, loading } = useAuthContext()
    const [show, setShow] = useState(false)

    useEffect(() => {
        setShow(process.env.NODE_ENV === 'development')
    }, [])

    if (!show) return null

    const status = loading ? 'L' : isAuthenticated ? '✓' : '✗'
    const color = loading ? 'bg-yellow-500' : isAuthenticated ? 'bg-green-500' : 'bg-red-500'

    return (
        <div className={`fixed top-4 right-4 z-50 w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
            {status}
        </div>
    )
}