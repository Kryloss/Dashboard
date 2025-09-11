'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function invalidateAuthCache() {
    try {
        // Revalidate auth-related pages
        revalidatePath('/dashboard')
        revalidatePath('/profile')
        revalidatePath('/login')
        revalidatePath('/signup')
        revalidatePath('/', 'layout') // Revalidate the root layout which contains AuthProvider
        
        // Revalidate auth-related tags if any
        revalidateTag('auth')
        revalidateTag('user')
        revalidateTag('profile')
        
        console.log('Cache invalidation completed for auth-related pages')
        return { success: true }
    } catch (error) {
        console.error('Cache invalidation error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}