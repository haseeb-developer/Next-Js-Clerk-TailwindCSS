import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, id } = await request.json()

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'snippet':
        // Permanently delete snippet
        const { error: snippetError } = await supabase
          .from('snippets')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .not('deleted_at', 'is', null)

        if (snippetError) {
          console.error('Error permanently deleting snippet:', snippetError)
          return NextResponse.json({ error: 'Failed to permanently delete snippet' }, { status: 500 })
        }
        result = { message: 'Snippet permanently deleted' }
        break

      case 'folder':
        // Permanently delete folder and unlink snippets
        const { error: folderError } = await supabase
          .from('folders')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .not('deleted_at', 'is', null)

        if (folderError) {
          console.error('Error permanently deleting folder:', folderError)
          return NextResponse.json({ error: 'Failed to permanently delete folder' }, { status: 500 })
        }
        result = { message: 'Folder permanently deleted' }
        break

      case 'category':
        // Permanently delete category
        const { error: categoryError } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .not('deleted_at', 'is', null)

        if (categoryError) {
          console.error('Error permanently deleting category:', categoryError)
          return NextResponse.json({ error: 'Failed to permanently delete category' }, { status: 500 })
        }
        result = { message: 'Category permanently deleted' }
        break

      default:
        return NextResponse.json({ error: 'Invalid type. Must be snippet, folder, or category' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in permanent delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
