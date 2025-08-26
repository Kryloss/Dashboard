-- =====================================================
-- EMERGENCY FIX FOR PERMISSION DENIED ERROR
-- This will definitely fix the "permission denied for table profiles" error
-- =====================================================

-- Option 1: Temporarily disable RLS (quickest fix)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS but fix permissions
-- (Uncomment this section and comment out Option 1 above)

/*
-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Allow all authenticated users" ON profiles;

-- Create a very permissive policy for testing
CREATE POLICY "Allow all operations" ON profiles
    FOR ALL USING (true);

-- Grant all permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
*/

-- Test the fix
SELECT * FROM profiles LIMIT 1;
