-- Enhanced Database Schema for Background Timer Functionality
-- This script adds the missing fields and optimizes the schema for background timer support

-- ============================================================================
-- STEP 1: ADD MISSING FIELDS TO ONGOING_WORKOUTS TABLE
-- ============================================================================

-- Add the missing workout_id field to ongoing_workouts table
ALTER TABLE public.ongoing_workouts 
ADD COLUMN IF NOT EXISTS workout_id TEXT;

-- Add the missing name field to ongoing_workouts table (for workout names)
ALTER TABLE public.ongoing_workouts 
ADD COLUMN IF NOT EXISTS name TEXT;

-- ============================================================================
-- STEP 2: UPDATE CONSTRAINTS AND INDEXES
-- ============================================================================

-- Update the unique constraint to include workout_id instead of just user_id and type
-- First drop the existing constraints
ALTER TABLE public.ongoing_workouts 
DROP CONSTRAINT IF EXISTS ongoing_workouts_user_id_type_key;

ALTER TABLE public.ongoing_workouts 
DROP CONSTRAINT IF EXISTS ongoing_workouts_user_workout_unique;

-- Add new unique constraint on user_id and workout_id
ALTER TABLE public.ongoing_workouts 
ADD CONSTRAINT ongoing_workouts_user_workout_unique 
UNIQUE(user_id, workout_id);

-- Create indexes for better performance on workout_id lookups
CREATE INDEX IF NOT EXISTS ongoing_workouts_workout_id_idx 
ON public.ongoing_workouts(workout_id);

-- Create index for user_id and workout_id combination
CREATE INDEX IF NOT EXISTS ongoing_workouts_user_workout_idx 
ON public.ongoing_workouts(user_id, workout_id);

-- Create index for is_running field to optimize background timer queries
CREATE INDEX IF NOT EXISTS ongoing_workouts_is_running_idx 
ON public.ongoing_workouts(is_running) WHERE is_running = true;

-- Create index for start_time to optimize elapsed time calculations
CREATE INDEX IF NOT EXISTS ongoing_workouts_start_time_idx 
ON public.ongoing_workouts(start_time);

-- ============================================================================
-- STEP 3: MIGRATE EXISTING DATA
-- ============================================================================

-- Update any existing records to have workout_id (if they don't have one)
-- This generates a workout_id based on type and timestamp for existing records
UPDATE public.ongoing_workouts 
SET workout_id = type || '-' || extract(epoch from created_at)::text || '-' || substring(id::text, 1, 8)
WHERE workout_id IS NULL;

-- Make workout_id NOT NULL after populating existing records
ALTER TABLE public.ongoing_workouts 
ALTER COLUMN workout_id SET NOT NULL;

-- ============================================================================
-- STEP 4: ADD BACKGROUND TIMER SUPPORT FUNCTIONS
-- ============================================================================

-- Function to get running workouts for background sync
CREATE OR REPLACE FUNCTION public.get_running_workouts()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    workout_id TEXT,
    type TEXT,
    name TEXT,
    start_time TIMESTAMPTZ,
    elapsed_time INTEGER,
    is_running BOOLEAN,
    exercises JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ow.id,
        ow.user_id,
        ow.workout_id,
        ow.type,
        ow.name,
        ow.start_time,
        ow.elapsed_time,
        ow.is_running,
        ow.exercises
    FROM public.ongoing_workouts ow
    WHERE ow.is_running = true
    ORDER BY ow.start_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update workout elapsed time (for background sync)
CREATE OR REPLACE FUNCTION public.update_workout_elapsed_time(
    target_workout_id TEXT,
    new_elapsed_time INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE public.ongoing_workouts 
    SET 
        elapsed_time = new_elapsed_time,
        updated_at = NOW()
    WHERE 
        workout_id = target_workout_id 
        AND user_id = auth.uid()
        AND is_running = true;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to stop workout timer (for manual stop/pause/reset)
CREATE OR REPLACE FUNCTION public.stop_workout_timer(
    target_workout_id TEXT,
    final_elapsed_time INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
    current_elapsed_time INTEGER;
BEGIN
    -- If final_elapsed_time is provided, use it; otherwise calculate from start_time
    IF final_elapsed_time IS NOT NULL THEN
        current_elapsed_time := final_elapsed_time;
    ELSE
        SELECT EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER
        INTO current_elapsed_time
        FROM public.ongoing_workouts
        WHERE workout_id = target_workout_id AND user_id = auth.uid();
    END IF;
    
    UPDATE public.ongoing_workouts 
    SET 
        elapsed_time = current_elapsed_time,
        is_running = false,
        updated_at = NOW()
    WHERE 
        workout_id = target_workout_id 
        AND user_id = auth.uid();
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resume workout timer
CREATE OR REPLACE FUNCTION public.resume_workout_timer(
    target_workout_id TEXT,
    current_elapsed_time INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
    new_start_time TIMESTAMPTZ;
BEGIN
    -- Calculate new start time based on current elapsed time
    new_start_time := NOW() - (current_elapsed_time || ' seconds')::INTERVAL;
    
    UPDATE public.ongoing_workouts 
    SET 
        start_time = new_start_time,
        elapsed_time = current_elapsed_time,
        is_running = true,
        updated_at = NOW()
    WHERE 
        workout_id = target_workout_id 
        AND user_id = auth.uid();
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions for the new functions
GRANT EXECUTE ON FUNCTION public.get_running_workouts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_workout_elapsed_time(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stop_workout_timer(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_workout_timer(TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- STEP 6: CREATE BACKGROUND TIMER CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up stale running workouts (workouts that have been running for too long)
CREATE OR REPLACE FUNCTION public.cleanup_stale_running_workouts()
RETURNS INTEGER AS $$
DECLARE
    updated_rows INTEGER;
    max_duration_hours INTEGER := 24; -- Consider workouts stale after 24 hours
BEGIN
    UPDATE public.ongoing_workouts 
    SET 
        is_running = false,
        updated_at = NOW()
    WHERE 
        is_running = true 
        AND start_time < NOW() - (max_duration_hours || ' hours')::INTERVAL;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_stale_running_workouts() TO authenticated;

-- ============================================================================
-- STEP 7: VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the schema is correct:

-- Check table structure:
-- \d public.ongoing_workouts

-- Check indexes:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ongoing_workouts';

-- Check constraints:
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'ongoing_workouts' AND table_schema = 'public';

-- Check functions:
-- SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%workout%';

-- Test the functions:
-- SELECT * FROM public.get_running_workouts();
-- SELECT public.update_workout_elapsed_time('test-workout-id', 120);
-- SELECT public.stop_workout_timer('test-workout-id', 180);
-- SELECT public.resume_workout_timer('test-workout-id', 180);

-- ============================================================================
-- STEP 8: OPTIONAL - SET UP AUTOMATIC CLEANUP
-- ============================================================================

-- Uncomment the following lines to set up automatic cleanup of stale workouts
-- This will run every hour to clean up workouts that have been running for more than 24 hours

-- CREATE OR REPLACE FUNCTION public.schedule_workout_cleanup()
-- RETURNS void AS $$
-- BEGIN
--     PERFORM public.cleanup_stale_running_workouts();
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Note: You would need to set up a cron job or scheduled function in Supabase
-- -- to call this function periodically
