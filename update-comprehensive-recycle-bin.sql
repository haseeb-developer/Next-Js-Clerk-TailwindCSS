-- Comprehensive Recycle Bin System - Database Updates
-- This script adds soft delete functionality for folders and categories

-- 1. Add deleted_at column to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- 2. Add deleted_at column to categories table  
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- 3. Create indexes for better performance on non-deleted folders and categories
CREATE INDEX IF NOT EXISTS idx_folders_user_id_deleted_at ON folders(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_user_id_deleted_at ON categories(user_id, deleted_at);

-- 4. Update existing policies to exclude soft-deleted folders
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;

-- Create new policies that handle soft deletes for folders
CREATE POLICY "Users can view their own non-deleted folders" ON folders
  FOR SELECT USING (auth.uid()::text = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own non-deleted folders" ON folders
  FOR UPDATE USING (auth.uid()::text = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete their own folders" ON folders
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policy for viewing deleted folders (for recycle bin)
CREATE POLICY "Users can view their own deleted folders" ON folders
  FOR SELECT USING (auth.uid()::text = user_id AND deleted_at IS NOT NULL);

-- 5. Update existing policies to exclude soft-deleted categories
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- Create new policies that handle soft deletes for categories
CREATE POLICY "Users can view their own non-deleted categories" ON categories
  FOR SELECT USING (auth.uid()::text = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own non-deleted categories" ON categories
  FOR UPDATE USING (auth.uid()::text = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete their own categories" ON categories
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policy for viewing deleted categories (for recycle bin)
CREATE POLICY "Users can view their own deleted categories" ON categories
  FOR SELECT USING (auth.uid()::text = user_id AND deleted_at IS NOT NULL);

-- 6. Update snippets policies to handle folder/category relationships properly
-- When a folder or category is deleted, snippets should still be accessible
-- but show "No folder found" or "No category found" in the UI

-- Update snippet policies to allow viewing snippets even if their folder/category is deleted
DROP POLICY IF EXISTS "Users can view their own snippets" ON snippets;
CREATE POLICY "Users can view their own snippets" ON snippets
  FOR SELECT USING (auth.uid()::text = user_id);

-- 7. Create function to handle folder deletion with snippet relationships
CREATE OR REPLACE FUNCTION handle_folder_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- When a folder is soft deleted, we don't need to do anything special
    -- The snippets will remain with their folder_id intact
    -- The UI will show "No folder found" for deleted folders
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create function to handle category deletion with snippet relationships  
CREATE OR REPLACE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- When a category is soft deleted, we don't need to do anything special
    -- The snippets will remain with their category_id intact
    -- The UI will show "No category found" for deleted categories
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for folder and category soft deletion
CREATE TRIGGER folder_soft_delete_trigger
    BEFORE UPDATE ON folders
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION handle_folder_deletion();

CREATE TRIGGER category_soft_delete_trigger
    BEFORE UPDATE ON categories
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION handle_category_deletion();

-- 10. Create function to restore folder and its relationships
CREATE OR REPLACE FUNCTION restore_folder(folder_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE folders 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = folder_uuid AND deleted_at IS NOT NULL;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- 11. Create function to restore category and its relationships
CREATE OR REPLACE FUNCTION restore_category(category_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE categories 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = category_uuid AND deleted_at IS NOT NULL;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- 12. Create function to permanently delete folder and unlink snippets
CREATE OR REPLACE FUNCTION permanently_delete_folder(folder_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- First, unlink all snippets from this folder
    UPDATE snippets 
    SET folder_id = NULL, updated_at = NOW()
    WHERE folder_id = folder_uuid;
    
    -- Then permanently delete the folder
    DELETE FROM folders WHERE id = folder_uuid;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- 13. Create function to permanently delete category and unlink snippets
CREATE OR REPLACE FUNCTION permanently_delete_category(category_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- First, unlink all snippets from this category
    UPDATE snippets 
    SET category_id = NULL, updated_at = NOW()
    WHERE category_id = category_uuid;
    
    -- Then permanently delete the category
    DELETE FROM categories WHERE id = category_uuid;
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- 14. Grant necessary permissions
GRANT EXECUTE ON FUNCTION restore_folder(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_category(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_folder(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_category(UUID) TO authenticated;

-- 15. Create views for easier querying of deleted items with snippet counts

-- View for deleted folders with snippet counts
CREATE OR REPLACE VIEW deleted_folders_with_counts AS
SELECT 
    f.*,
    COALESCE(s.snippet_count, 0) as snippet_count
FROM folders f
LEFT JOIN (
    SELECT 
        folder_id, 
        COUNT(*) as snippet_count
    FROM snippets 
    WHERE deleted_at IS NULL  -- Only count non-deleted snippets
    GROUP BY folder_id
) s ON f.id = s.folder_id
WHERE f.deleted_at IS NOT NULL
ORDER BY f.deleted_at DESC;

-- View for deleted categories with snippet counts
CREATE OR REPLACE VIEW deleted_categories_with_counts AS
SELECT 
    c.*,
    COALESCE(s.snippet_count, 0) as snippet_count
FROM categories c
LEFT JOIN (
    SELECT 
        category_id, 
        COUNT(*) as snippet_count
    FROM snippets 
    WHERE deleted_at IS NULL  -- Only count non-deleted snippets
    GROUP BY category_id
) s ON c.id = s.category_id
WHERE c.deleted_at IS NOT NULL
ORDER BY c.deleted_at DESC;

-- Grant permissions on views
GRANT SELECT ON deleted_folders_with_counts TO authenticated;
GRANT SELECT ON deleted_categories_with_counts TO authenticated;

-- Success message
SELECT 'Comprehensive Recycle Bin system setup completed successfully!' as status;
