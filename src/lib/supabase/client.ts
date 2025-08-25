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
        return {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: async () => {
                            throw new Error('Supabase not configured. Check your environment variables.')
                        }
                    })
                })
            }),
            auth: {
                getSession: async () => {
                    throw new Error('Supabase not configured. Check your environment variables.')
                },
                getUser: async () => {
                    throw new Error('Supabase not configured. Check your environment variables.')
                },
                onAuthStateChange: () => ({
                    data: { subscription: { unsubscribe: () => { } } }
                }),
                signOut: async () => {
                    throw new Error('Supabase not configured. Check your environment variables.')
                }
            }
        } as SupabaseClient
    }

    try {
        const client = createBrowserClient(supabaseUrl, supabaseAnonKey)

        // Test the connection
        client.from('profiles').select('count').limit(0).then(() => {
            console.log('✅ Supabase connection successful')
        }).catch((error) => {
            console.error('❌ Supabase connection failed:', error)
        })

        return client
    } catch (error) {
        console.error('Failed to create Supabase client:', error)
        throw error
    }
}
