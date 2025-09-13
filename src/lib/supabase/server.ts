import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Universal cookie configuration for all Supabase clients
const UNIVERSAL_COOKIE_CONFIG = {
    domain: process.env.NODE_ENV === 'production' ? '.kryloss.com' : undefined,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Required for client-side auth compatibility
    maxAge: 60 * 60 * 24 * 7 // 7 days
}

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // Use universal cookie configuration
                            const enhancedOptions = {
                                ...UNIVERSAL_COOKIE_CONFIG,
                                ...options // Allow override if needed
                            }
                            cookieStore.set(name, value, enhancedOptions)
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
