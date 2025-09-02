-- Fix for ongoing_workouts table to add missing workout_id field
-- This addresses the schema mismatch between the application code and database

-- Add the missing workout_id field to ongoing_workouts table
ALTER TABLE public.ongoing_workouts 
ADD COLUMN IF NOT EXISTS workout_id TEXT;

-- Add the missing name field to ongoing_workouts table (for workout names)
ALTER TABLE public.ongoing_workouts 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update the unique constraint to include workout_id instead of just user_id and type
-- First drop the existing constraint
ALTER TABLE public.ongoing_workouts 
DROP CONSTRAINT IF EXISTS ongoing_workouts_user_id_type_key;

-- Add new unique constraint on user_id and workout_id
ALTER TABLE public.ongoing_workouts 
ADD CONSTRAINT ongoing_workouts_user_workout_unique 
UNIQUE(user_id, workout_id);

-- Create index for better performance on workout_id lookups
CREATE INDEX IF NOT EXISTS ongoing_workouts_workout_id_idx 
ON public.ongoing_workouts(workout_id);

-- Create index for user_id and workout_id combination
CREATE INDEX IF NOT EXISTS ongoing_workouts_user_workout_idx 
ON public.ongoing_workouts(user_id, workout_id);

-- Update any existing records to have workout_id (if they don't have one)
-- This generates a workout_id based on type and timestamp for existing records
UPDATE public.ongoing_workouts 
SET workout_id = type || '-' || extract(epoch from created_at)::text || '-' || substring(id::text, 1, 8)
WHERE workout_id IS NULL;

-- Make workout_id NOT NULL after populating existing records
ALTER TABLE public.ongoing_workouts 
ALTER COLUMN workout_id SET NOT NULL;

-- Verification queries (run these to check the schema):
-- \d public.ongoing_workouts
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'ongoing_workouts' AND table_schema = 'public';
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'ongoing_workouts' AND table_schema = 'public';
