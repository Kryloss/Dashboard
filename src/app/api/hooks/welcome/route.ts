import { NextRequest, NextResponse } from 'next/server';
import { sendWelcome } from '@/lib/email/resend';

// Simple in-memory cache for replay protection
const replayCache = new Map<string, number>();
const REPLAY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [email, timestamp] of replayCache.entries()) {
        if (now - timestamp > REPLAY_WINDOW_MS) {
            replayCache.delete(email);
        }
    }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
    try {
        // Verify authorization header
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

        if (!expectedSecret) {
            console.error('SUPABASE_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook not configured' },
                { status: 500 }
            );
        }

        if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
            console.warn('Unauthorized webhook attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();

        if (!body.email || typeof body.email !== 'string') {
            console.warn('Invalid webhook payload: missing or invalid email');
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 }
            );
        }

        const { email, username } = body;

        // Enhanced logging for debugging
        console.log(`Welcome webhook triggered for: ${email} (username: ${username || 'not set'})`);
        console.log(`Request headers:`, Object.fromEntries(request.headers.entries()));
        console.log(`Request body:`, body);

        // Replay protection with more flexible logic
        const now = Date.now();
        const lastSent = replayCache.get(email);

        if (lastSent && (now - lastSent) < REPLAY_WINDOW_MS) {
            console.log(`Skipping duplicate welcome email for ${email} (replay protection - last sent: ${new Date(lastSent).toISOString()})`);
            return NextResponse.json({ ok: true, skipped: 'duplicate', lastSent: new Date(lastSent).toISOString() });
        }

        // Send welcome email
        console.log(`Attempting to send welcome email to ${email}...`);
        await sendWelcome(email, username);

        // Mark as sent in replay cache
        replayCache.set(email, now);

        console.log(`Welcome email sent successfully to ${email} at ${new Date(now).toISOString()}`);
        return NextResponse.json({
            ok: true,
            sentAt: new Date(now).toISOString(),
            email: email,
            username: username
        });

    } catch (error) {
        console.error('Error processing welcome webhook:', error);

        // More detailed error logging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }

        // Don't leak internal details to client
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Only allow POST method
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
