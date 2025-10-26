-- Disable RLS on media tables to allow operations with Clerk
-- Run this in your Supabase SQL Editor

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow all folder operations" ON media_folders;
DROP POLICY IF EXISTS "Users can view their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON media_folders;

DROP POLICY IF EXISTS "Allow all media file operations" ON media_files;
DROP POLICY IF EXISTS "Users can view their own media files" ON media_files;
DROP POLICY IF EXISTS "Users can insert their own media files" ON media_files;
DROP POLICY IF EXISTS "Users can update their own media files" ON media_files;
DROP POLICY IF EXISTS "Users can delete their own media files" ON media_files;

-- Disable RLS completely
ALTER TABLE media_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE media_files DISABLE ROW LEVEL SECURITY;
