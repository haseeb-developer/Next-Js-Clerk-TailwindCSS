-- Add deleted_at column for soft delete functionality
ALTER TABLE snippets ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for better performance on non-deleted snippets
CREATE INDEX idx_snippets_user_id_deleted_at ON snippets(user_id, deleted_at);

-- Update existing policies to exclude soft-deleted snippets
DROP POLICY IF EXISTS "Users can view their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can insert their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can update their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can delete their own snippets" ON snippets;

-- Create new policies that handle soft deletes
CREATE POLICY "Users can view their own non-deleted snippets" ON snippets
  FOR SELECT USING (auth.uid()::text = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own snippets" ON snippets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own non-deleted snippets" ON snippets
  FOR UPDATE USING (auth.uid()::text = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete their own snippets" ON snippets
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policy for viewing deleted snippets (for recycle bin)
CREATE POLICY "Users can view their own deleted snippets" ON snippets
  FOR SELECT USING (auth.uid()::text = user_id AND deleted_at IS NOT NULL);
