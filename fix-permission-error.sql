-- =====================================================
-- FIX FOR PERMISSION DENIED ERROR (42501)
-- "permission denied for table profiles"
-- =====================================================

-- Step 1: Check current RLS status and policies
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
WHERE tablename = 'profiles';

-- Step 2: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 3: Check current permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- Step 4: Fix RLS policies - Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

-- Step 5: Create a simple, permissive RLS policy for testing
CREATE POLICY "Allow all authenticated users" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Grant explicit permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Step 7: If you want more restrictive policies later, use these instead:
-- (Comment out the simple policy above and uncomment these)

/*
-- More restrictive policies (uncomment after testing)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);
*/

-- Step 8: Test the fix
SELECT * FROM profiles LIMIT 1;
