-- Check and fix media_files foreign key constraint
-- This script will identify and fix the foreign key issue

-- First, let's see what constraints exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name='media_files' 
  AND tc.constraint_type='FOREIGN KEY'
  AND tc.constraint_name LIKE '%category%';

-- Now drop ALL foreign key constraints related to category_id (both old and new)
ALTER TABLE media_files DROP CONSTRAINT IF EXISTS media_files_category_id_fkey;
ALTER TABLE media_files DROP CONSTRAINT IF EXISTS media_files_category_id_fkey1;

-- Clean up any invalid category_id values
UPDATE media_files
SET category_id = NULL
WHERE category_id IS NOT NULL
AND category_id NOT IN (SELECT id FROM media_categories);

-- Add the correct foreign key constraint pointing to media_categories
ALTER TABLE media_files 
ADD CONSTRAINT media_files_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES media_categories(id) ON DELETE SET NULL;
