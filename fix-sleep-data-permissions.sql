-- Fix sleep_data table permissions and setup
-- Run this in your Supabase SQL Editor

-- 1. First, check if the table exists and drop if it has issues
DROP TABLE IF EXISTS sleep_data CASCADE;

-- 2. Create the sleep_data table with proper structure
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

    -- Ensure one sleep record per user per date
    UNIQUE(user_id, date)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sleep_data_user_id ON sleep_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_data_date ON sleep_data(date);
CREATE INDEX IF NOT EXISTS idx_sleep_data_user_date ON sleep_data(user_id, date);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE sleep_data ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own sleep data" ON sleep_data;
DROP POLICY IF EXISTS "Users can insert their own sleep data" ON sleep_data;
DROP POLICY IF EXISTS "Users can update their own sleep data" ON sleep_data;
DROP POLICY IF EXISTS "Users can delete their own sleep data" ON sleep_data;

-- 6. Create comprehensive RLS policies
CREATE POLICY "Users can view their own sleep data" ON sleep_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep data" ON sleep_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep data" ON sleep_data
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep data" ON sleep_data
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON sleep_data TO authenticated;

-- 8. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sleep_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_sleep_data_updated_at_trigger ON sleep_data;
CREATE TRIGGER update_sleep_data_updated_at_trigger
    BEFORE UPDATE ON sleep_data
    FOR EACH ROW
    EXECUTE FUNCTION update_sleep_data_updated_at();

-- 10. Verify table creation and permissions
SELECT
    'sleep_data table created successfully' as status,
    COUNT(*) as initial_record_count
FROM sleep_data;

-- 11. Test RLS policies (this should work for authenticated users)
-- SELECT * FROM sleep_data WHERE user_id = auth.uid();

-- 12. Check table structure
\d sleep_data;

-- 13. Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sleep_data';

-- 14. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sleep_data';
