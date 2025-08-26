-- =====================================================
-- SIMPLE FIX FOR OAUTH AUTHENTICATION ERROR
-- Run these commands one by one in your Supabase SQL editor
-- =====================================================

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Check if profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
);

-- Step 3: If profiles table doesn't exist or has issues, create it
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create basic RLS policy (allow authenticated users to manage their own profile)
CREATE POLICY "Users can manage own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Step 6: Grant permissions
GRANT ALL ON profiles TO authenticated;

-- Step 7: Test the setup
SELECT * FROM profiles LIMIT 1;
