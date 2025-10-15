import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all deleted items with their snippet counts
    const [deletedSnippets, deletedFolders, deletedCategories] = await Promise.all([
      // Deleted snippets
      supabase
        .from('snippets')
        .select('*')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),

      // Deleted folders with snippet counts
      supabase
        .from('deleted_folders_with_counts')
        .select('*')
        .eq('user_id', userId),

      // Deleted categories with snippet counts
      supabase
        .from('deleted_categories_with_counts')
        .select('*')
        .eq('user_id', userId)
    ])

    if (deletedSnippets.error) {
      console.error('Error fetching deleted snippets:', deletedSnippets.error)
      return NextResponse.json({ error: 'Failed to fetch deleted snippets' }, { status: 500 })
    }

    if (deletedFolders.error) {
      console.error('Error fetching deleted folders:', deletedFolders.error)
      return NextResponse.json({ error: 'Failed to fetch deleted folders' }, { status: 500 })
    }

    if (deletedCategories.error) {
      console.error('Error fetching deleted categories:', deletedCategories.error)
      return NextResponse.json({ error: 'Failed to fetch deleted categories' }, { status: 500 })
    }

    return NextResponse.json({
      snippets: deletedSnippets.data || [],
      folders: deletedFolders.data || [],
      categories: deletedCategories.data || []
    })
  } catch (error) {
    console.error('Error in recycle bin API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
