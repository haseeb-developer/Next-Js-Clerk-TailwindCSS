-- Fix media_files foreign key constraint
-- This drops the old constraint pointing to 'categories' and adds a new one pointing to 'media_categories'

-- Drop the old foreign key constraint if it exists
ALTER TABLE media_files 
DROP CONSTRAINT IF EXISTS media_files_category_id_fkey;

-- Add the new foreign key constraint pointing to media_categories
ALTER TABLE media_files 
ADD CONSTRAINT media_files_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES media_categories(id) ON DELETE SET NULL;
