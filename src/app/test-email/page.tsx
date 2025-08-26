'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEmailPage() {
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const testEmailRendering = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/test-email', {
                method: 'POST',
            })
            const data = await response.json()

            if (data.success) {
                setResult(data)
            } else {
                setError(data.error || 'Test failed')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const testWelcomeEmail = async () => {
        if (!email || !fullName) {
            setError('Please fill in both email and full name')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/test-email/welcome', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, fullName }),
            })
            const data = await response.json()

            if (data.success) {
                setResult(data)
            } else {
                setError(data.error || 'Test failed')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Welcome Email Test</h1>
                    <p className="text-muted-foreground mt-2">
                        Test the welcome email functionality for new user signups
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Test Email Rendering</CardTitle>
                        <CardDescription>
                            Test if the email template renders correctly without sending
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={testEmailRendering}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? 'Testing...' : 'Test Email Rendering'}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Test Welcome Email Sending</CardTitle>
                        <CardDescription>
                            Test sending a welcome email to a specific address
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="test@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Test User"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={testWelcomeEmail}
                            disabled={loading || !email || !fullName}
                            className="w-full"
                        >
                            {loading ? 'Sending...' : 'Send Welcome Email'}
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <p className="text-red-700 font-medium">Error:</p>
                            <p className="text-red-600">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {result && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-green-800">Success!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-sm text-green-700 bg-green-100 p-4 rounded overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Set up your Resend API key in environment variables</p>
                        <p>2. Run the database migration in Supabase</p>
                        <p>3. Deploy the Edge Function</p>
                        <p>4. Test with a real user signup</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
