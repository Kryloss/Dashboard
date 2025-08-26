import { NextRequest, NextResponse } from 'next/server'
import { testEmailRendering } from '@/lib/actions/test-email'

export async function POST(request: NextRequest) {
    try {
        // Test email rendering
        const result = await testEmailRendering()

        return NextResponse.json({
            success: true,
            message: 'Email test completed successfully',
            result
        })
    } catch (error) {
        console.error('Email test failed:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Email test failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST to test email functionality',
        endpoints: {
            test: 'POST /api/test-email - Test email rendering',
            welcome: 'POST /api/test-email/welcome - Test welcome email sending'
        }
    })
}
