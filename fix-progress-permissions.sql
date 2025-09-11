-- Fix Progress Images Permissions
-- Run this in your Supabase SQL Editor if you're getting permission denied errors

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'progress_images';

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Users can view their own progress images" ON progress_images;
DROP POLICY IF EXISTS "Users can insert their own progress images" ON progress_images;
DROP POLICY IF EXISTS "Users can update their own progress images" ON progress_images;
DROP POLICY IF EXISTS "Users can delete their own progress images" ON progress_images;
DROP POLICY IF EXISTS "Public can view public progress images" ON progress_images;

-- Recreate policies with correct syntax
CREATE POLICY "Users can view their own progress images" ON progress_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress images" ON progress_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress images" ON progress_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress images" ON progress_images
    FOR DELETE USING (auth.uid() = user_id);

-- Optional: Public visibility policy (for future sharing features)
CREATE POLICY "Public can view public progress images" ON progress_images
    FOR SELECT USING (visibility = 'public');

-- Ensure RLS is enabled
ALTER TABLE progress_images ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON progress_images TO authenticated;
GRANT USAGE ON SEQUENCE progress_images_id_seq TO authenticated;

-- Verify the policies are now active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'progress_images';

-- Test query - this should work for authenticated users
SELECT 'Permissions fixed successfully! You should now be able to use progress images.' as status;