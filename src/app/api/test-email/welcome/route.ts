import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/actions/email'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, fullName } = body

        if (!email || !fullName) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email and fullName are required'
                },
                { status: 400 }
            )
        }

        // Test sending welcome email
        const result = await sendWelcomeEmail(
            'test-user-id',
            email,
            fullName
        )

        return NextResponse.json({
            success: true,
            message: 'Welcome email sent successfully',
            result
        })
    } catch (error) {
        console.error('Welcome email test failed:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Welcome email test failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Welcome email test endpoint',
        usage: 'POST with { "email": "test@example.com", "fullName": "Test User" }'
    })
}
