-- User Profiles and Goals Database Setup for Workout App
-- Copy and paste this SQL into your Supabase SQL Editor

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    weight DECIMAL(5,1), -- e.g., 70.5 kg or 155.2 lbs
    age INTEGER,
    height DECIMAL(5,1), -- e.g., 175.5 cm or 5.9 ft
    weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs')) DEFAULT 'kg',
    height_unit TEXT CHECK (height_unit IN ('cm', 'ft')) DEFAULT 'cm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    daily_exercise_minutes INTEGER DEFAULT 30,
    weekly_exercise_sessions INTEGER DEFAULT 3,
    daily_calories INTEGER DEFAULT 2000,
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'extra')) DEFAULT 'moderate',
    sleep_hours DECIMAL(3,1) DEFAULT 8.0, -- e.g., 8.5 hours
    recovery_minutes INTEGER DEFAULT 60,
    starting_weight DECIMAL(5,1), -- Current/starting weight
    goal_weight DECIMAL(5,1), -- Target weight
    diet_type TEXT CHECK (diet_type IN ('cutting', 'bulking', 'maintenance')) DEFAULT 'maintenance',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Optimize queries by user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- User goals policies
CREATE POLICY "Users can view their own goals" ON user_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON user_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON user_goals
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables that need updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- You can run this query to verify the setup worked:
-- SELECT 'User profiles and goals setup complete!' as status;
-- SELECT COUNT(*) as profiles_count FROM user_profiles;
-- SELECT COUNT(*) as goals_count FROM user_goals;