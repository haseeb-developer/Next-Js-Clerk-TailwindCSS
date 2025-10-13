-- Fix the user_id column to accept Clerk user IDs (which are strings, not UUIDs)
ALTER TABLE snippets ALTER COLUMN user_id TYPE TEXT;

-- Update the foreign key reference to use TEXT instead of UUID
ALTER TABLE snippets DROP CONSTRAINT IF EXISTS snippets_user_id_fkey;

-- Create a new policy that works with TEXT user_id
DROP POLICY IF EXISTS "Users can view their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can insert their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can update their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can delete their own snippets" ON snippets;

-- Create new policies for TEXT user_id
CREATE POLICY "Users can view their own snippets" ON snippets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own snippets" ON snippets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own snippets" ON snippets
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own snippets" ON snippets
  FOR DELETE USING (auth.uid()::text = user_id);
