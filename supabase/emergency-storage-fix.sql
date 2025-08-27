-- EMERGENCY Storage Fix - Most Permissive Setup
-- Use this ONLY if you need to get uploads working immediately
-- WARNING: This creates very permissive policies - not recommended for production

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    1048576, -- 1MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop all existing policies for storage.objects
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to avatars" ON storage.objects;

-- Create the most permissive policy possible for avatars bucket
CREATE POLICY "Emergency avatars access" ON storage.objects
    FOR ALL USING (bucket_id = 'avatars');

-- This policy allows ANY authenticated user to:
-- - Upload files to avatars bucket
-- - Read files from avatars bucket  
-- - Update files in avatars bucket
-- - Delete files from avatars bucket

-- NOTE: This is NOT secure for production use!
-- Use only for testing and development
