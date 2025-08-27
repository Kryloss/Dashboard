-- Setup Avatar Storage Bucket and Policies
-- Run this in your Supabase SQL editor
-- 
-- Features:
-- - 1MB file size limit (images are automatically resized to 256x256 client-side)
-- - Automatic cleanup of old images when replacing
-- - Secure user-specific access policies

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
