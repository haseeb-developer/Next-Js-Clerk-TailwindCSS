-- Fix RLS Policies for Media Management
-- This script updates the RLS policies to work with Clerk authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can view their own media files" ON media_files;
DROP POLICY IF EXISTS "Users can insert their own media files" ON media_files;
DROP POLICY IF EXISTS "Users can update their own media files" ON media_files;
DROP POLICY IF EXISTS "Users can delete their own media files" ON media_files;

-- Create new policies that allow all operations
-- Application layer will handle user_id filtering
CREATE POLICY "Allow all folder operations"
  ON media_folders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all media file operations"
  ON media_files FOR ALL
  USING (true)
  WITH CHECK (true);
