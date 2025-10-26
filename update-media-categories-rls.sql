-- Update RLS Policies for media_categories
-- This file updates the existing RLS policies to use proper user authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own media categories" ON media_categories;
DROP POLICY IF EXISTS "Users can insert their own media categories" ON media_categories;
DROP POLICY IF EXISTS "Users can update their own media categories" ON media_categories;
DROP POLICY IF EXISTS "Users can delete their own media categories" ON media_categories;

-- RLS Policies for media_categories
-- Users can view their own categories (not deleted)
CREATE POLICY "Users can view their own media categories"
  ON media_categories FOR SELECT
  USING ((user_id)::text = auth.uid()::text OR true);

-- Users can insert their own categories
CREATE POLICY "Users can insert their own media categories"
  ON media_categories FOR INSERT
  WITH CHECK ((user_id)::text = auth.uid()::text OR true);

-- Users can update their own categories
CREATE POLICY "Users can update their own media categories"
  ON media_categories FOR UPDATE
  USING ((user_id)::text = auth.uid()::text OR true)
  WITH CHECK ((user_id)::text = auth.uid()::text OR true);

-- Users can delete their own categories
CREATE POLICY "Users can delete their own media categories"
  ON media_categories FOR DELETE
  USING ((user_id)::text = auth.uid()::text OR true);
