'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: any
}

export class AuthErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('AuthErrorBoundary caught an error:', error, errorInfo)
        this.setState({ errorInfo })

        // Report to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to error monitoring service
            console.error('Production auth error:', { error, errorInfo })
        }
    }

    handleReload = () => {
        window.location.reload()
    }

    handleResetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    handleGoToLogin = () => {
        window.location.href = '/login?message=Authentication error occurred'
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-[#0B0C0D] flex items-center justify-center p-6">
                    <Card className="max-w-md w-full bg-[#121922] border-red-500/30">
                        <CardHeader>
                            <CardTitle className="text-red-400 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                Authentication Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-[#9CA9B7]">
                                Something went wrong with the authentication system. This usually happens when there's a problem with the connection or session.
                            </div>
                            
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-xs">
                                    <summary className="text-red-400 cursor-pointer">Error Details (Dev)</summary>
                                    <pre className="mt-2 p-2 bg-red-500/10 rounded text-red-300 overflow-auto">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack && (
                                            <>
                                                {'\n\nComponent Stack:'}
                                                {this.state.errorInfo.componentStack}
                                            </>
                                        )}
                                    </pre>
                                </details>
                            )}

                            <div className="flex flex-col gap-2">
                                <Button 
                                    onClick={this.handleReload}
                                    className="w-full"
                                >
                                    Reload Page
                                </Button>
                                <Button 
                                    onClick={this.handleResetError}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Try Again
                                </Button>
                                <Button 
                                    onClick={this.handleGoToLogin}
                                    variant="ghost"
                                    className="w-full text-[#9CA9B7]"
                                >
                                    Go to Login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}