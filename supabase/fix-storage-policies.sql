-- Fix Storage Policies for Avatar Uploads
-- Run this in your Supabase SQL editor to resolve RLS policy issues

-- First, check if the avatars bucket exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        -- Create the avatars storage bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars',
            'avatars',
            true,
            1048576, -- 1MB limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        );
        RAISE NOTICE 'Created avatars bucket';
    ELSE
        RAISE NOTICE 'Avatars bucket already exists';
    END IF;
END $$;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create a simple, working policy that allows authenticated users to upload to avatars bucket
CREATE POLICY "Allow authenticated uploads to avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- Allow public read access to avatars
CREATE POLICY "Public read access to avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes to avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- Verify policies were created
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND tablename = 'objects';
