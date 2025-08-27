export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                    welcomed_at: string | null
                }
                Insert: {
                    id: string
                    email: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                    welcomed_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                    welcomed_at?: string | null
                }
            }
        }
    }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
