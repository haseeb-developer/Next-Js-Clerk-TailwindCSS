-- Update the default icon value for the media_folders table
ALTER TABLE media_folders ALTER COLUMN icon SET DEFAULT 'folder';

-- Update any existing rows that have the old emoji icon to use 'folder'
UPDATE media_folders SET icon = 'folder' WHERE icon = '📁';
