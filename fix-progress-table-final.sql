-- Complete Fix for Progress Images Table
-- Run this in your Supabase SQL Editor

-- First, drop the existing table if it has issues
DROP TABLE IF EXISTS progress_images CASCADE;

-- Recreate the table with proper UUID primary key (no sequence needed)
CREATE TABLE progress_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) DEFAULT 'progress' CHECK (image_type IN ('progress', 'before', 'after', 'current')),
    title TEXT,
    notes TEXT,
    weight_kg DECIMAL(5,2), -- Optional weight at time of photo (e.g., 85.50)
    visibility VARCHAR(10) DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_progress_images_user_id ON progress_images(user_id);
CREATE INDEX idx_progress_images_created_at ON progress_images(created_at DESC);
CREATE INDEX idx_progress_images_image_type ON progress_images(image_type);
CREATE INDEX idx_progress_images_visibility ON progress_images(visibility);

-- Enable Row Level Security
ALTER TABLE progress_images ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users (UUID primary keys don't need sequence grants)
GRANT ALL ON progress_images TO authenticated;

-- Create RLS policies
CREATE POLICY "Users can view their own progress images" ON progress_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress images" ON progress_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress images" ON progress_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress images" ON progress_images
    FOR DELETE USING (auth.uid() = user_id);

-- Optional: Public visibility policy
CREATE POLICY "Public can view public progress images" ON progress_images
    FOR SELECT USING (visibility = 'public');

-- Create or ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'progress-images',
    'progress-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload their own progress images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own progress images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to progress images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own progress images" ON storage.objects;

CREATE POLICY "Users can upload their own progress images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'progress-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own progress images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'progress-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Public read access to progress images" ON storage.objects
    FOR SELECT USING (bucket_id = 'progress-images');

CREATE POLICY "Users can delete their own progress images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'progress-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create function for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to auto-update updated_at on progress_images
DROP TRIGGER IF EXISTS update_progress_images_updated_at ON progress_images;
CREATE TRIGGER update_progress_images_updated_at 
    BEFORE UPDATE ON progress_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verification queries
SELECT 'Table created successfully' as status;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'progress_images' 
ORDER BY ordinal_position;

SELECT * FROM storage.buckets WHERE id = 'progress-images';

SELECT 'Setup completed successfully! 🎉' as final_status;