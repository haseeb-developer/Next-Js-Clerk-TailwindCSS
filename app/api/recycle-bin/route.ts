import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all deleted items
    const [deletedSnippets, deletedFolders, deletedCategories] = await Promise.all([
      // Deleted snippets
      supabase
        .from('snippets')
        .select('*')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),

      // Deleted folders
      supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),

      // Deleted categories
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
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

    // Calculate snippet counts for folders and categories
    const foldersWithCounts = (deletedFolders.data || []).map(folder => ({
      ...folder,
      snippet_count: 0 // For now, we'll set this to 0 since snippets are unassigned when folders are deleted
    }))

    const categoriesWithCounts = (deletedCategories.data || []).map(category => ({
      ...category,
      snippet_count: 0 // For now, we'll set this to 0 since snippets are unassigned when categories are deleted
    }))

    return NextResponse.json({
      snippets: deletedSnippets.data || [],
      folders: foldersWithCounts,
      categories: categoriesWithCounts
    })
  } catch (error) {
    console.error('Error in recycle bin API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
