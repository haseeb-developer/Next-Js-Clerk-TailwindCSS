-- Password Management Database Schema

-- Create password_folders table
CREATE TABLE IF NOT EXISTS password_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_categories table
CREATE TABLE IF NOT EXISTS password_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#8B5CF6',
  icon VARCHAR(10) DEFAULT '🔐',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passwords table
CREATE TABLE IF NOT EXISTS passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password TEXT NOT NULL,
  website VARCHAR(500),
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  folder_id UUID REFERENCES password_folders(id) ON DELETE SET NULL,
  category_id UUID REFERENCES password_categories(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_passwords_folder_id ON passwords(folder_id);
CREATE INDEX IF NOT EXISTS idx_passwords_category_id ON passwords(category_id);
CREATE INDEX IF NOT EXISTS idx_passwords_is_deleted ON passwords(is_deleted);
CREATE INDEX IF NOT EXISTS idx_passwords_is_favorite ON passwords(is_favorite);
CREATE INDEX IF NOT EXISTS idx_passwords_title ON passwords(title);
CREATE INDEX IF NOT EXISTS idx_passwords_username ON passwords(username);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_password_folders_updated_at 
  BEFORE UPDATE ON password_folders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_categories_updated_at 
  BEFORE UPDATE ON password_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passwords_updated_at 
  BEFORE UPDATE ON passwords 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO password_folders (name, description, color) VALUES
  ('Work', 'Passwords for work-related accounts', '#3B82F6'),
  ('Personal', 'Personal accounts and services', '#10B981'),
  ('Social Media', 'Social media platform accounts', '#F59E0B'),
  ('Finance', 'Banking and financial services', '#EF4444'),
  ('Entertainment', 'Streaming and gaming platforms', '#8B5CF6')
ON CONFLICT DO NOTHING;

INSERT INTO password_categories (name, color, icon) VALUES
  ('Email', '#3B82F6', '📧'),
  ('Social', '#10B981', '👥'),
  ('Finance', '#EF4444', '💳'),
  ('Work', '#F59E0B', '💼'),
  ('Entertainment', '#8B5CF6', '🎮'),
  ('Shopping', '#EC4899', '🛒'),
  ('Gaming', '#06B6D4', '🎯'),
  ('Education', '#84CC16', '📚')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE password_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (you'll need to adjust these based on your auth setup)
-- For now, we'll create policies that allow all operations
-- In production, you should restrict these based on user authentication

CREATE POLICY "Allow all operations on password_folders" ON password_folders
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on password_categories" ON password_categories
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on passwords" ON passwords
  FOR ALL USING (true);
