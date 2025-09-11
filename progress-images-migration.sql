-- Progress Images Table and Storage Setup
-- Run this in your Supabase SQL editor
-- 
-- Features:
-- - Progress image history tracking with metadata
-- - 5MB file size limit for high-quality progress photos
-- - Privacy controls (private/public visibility)
-- - Optional weight tracking per image
-- - Secure user-specific access policies
-- - Integration with existing avatar system

-- ================================
-- STEP 1: Create progress_images table
-- ================================

CREATE TABLE IF NOT EXISTS progress_images (
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
CREATE INDEX IF NOT EXISTS idx_progress_images_user_id ON progress_images(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_images_created_at ON progress_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_images_image_type ON progress_images(image_type);
CREATE INDEX IF NOT EXISTS idx_progress_images_visibility ON progress_images(visibility);

-- ================================
-- STEP 2: Enable Row Level Security
-- ================================

ALTER TABLE progress_images ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress images
CREATE POLICY "Users can view their own progress images" ON progress_images
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own progress images  
CREATE POLICY "Users can insert their own progress images" ON progress_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress images
CREATE POLICY "Users can update their own progress images" ON progress_images
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own progress images
CREATE POLICY "Users can delete their own progress images" ON progress_images
    FOR DELETE USING (auth.uid() = user_id);

-- Optional: Public visibility policy (for future sharing features)
CREATE POLICY "Public can view public progress images" ON progress_images
    FOR SELECT USING (visibility = 'public');

-- ================================
-- STEP 3: Create storage bucket for progress images
-- ================================

-- Create the progress-images storage bucket (5MB limit for high-quality photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'progress-images',
    'progress-images',
    true,
    5242880, -- 5MB limit (higher than avatars for detailed progress photos)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- ================================
-- STEP 4: Storage policies for progress images
-- ================================

-- Users can upload their own progress images
-- Note: The filename must start with the user's ID for the policy to work
CREATE POLICY "Users can upload their own progress images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'progress-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own progress images
CREATE POLICY "Users can update their own progress images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'progress-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Public read access to progress images (respects individual privacy settings via app logic)
CREATE POLICY "Public read access to progress images" ON storage.objects
    FOR SELECT USING (bucket_id = 'progress-images');

-- Users can delete their own progress images
CREATE POLICY "Users can delete their own progress images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'progress-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ================================
-- STEP 5: Create function to auto-update updated_at timestamp
-- ================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to auto-update updated_at on progress_images
CREATE TRIGGER update_progress_images_updated_at 
    BEFORE UPDATE ON progress_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Verify table was created successfully
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'progress_images' 
ORDER BY ordinal_position;

-- Verify RLS policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'progress_images';

-- Verify storage bucket was created
SELECT * FROM storage.buckets WHERE id = 'progress-images';

-- Verify storage policies are active  
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%progress%';

-- Success message
SELECT 'Progress images setup completed successfully! 🎉' as status;