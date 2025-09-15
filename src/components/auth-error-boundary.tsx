'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class AuthErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('AuthErrorBoundary caught an error:', error, errorInfo)

        this.setState({
            error,
            errorInfo
        })

        // If it's an auth error, try to redirect to login
        if (error.message.includes('Auth session missing') ||
            error.message.includes('Invalid JWT') ||
            error.message.includes('JWT expired') ||
            error.name === 'AuthSessionMissingError') {

            // Clear any stored auth data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('supabase.auth.token')
                sessionStorage.clear()
            }

            // Redirect to login after a short delay
            setTimeout(() => {
                window.location.href = '/login?message=Session expired. Please sign in again.'
            }, 2000)
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })

        // Clear auth storage and reload
        if (typeof window !== 'undefined') {
            localStorage.removeItem('supabase.auth.token')
            sessionStorage.clear()
            window.location.reload()
        }
    }

    render() {
        if (this.state.hasError) {
            // If a custom fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback
            }

            const isAuthError = this.state.error?.message.includes('Auth session missing') ||
                this.state.error?.message.includes('Invalid JWT') ||
                this.state.error?.message.includes('JWT expired') ||
                this.state.error?.name === 'AuthSessionMissingError'

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-semibold">
                                {isAuthError ? 'Session Expired' : 'Something went wrong'}
                            </CardTitle>
                            <CardDescription>
                                {isAuthError
                                    ? 'Your session has expired. You will be redirected to the login page shortly.'
                                    : 'An unexpected error occurred. Please try refreshing the page.'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && (
                                <details className="text-sm text-gray-600">
                                    <summary className="cursor-pointer font-medium">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs">
                                        {this.state.error?.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={this.handleRetry}
                                    className="flex-1"
                                    variant={isAuthError ? "outline" : "default"}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {isAuthError ? 'Sign In Again' : 'Retry'}
                                </Button>
                            </div>

                            {isAuthError && (
                                <p className="text-xs text-gray-500 text-center">
                                    Redirecting to login page in a few seconds...
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

// Hook version for functional components
export function useAuthErrorHandler() {
    const handleAuthError = (error: Error) => {
        if (error.message.includes('Auth session missing') ||
            error.message.includes('Invalid JWT') ||
            error.message.includes('JWT expired') ||
            error.name === 'AuthSessionMissingError') {

            console.warn('Auth error detected, clearing session:', error.message)

            // Clear auth storage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('supabase.auth.token')
                sessionStorage.clear()
            }

            // Redirect to login
            window.location.href = '/login?message=Session expired. Please sign in again.'
        }
    }

    return { handleAuthError }
}