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
                            const cookieOptions = {
                                domain: process.env.NODE_ENV === 'production' ? '.kryloss.com' : undefined,
                                path: '/',
                                sameSite: 'lax' as const,
                                secure: process.env.NODE_ENV === 'production',
                                maxAge: 60 * 60 * 24 * 7, // 7 days
                                ...options
                            }
                            cookieStore.set(name, value, cookieOptions)
                        })
                    } catch (error) {
                        // Ignore errors in server components
                    }
                },
            },
        }
    )
}
