'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ProgressImageInsert, ProgressImageUpdate } from '@/lib/types/database.types'

// Upload a new progress image
export async function uploadProgressImage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const file = formData.get('image') as File
    const title = formData.get('title') as string || null
    const notes = formData.get('notes') as string || null
    const weightKg = formData.get('weight_kg') as string
    const imageType = formData.get('image_type') as string || 'progress'
    const visibility = formData.get('visibility') as string || 'private'

    if (!file) {
        return { error: 'No image file provided' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return { error: 'File must be an image' }
    }

    // Validate file size (5MB limit for progress photos)
    if (file.size > 5 * 1024 * 1024) {
        return { error: 'Image size must be less than 5MB. Please compress your image.' }
    }

    // Validate image type
    const validTypes = ['progress', 'before', 'after', 'current']
    if (!validTypes.includes(imageType)) {
        return { error: 'Invalid image type' }
    }

    // Validate visibility
    const validVisibility = ['private', 'public']
    if (!validVisibility.includes(visibility)) {
        return { error: 'Invalid visibility setting' }
    }

    try {
        // Generate unique filename with timestamp
        const fileExt = file.name.split('.').pop()
        const timestamp = Date.now()
        const fileName = `${user.id}/${imageType}-${timestamp}.${fileExt}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('progress-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { error: 'Failed to upload image' }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('progress-images')
            .getPublicUrl(fileName)

        // Parse weight (optional)
        const parsedWeight = weightKg ? parseFloat(weightKg) : null
        if (parsedWeight !== null && (isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 1000)) {
            return { error: 'Weight must be a valid number between 0 and 1000 kg' }
        }

        // Save progress image record to database
        const progressImageData: ProgressImageInsert = {
            user_id: user.id,
            image_url: publicUrl,
            image_type: imageType as 'progress' | 'before' | 'after' | 'current',
            title: title?.trim() || null,
            notes: notes?.trim() || null,
            weight_kg: parsedWeight,
            visibility: visibility as 'private' | 'public'
        }

        const { data: progressImage, error: dbError } = await supabase
            .from('progress_images')
            .insert(progressImageData)
            .select()
            .single()

        if (dbError) {
            console.error('Database error:', dbError)
            
            // Clean up uploaded file if database insert fails
            await supabase.storage
                .from('progress-images')
                .remove([fileName])
            
            return { error: 'Failed to save progress image record' }
        }

        revalidatePath('/profile')
        return { 
            message: 'Progress image uploaded successfully',
            progressImage
        }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { error: 'An unexpected error occurred' }
    }
}

// Get all progress images for a user
export async function getProgressImages(filters?: {
    imageType?: string
    startDate?: string
    endDate?: string
    limit?: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    try {
        let query = supabase
            .from('progress_images')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.imageType && filters.imageType !== 'all') {
            query = query.eq('image_type', filters.imageType)
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate)
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate)
        }

        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        const { data: progressImages, error } = await query

        if (error) {
            console.error('Database error:', error)
            return { error: 'Failed to fetch progress images' }
        }

        return { progressImages }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { error: 'An unexpected error occurred' }
    }
}

// Update a progress image
export async function updateProgressImage(id: string, updates: ProgressImageUpdate) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    try {
        // Validate updates
        if (updates.image_type) {
            const validTypes = ['progress', 'before', 'after', 'current']
            if (!validTypes.includes(updates.image_type)) {
                return { error: 'Invalid image type' }
            }
        }

        if (updates.visibility) {
            const validVisibility = ['private', 'public']
            if (!validVisibility.includes(updates.visibility)) {
                return { error: 'Invalid visibility setting' }
            }
        }

        if (updates.weight_kg !== undefined && updates.weight_kg !== null) {
            if (isNaN(updates.weight_kg) || updates.weight_kg <= 0 || updates.weight_kg > 1000) {
                return { error: 'Weight must be a valid number between 0 and 1000 kg' }
            }
        }

        // Trim text fields
        if (updates.title !== undefined) {
            updates.title = updates.title?.trim() || null
        }
        if (updates.notes !== undefined) {
            updates.notes = updates.notes?.trim() || null
        }

        const { data: progressImage, error } = await supabase
            .from('progress_images')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id) // Ensure user can only update their own images
            .select()
            .single()

        if (error) {
            console.error('Database error:', error)
            return { error: 'Failed to update progress image' }
        }

        revalidatePath('/profile')
        return { 
            message: 'Progress image updated successfully',
            progressImage
        }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { error: 'An unexpected error occurred' }
    }
}

// Delete a progress image
export async function deleteProgressImage(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    try {
        // First, get the image record to find the file path
        const { data: progressImage, error: fetchError } = await supabase
            .from('progress_images')
            .select('image_url')
            .eq('id', id)
            .eq('user_id', user.id) // Ensure user can only delete their own images
            .single()

        if (fetchError || !progressImage) {
            return { error: 'Progress image not found' }
        }

        // Extract file path from URL
        const url = progressImage.image_url
        const pathMatch = url.match(/\/progress-images\/(.+)$/)
        
        if (pathMatch) {
            const filePath = pathMatch[1]
            
            // Delete file from storage
            const { error: storageError } = await supabase.storage
                .from('progress-images')
                .remove([filePath])

            if (storageError) {
                console.error('Storage deletion error:', storageError)
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete database record
        const { error: deleteError } = await supabase
            .from('progress_images')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (deleteError) {
            console.error('Database error:', deleteError)
            return { error: 'Failed to delete progress image' }
        }

        revalidatePath('/profile')
        return { message: 'Progress image deleted successfully' }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { error: 'An unexpected error occurred' }
    }
}

// Get progress statistics
export async function getProgressStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    try {
        // Get total count and earliest/latest images
        const { data: stats, error } = await supabase
            .from('progress_images')
            .select('id, weight_kg, created_at, image_type')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return { error: 'Failed to fetch progress statistics' }
        }

        const totalImages = stats.length
        const firstImage = stats[0]
        const latestImage = stats[stats.length - 1]

        // Calculate weight change if both first and last images have weight data
        let weightChange = null
        if (firstImage?.weight_kg && latestImage?.weight_kg) {
            weightChange = latestImage.weight_kg - firstImage.weight_kg
        }

        // Count by image type
        const typeCount = stats.reduce((acc, img) => {
            acc[img.image_type] = (acc[img.image_type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            stats: {
                totalImages,
                weightChange,
                firstImageDate: firstImage?.created_at,
                latestImageDate: latestImage?.created_at,
                imagesByType: typeCount
            }
        }

    } catch (error) {
        console.error('Unexpected error:', error)
        return { error: 'An unexpected error occurred' }
    }
}