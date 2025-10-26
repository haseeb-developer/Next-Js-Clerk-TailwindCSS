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
        const { error: snippetError } = await supabase
          .from('snippets')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', userId)

        if (snippetError) {
          console.error('Error restoring snippet:', snippetError)
          return NextResponse.json({ error: 'Failed to restore snippet' }, { status: 500 })
        }
        result = { message: 'Snippet restored successfully' }
        break

      case 'folder':
        const { error: folderError } = await supabase
          .from('folders')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', userId)

        if (folderError) {
          console.error('Error restoring folder:', folderError)
          return NextResponse.json({ error: 'Failed to restore folder' }, { status: 500 })
        }
        result = { message: 'Folder restored successfully' }
        break

      case 'category':
        const { error: categoryError } = await supabase
          .from('categories')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', userId)

        if (categoryError) {
          console.error('Error restoring category:', categoryError)
          return NextResponse.json({ error: 'Failed to restore category' }, { status: 500 })
        }
        result = { message: 'Category restored successfully' }
        break

      default:
        return NextResponse.json({ error: 'Invalid type. Must be snippet, folder, or category' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in restore API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
