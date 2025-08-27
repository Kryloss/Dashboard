# Profile Image Upload Setup Guide

This guide explains how to set up profile image upload functionality in your Supabase dashboard application.

## Features

- ✅ **Automatic Image Resizing**: Images automatically resized to 256x256 pixels
- ✅ **Optimized Storage**: 1MB file size limit with client-side compression
- ✅ **Multiple Formats**: Support for JPG, PNG, GIF, WebP
- ✅ **Automatic Cleanup**: Old images deleted when replacing
- ✅ **Remove Profile Images**: Easy removal of profile pictures
- ✅ **Secure Storage**: User-specific access policies with Row Level Security
- ✅ **Real-time Updates**: Immediate UI feedback after uploads
- ✅ **Smart Compression**: JPEG format with 85% quality for optimal size/quality balance

## Prerequisites

1. Supabase project with Storage enabled
2. Database with `profiles` table containing `avatar_url` field
3. Next.js application with the provided components

## Setup Steps

### 1. Database Schema

Ensure your `profiles` table has the `avatar_url` field:

```sql
-- Check if avatar_url column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'avatar_url';

-- Add if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### 2. Storage Bucket Setup

Run the following SQL in your Supabase SQL editor to create the storage bucket and policies:

```sql
-- Create the avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    1048576, -- 1MB limit (images are resized to 256x256 before upload)
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload their own avatars
-- Note: The filename must start with the user's ID for the policy to work
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create storage policy to allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create storage policy to allow public read access to avatars
CREATE POLICY "Public read access to avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Create storage policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Note: Row Level Security is already enabled on storage.objects by default in Supabase
-- No need to manually enable it
```

### 3. Environment Variables

Ensure your `.env.local` file contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Component Integration

The profile image upload functionality is already integrated into:

- `src/components/profile-form.tsx` - Main profile form with upload UI and image resizing
- `src/lib/actions/auth.ts` - Server actions for upload/remove operations
- `src/lib/utils.ts` - Image resizing utilities
- `src/app/profile/page.tsx` - Profile page that fetches avatar data

## How It Works

### Image Processing Pipeline

1. **User Selection**: User selects an image file
2. **Client-side Resizing**: Image automatically resized to 256x256 pixels using HTML5 Canvas
3. **Compression**: Converted to JPEG format with 85% quality for optimal file size
4. **Upload**: Resized image uploaded to Supabase Storage
5. **Storage**: Stored with 1MB limit and automatic cleanup of old images

### Benefits of 256x256 Resolution

- **Consistent UI**: All avatars display at the same size
- **Fast Loading**: Smaller files load faster
- **Storage Efficiency**: Significant reduction in cloud storage costs
- **Mobile Friendly**: Optimized for mobile devices and slow connections
- **Professional Look**: Standardized avatar dimensions across the platform

## Usage

### For Users

1. Navigate to `/profile`
2. Click "Upload Picture" button
3. Select any image file (automatically resized to 256x256)
4. Image processes and uploads automatically
5. Use "Remove Picture" to delete the current image

### For Developers

#### Upload Image (with automatic resizing)

```typescript
import { uploadProfileImage } from '@/lib/actions/auth'
import { resizeImageTo256x256, getFileExtension } from '@/lib/utils'

// Resize image before upload
const resizedBlob = await resizeImageTo256x256(file)
const resizedFile = new File([resizedBlob], `avatar.${getFileExtension(file.type)}`, { type: 'image/jpeg' })

const formData = new FormData()
formData.append('image', resizedFile)
const result = await uploadProfileImage(formData)
```

#### Remove Image

```typescript
import { removeProfileImage } from '@/lib/actions/auth'

const result = await removeProfileImage()
```

## File Structure

```
src/
├── app/
│   └── profile/
│       └── page.tsx              # Profile page with avatar support
├── components/
│   └── profile-form.tsx          # Profile form with upload UI and resizing
├── lib/
│   ├── actions/
│   │   └── auth.ts               # Upload/remove server actions
│   └── utils.ts                  # Image resizing utilities

supabase/
├── setup-avatar-storage.sql      # Storage setup script (1MB limit)
└── setup-avatar-storage-simple.sql # Simple alternative setup
```

## Storage Optimization

### File Size Reduction

- **Before**: Original images could be 5-10MB+
- **After**: Resized images typically 50-200KB
- **Savings**: 90-95% reduction in storage costs
- **Performance**: Faster uploads and page loads

### Quality Settings

- **Resolution**: 256x256 pixels (perfect for avatars)
- **Format**: JPEG with 85% quality
- **Compression**: Optimized for web use
- **Aspect Ratio**: Maintained with centered cropping

## Security Features

- **User Isolation**: Users can only access their own avatar files
- **File Type Validation**: Only image files are allowed
- **Size Limits**: 1MB maximum file size (enforced server-side)
- **Automatic Cleanup**: Old images are deleted when replacing
- **Row Level Security**: Database policies enforce access control

## Troubleshooting

### Common Issues

1. **"Image size must be less than 1MB"**
   - Images are automatically resized client-side
   - Check if the resizing utility is working properly
   - Verify browser supports HTML5 Canvas

2. **"Failed to process image"**
   - Check browser console for errors
   - Ensure image file is valid
   - Try with a different image format

3. **"Permission denied"**
   - Ensure RLS is enabled on storage.objects
   - Verify storage policies are correctly configured
   - Check user authentication status

4. **"ERROR: 42501: must be owner of table objects"**
   - This is a common error when trying to create storage policies
   - Use the alternative setup script: `supabase/setup-avatar-storage-simple.sql`
   - Or try creating policies one by one in the Supabase dashboard

### Storage Policy Setup Issues

If you encounter the "must be owner of table objects" error:

#### Option 1: Use the Simple Setup
Run the simplified script that only creates the bucket:
```sql
-- Run supabase/setup-avatar-storage-simple.sql
```

#### Option 2: Manual Dashboard Setup
1. Go to your Supabase dashboard
2. Navigate to Storage → Policies
3. Create policies manually for the `avatars` bucket:
   - **INSERT**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`
   - **SELECT**: `bucket_id = 'avatars'`
   - **UPDATE**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`
   - **DELETE**: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`

#### Option 3: Check Existing Policies
Some Supabase projects may already have storage policies enabled:
```sql
-- Check if policies already exist
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
```

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify Supabase client configuration
3. Test storage policies in Supabase dashboard
4. Check file upload limits and allowed types
5. Test image resizing with different file formats
6. Verify storage bucket exists and is accessible

## Performance Considerations

- **Client-side Processing**: Reduces server load and bandwidth
- **Automatic Caching**: Images cached with 1-hour cache control
- **Efficient Storage**: 256x256 resolution optimized for avatars
- **Fast Uploads**: Smaller files upload much faster
- **Optimistic UI**: Immediate feedback during processing

## Future Enhancements

- **WebP Support**: Automatic WebP conversion for modern browsers
- **Progressive Loading**: Low-quality placeholder while processing
- **Batch Processing**: Multiple image uploads
- **Advanced Cropping**: User-defined crop areas
- **CDN Integration**: Global image delivery optimization

## Cost Savings

With automatic 256x256 resizing and 1MB limits:

- **Storage Costs**: 90-95% reduction
- **Bandwidth**: Significantly lower transfer costs
- **Performance**: Faster page loads and better user experience
- **Scalability**: More users without storage concerns
