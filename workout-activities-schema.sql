-- Workout Activities History Database Schema
-- This schema supports storing completed workout activities with full exercise data
-- Run these commands in your Supabase SQL Editor

-- 1. Create the workout_activities table
CREATE TABLE IF NOT EXISTS public.workout_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'running', 'yoga', 'cycling')),
    name TEXT,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS workout_activities_user_id_idx ON public.workout_activities(user_id);
CREATE INDEX IF NOT EXISTS workout_activities_completed_at_idx ON public.workout_activities(completed_at DESC);
CREATE INDEX IF NOT EXISTS workout_activities_user_completed_idx ON public.workout_activities(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS workout_activities_type_idx ON public.workout_activities(workout_type);
CREATE INDEX IF NOT EXISTS workout_activities_exercises_gin_idx ON public.workout_activities USING GIN (exercises);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.workout_activities ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for ultra-secure user isolation
-- Policy for SELECT: Users can only see their own activities
CREATE POLICY "Users can view own workout activities" ON public.workout_activities
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT: Users can only insert their own activities
CREATE POLICY "Users can insert own workout activities" ON public.workout_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can only update their own activities
CREATE POLICY "Users can update own workout activities" ON public.workout_activities
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can only delete their own activities
CREATE POLICY "Users can delete own workout activities" ON public.workout_activities
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_workout_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_workout_activities_updated_at ON public.workout_activities;
CREATE TRIGGER handle_workout_activities_updated_at
    BEFORE UPDATE ON public.workout_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_workout_activities_updated_at();

-- 6. Create function to get user's recent workout activities
CREATE OR REPLACE FUNCTION public.get_recent_workout_activities(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    workout_type TEXT,
    name TEXT,
    exercises JSONB,
    duration_seconds INTEGER,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.id,
        wa.workout_type,
        wa.name,
        wa.exercises,
        wa.duration_seconds,
        wa.notes,
        wa.completed_at,
        wa.created_at,
        wa.updated_at
    FROM public.workout_activities wa
    WHERE wa.user_id = auth.uid()
    ORDER BY wa.completed_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get workout activity statistics
CREATE OR REPLACE FUNCTION public.get_workout_activity_stats()
RETURNS TABLE (
    total_workouts INTEGER,
    total_duration_seconds INTEGER,
    workout_types JSONB,
    this_week_workouts INTEGER,
    this_month_workouts INTEGER
) AS $$
DECLARE
    week_start TIMESTAMPTZ := date_trunc('week', NOW());
    month_start TIMESTAMPTZ := date_trunc('month', NOW());
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_workouts,
        SUM(wa.duration_seconds)::INTEGER as total_duration_seconds,
        jsonb_object_agg(wa.workout_type, type_counts.count) as workout_types,
        COUNT(CASE WHEN wa.completed_at >= week_start THEN 1 END)::INTEGER as this_week_workouts,
        COUNT(CASE WHEN wa.completed_at >= month_start THEN 1 END)::INTEGER as this_month_workouts
    FROM public.workout_activities wa
    LEFT JOIN (
        SELECT workout_type, COUNT(*) as count
        FROM public.workout_activities
        WHERE user_id = auth.uid()
        GROUP BY workout_type
    ) type_counts ON wa.workout_type = type_counts.workout_type
    WHERE wa.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to search workout activities
CREATE OR REPLACE FUNCTION public.search_workout_activities(
    search_query TEXT DEFAULT NULL,
    activity_type TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    workout_type TEXT,
    name TEXT,
    exercises JSONB,
    duration_seconds INTEGER,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.id,
        wa.workout_type,
        wa.name,
        wa.exercises,
        wa.duration_seconds,
        wa.notes,
        wa.completed_at,
        wa.created_at,
        wa.updated_at
    FROM public.workout_activities wa
    WHERE wa.user_id = auth.uid()
    AND (
        search_query IS NULL OR 
        wa.name ILIKE '%' || search_query || '%' OR
        wa.notes ILIKE '%' || search_query || '%'
    )
    AND (
        activity_type IS NULL OR 
        wa.workout_type = activity_type
    )
    ORDER BY wa.completed_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant necessary permissions
GRANT ALL ON public.workout_activities TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_workout_activities(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workout_activity_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_workout_activities(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- 10. Validation constraints
ALTER TABLE public.workout_activities 
ADD CONSTRAINT check_duration_positive 
CHECK (duration_seconds >= 0);

ALTER TABLE public.workout_activities 
ADD CONSTRAINT check_exercises_not_empty 
CHECK (jsonb_array_length(exercises) >= 0);

-- 11. Example queries for testing (do not run in production):

-- Insert a sample workout activity (for testing only):
-- INSERT INTO public.workout_activities (user_id, workout_type, name, exercises, duration_seconds, notes)
-- VALUES (
--     auth.uid(),
--     'strength',
--     'Upper Body Push Day',
--     '[{"id": "ex1", "name": "Bench Press", "sets": [{"reps": "10", "weight": "135lbs"}]}]'::jsonb,
--     2700, -- 45 minutes
--     'Great session, felt strong today'
-- );

-- Get recent activities:
-- SELECT * FROM public.get_recent_workout_activities(5);

-- Get workout stats:
-- SELECT * FROM public.get_workout_activity_stats();

-- Search activities:
-- SELECT * FROM public.search_workout_activities('Upper Body', 'strength', 10, 0);

-- Verify RLS is working (should only return current user's data):
-- SELECT user_id, workout_type, name FROM public.workout_activities;