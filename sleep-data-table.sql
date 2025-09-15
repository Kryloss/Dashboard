-- Sleep data table creation for sleep tracking functionality
-- Run this in Supabase SQL Editor

-- Create sleep_data table
CREATE TABLE IF NOT EXISTS sleep_data (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sleep_data_user_id ON sleep_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_data_date ON sleep_data(date);
CREATE INDEX IF NOT EXISTS idx_sleep_data_user_date ON sleep_data(user_id, date);

-- Enable RLS (Row Level Security)
ALTER TABLE sleep_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sleep data" ON sleep_data;
DROP POLICY IF EXISTS "Users can insert their own sleep data" ON sleep_data;
DROP POLICY IF EXISTS "Users can update their own sleep data" ON sleep_data;
DROP POLICY IF EXISTS "Users can delete their own sleep data" ON sleep_data;

-- Create RLS policies for sleep_data
CREATE POLICY "Users can view their own sleep data" ON sleep_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep data" ON sleep_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep data" ON sleep_data
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep data" ON sleep_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sleep_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_sleep_data_updated_at_trigger ON sleep_data;
CREATE TRIGGER update_sleep_data_updated_at_trigger
    BEFORE UPDATE ON sleep_data
    FOR EACH ROW
    EXECUTE FUNCTION update_sleep_data_updated_at();

-- Verify table creation
SELECT
    'sleep_data table created successfully' as status,
    COUNT(*) as initial_record_count
FROM sleep_data;

-- Show table structure
\d sleep_data;