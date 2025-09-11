-- Quick test to check if progress_images table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'progress_images'
) as table_exists;

-- If table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'progress_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if storage bucket exists
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'progress-images';