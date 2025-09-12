import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables:', {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
            url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
            key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
            nodeEnv: process.env.NODE_ENV,
            hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
        })

        // Return a mock client that will show clear errors
        const mockError = () => {
            throw new Error('Supabase not configured. Check your environment variables.')
        }

        return {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: mockError
                    })
                })
            }),
            auth: {
                getSession: mockError,
                getUser: mockError,
                onAuthStateChange: () => ({
                    data: { subscription: { unsubscribe: () => { } } }
                }),
                signOut: mockError
            }
        } as unknown as SupabaseClient
    }

    try {
        const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                flowType: 'pkce',
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storageKey: 'supabase.auth.token',
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                debug: process.env.NODE_ENV === 'development'
            },
            // Enable cross-subdomain authentication
            cookieOptions: {
                domain: process.env.NODE_ENV === 'production' ? '.kryloss.com' : undefined, // Use dot prefix for subdomains
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: false, // Required for client-side auth
                maxAge: 60 * 60 * 24 * 7 // 7 days
            }
        })
        return client
    } catch (error) {
        console.error('Failed to create Supabase client:', error)
        throw error
    }
}
