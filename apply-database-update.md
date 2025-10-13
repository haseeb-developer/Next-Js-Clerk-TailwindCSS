# Database Update Instructions

## Quick Fix for Missing Snippets

Your snippets are likely still there, but the new soft delete feature requires a database schema update. Here's how to fix it:

### Option 1: Apply the Schema Update (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run this SQL command:

```sql
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
```

### Option 2: If You Don't Want Soft Delete Features

The app will automatically fall back to the old behavior (hard delete) if the schema isn't updated. Your snippets should appear normally.

### What Happened?

The new features I added require a `deleted_at` column in your database. Without it, the queries fail. I've now updated the code to:

1. **Automatically detect** if the new schema is available
2. **Fall back gracefully** to the old behavior if not
3. **Show your snippets** regardless of schema version
4. **Hide recycle bin** if soft delete isn't available

### After Applying the Update

- Your snippets will appear normally
- Delete will move snippets to recycle bin instead of permanent deletion
- Recycle bin button will appear
- All new features will work

### If You Still Don't See Snippets

1. Check the browser console for any error messages
2. Make sure you're logged in with the same account that created the snippets
3. Try refreshing the page

The app is now designed to work with both old and new database schemas!
