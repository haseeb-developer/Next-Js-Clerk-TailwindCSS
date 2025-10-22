-- Create user_id_numbers table to track sequential user IDs
CREATE TABLE IF NOT EXISTS user_id_numbers (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  user_id_number INTEGER UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_id_numbers_clerk_user_id ON user_id_numbers(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_id_numbers_user_id_number ON user_id_numbers(user_id_number);

-- Create function to get next user ID number
CREATE OR REPLACE FUNCTION get_next_user_id_number()
RETURNS INTEGER AS $$
DECLARE
  next_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(user_id_number), 0) + 1 INTO next_id FROM user_id_numbers;
  RETURN next_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get or create user ID number
CREATE OR REPLACE FUNCTION get_or_create_user_id_number(clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  existing_id INTEGER;
  new_id INTEGER;
BEGIN
  -- Check if user already has an ID
  SELECT user_id_number INTO existing_id 
  FROM user_id_numbers 
  WHERE clerk_user_id = clerk_id;
  
  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;
  
  -- Create new ID for user
  new_id := get_next_user_id_number();
  
  INSERT INTO user_id_numbers (clerk_user_id, user_id_number)
  VALUES (clerk_id, new_id)
  ON CONFLICT (clerk_user_id) DO NOTHING;
  
  -- Return the ID (either newly created or existing)
  SELECT user_id_number INTO existing_id 
  FROM user_id_numbers 
  WHERE clerk_user_id = clerk_id;
  
  RETURN existing_id;
END;
$$ LANGUAGE plpgsql;
