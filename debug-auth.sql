-- Debug authentication and permissions
-- Run this to check your current authentication status

-- Check if you're authenticated
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- Check table permissions
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    hasinserts,
    hasupdates,
    hasdeletes,
    hasselects
FROM pg_tables 
WHERE tablename = 'progress_images';

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'progress_images';

-- List all policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'progress_images';