# Setup Media Storage Bucket

## Step 1: Create the Storage Bucket

1. Go to your **Supabase Dashboard**
2. Click on **"Storage"** in the left sidebar
3. Click the **"New bucket"** button
4. Enter the bucket name: `media` (exactly this name, lowercase)
5. **Make it public**: Toggle "Public bucket" to ON
6. Click **"Create bucket"**

## Step 2: Set up Storage Policies

Run this SQL in your Supabase SQL Editor:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media');

-- Allow public to read files (since bucket is public)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

## Step 3: Run the RLS Fix

Run the `fix-media-rls-policies.sql` file in your SQL Editor.

After completing these 3 steps, your media uploads should work!
