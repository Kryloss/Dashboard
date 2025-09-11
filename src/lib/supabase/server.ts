import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
                            // Configure cookies for cross-subdomain authentication
                            const enhancedOptions = {
                                ...options,
                                domain: process.env.NODE_ENV === 'production' ? '.kryloss.com' : undefined, // Allow cookies to be shared across all subdomains in production
                                path: '/',
                                sameSite: 'lax' as const,
                                secure: process.env.NODE_ENV === 'production',
                                ...options
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
