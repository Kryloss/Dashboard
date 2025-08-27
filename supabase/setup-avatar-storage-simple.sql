-- Simple Avatar Storage Setup (Alternative)
-- Use this if you encounter policy creation issues
-- Run this in your Supabase SQL editor

-- Create the avatars storage bucket with basic settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    1048576, -- 1MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Note: This creates a public bucket that anyone can access
-- For production use, you should implement the full policy setup
-- or use the main setup-avatar-storage.sql script
