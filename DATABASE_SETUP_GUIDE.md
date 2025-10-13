# 🗄️ Database Setup Guide - Add Recycle Bin Feature

## 📋 **Step-by-Step Instructions:**

### **Step 1: Add the Column**
1. Go to your **Supabase Dashboard**
2. Click on **"SQL Editor"** in the left sidebar
3. Copy and paste this command:

```sql
ALTER TABLE snippets ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;
```

4. Click **"Run"** button
5. You should see "Success" message

### **Step 2: Verify It Worked**
1. Go back to your app
2. Refresh the page
3. You should now see a **"Recycle Bin"** button next to "New Snippet"
4. When you delete a snippet, it will say **"Move to Recycle Bin"** instead of permanent delete

## ✅ **What This Does:**

### **Before (Current):**
- Delete = Permanent deletion
- No recycle bin
- Snippets are gone forever

### **After (With Column):**
- Delete = Move to recycle bin
- Recycle bin button appears
- Can restore or permanently delete from recycle bin
- 30-day retention period

## 🔄 **How It Works:**

1. **Normal Delete**: Moves snippet to recycle bin (sets `deleted_at` timestamp)
2. **Recycle Bin**: Shows all deleted snippets
3. **Restore**: Removes `deleted_at` timestamp (brings snippet back)
4. **Permanent Delete**: Actually deletes from database forever

## 🚨 **Important Notes:**

- **No Data Loss**: Your existing snippets are safe
- **Backward Compatible**: App works with or without this column
- **30-Day Retention**: Deleted snippets stay in recycle bin for 30 days
- **One Command**: Just run the single SQL command above

## 🎯 **Expected Result:**

After running the SQL command:
- ✅ Recycle bin button appears
- ✅ Delete confirmation says "Move to Recycle Bin"
- ✅ Toast message says "Snippet moved to recycle bin"
- ✅ Can restore snippets from recycle bin
- ✅ Can permanently delete from recycle bin

That's it! Just one SQL command and you'll have full recycle bin functionality! 🎉
