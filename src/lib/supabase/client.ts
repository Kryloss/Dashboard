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
            key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
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
                storage: typeof window !== 'undefined' ? window.localStorage : undefined
            },
            // Enable cross-subdomain authentication
            cookieOptions: {
                domain: process.env.NODE_ENV === 'production' ? '.kryloss.com' : undefined, // Allow cookies to be shared across all subdomains in production
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            }
        })
        return client
    } catch (error) {
        console.error('Failed to create Supabase client:', error)
        throw error
    }
}
