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
            progress_images: {
                Row: {
                    id: string
                    user_id: string
                    image_url: string
                    image_type: 'progress' | 'before' | 'after' | 'current'
                    title: string | null
                    notes: string | null
                    weight_kg: number | null
                    visibility: 'private' | 'public'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    image_url: string
                    image_type?: 'progress' | 'before' | 'after' | 'current'
                    title?: string | null
                    notes?: string | null
                    weight_kg?: number | null
                    visibility?: 'private' | 'public'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    image_url?: string
                    image_type?: 'progress' | 'before' | 'after' | 'current'
                    title?: string | null
                    notes?: string | null
                    weight_kg?: number | null
                    visibility?: 'private' | 'public'
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProgressImage = Database['public']['Tables']['progress_images']['Row']
export type ProgressImageInsert = Database['public']['Tables']['progress_images']['Insert']
export type ProgressImageUpdate = Database['public']['Tables']['progress_images']['Update']
