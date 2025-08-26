import { sendWelcomeEmail } from './email'

export async function testWelcomeEmail() {
    try {
        console.log('Testing welcome email functionality...')

        // Test with sample data
        const result = await sendWelcomeEmail(
            'test-user-id',
            'test@example.com',
            'Test User'
        )

        console.log('Welcome email test result:', result)
        return result
    } catch (error) {
        console.error('Welcome email test failed:', error)
        throw error
    }
}

// Function to test email rendering without sending
export async function testEmailRendering() {
    try {
        const { renderAsync } = await import('@react-email/components')
        const { WelcomeEmail } = await import('@/emails/welcome-email')

        console.log('Testing email template rendering...')

        const emailHtml = await renderAsync(WelcomeEmail({ fullName: 'Test User' }))

        console.log('Email template rendered successfully')
        console.log('HTML length:', emailHtml.length)

        return { success: true, htmlLength: emailHtml.length }
    } catch (error) {
        console.error('Email template rendering test failed:', error)
        throw error
    }
}
