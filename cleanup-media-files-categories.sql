-- Clean up media_files category_id values
-- This sets any category_id that doesn't exist in media_categories to NULL

UPDATE media_files
SET category_id = NULL
WHERE category_id IS NOT NULL
AND category_id NOT IN (SELECT id FROM media_categories);
