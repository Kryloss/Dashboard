-- Emergency fix for sleep_data permissions
-- Run this in your Supabase SQL Editor to fix the permission issue

-- Step 1: Check if table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'sleep_data';

-- Step 2: Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sleep_data';

-- Step 3: Check current policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sleep_data';

-- Step 4: If table doesn't exist or has issues, recreate it
DROP TABLE IF EXISTS sleep_data CASCADE;

CREATE TABLE sleep_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
    quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
    total_minutes INTEGER NOT NULL DEFAULT 0,
    total_wake_ups INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Step 5: Enable RLS
ALTER TABLE sleep_data ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant permissions to authenticated role
GRANT ALL ON sleep_data TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 7: Create policies
CREATE POLICY "Enable all for authenticated users" ON sleep_data
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 8: Verify everything is set up correctly
SELECT 'Table created' as status;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'sleep_data';
SELECT policyname FROM pg_policies WHERE tablename = 'sleep_data';

-- Step 9: Test with a simple query (should work for authenticated users)
-- SELECT COUNT(*) FROM sleep_data WHERE user_id = auth.uid();
