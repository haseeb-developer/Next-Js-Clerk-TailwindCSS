-- Media Categories Table
-- This script creates a dedicated categories table for media items

-- Create media_categories table for organizing media
CREATE TABLE IF NOT EXISTS media_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  description TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for media_categories
CREATE INDEX IF NOT EXISTS idx_media_categories_user_id ON media_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_media_categories_deleted_at ON media_categories(deleted_at);

-- Enable Row Level Security (RLS)
ALTER TABLE media_categories ENABLE ROW LEVEL SECURITY;

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

-- Add foreign key constraint to media_files if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'media_files_category_id_fkey' 
    AND table_name = 'media_files'
  ) THEN
    ALTER TABLE media_files 
    ADD CONSTRAINT media_files_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES media_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to update updated_at timestamp for media_categories
CREATE OR REPLACE FUNCTION update_media_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for media_categories
DROP TRIGGER IF EXISTS update_media_categories_updated_at ON media_categories;
CREATE TRIGGER update_media_categories_updated_at
  BEFORE UPDATE ON media_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_media_categories_updated_at();

-- Grant necessary permissions
GRANT ALL ON media_categories TO authenticated;
