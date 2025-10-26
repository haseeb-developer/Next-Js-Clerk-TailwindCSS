-- Media Management Tables
-- This script creates tables for managing user's images and videos with folders and categories

-- Create media_folders table for organizing media into folders
CREATE TABLE IF NOT EXISTS media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media_files table for storing image and video metadata
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- Duration in seconds for videos
  description TEXT,
  tags TEXT[],
  media_folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_folders_user_id ON media_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_deleted_at ON media_folders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_media_folder_id ON media_files(media_folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_category_id ON media_files(category_id);
CREATE INDEX IF NOT EXISTS idx_media_files_is_favorite ON media_files(is_favorite);
CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at ON media_files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_folders
-- Users can view their own folders (not deleted)
CREATE POLICY "Users can view their own folders"
  ON media_folders FOR SELECT
  USING (true);  -- Allow all reads, filtering by user_id in application

-- Users can insert their own folders
CREATE POLICY "Users can insert their own folders"
  ON media_folders FOR INSERT
  WITH CHECK (true);  -- Allow all inserts, application validates user_id

-- Users can update their own folders
CREATE POLICY "Users can update their own folders"
  ON media_folders FOR UPDATE
  USING (true);  -- Allow all updates, application validates user_id

-- Users can delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON media_folders FOR DELETE
  USING (true);  -- Allow all deletes, application validates user_id

-- RLS Policies for media_files
-- Users can view their own media files (not deleted)
CREATE POLICY "Users can view their own media files"
  ON media_files FOR SELECT
  USING (true);  -- Allow all reads, filtering by user_id in application

-- Users can insert their own media files
CREATE POLICY "Users can insert their own media files"
  ON media_files FOR INSERT
  WITH CHECK (true);  -- Allow all inserts, application validates user_id

-- Users can update their own media files
CREATE POLICY "Users can update their own media files"
  ON media_files FOR UPDATE
  USING (true);  -- Allow all updates, application validates user_id

-- Users can delete their own media files
CREATE POLICY "Users can delete their own media files"
  ON media_files FOR DELETE
  USING (true);  -- Allow all deletes, application validates user_id

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_media_folders_updated_at
  BEFORE UPDATE ON media_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

-- Grant necessary permissions
GRANT ALL ON media_folders TO authenticated;
GRANT ALL ON media_files TO authenticated;
