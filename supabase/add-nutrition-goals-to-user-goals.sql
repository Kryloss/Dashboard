-- Migration: Add nutrition goal fields to user_goals table
-- This adds macro targets, water, fiber, and sodium tracking to user goals

-- Add nutrition-specific columns to user_goals table
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS macro_targets JSONB DEFAULT '{"carbs": 250, "protein": 150, "fats": 67}'::jsonb,
ADD COLUMN IF NOT EXISTS macro_percentages JSONB,
ADD COLUMN IF NOT EXISTS water_target INTEGER,
ADD COLUMN IF NOT EXISTS fiber_target INTEGER,
ADD COLUMN IF NOT EXISTS sodium_limit INTEGER;

-- Add comment to document the columns
COMMENT ON COLUMN user_goals.macro_targets IS 'Daily macro nutrient targets in grams (carbs, protein, fats)';
COMMENT ON COLUMN user_goals.macro_percentages IS 'Macro nutrient percentages (carbs%, protein%, fats%)';
COMMENT ON COLUMN user_goals.water_target IS 'Daily water intake target in milliliters';
COMMENT ON COLUMN user_goals.fiber_target IS 'Daily fiber intake target in grams';
COMMENT ON COLUMN user_goals.sodium_limit IS 'Daily sodium limit in milligrams';
