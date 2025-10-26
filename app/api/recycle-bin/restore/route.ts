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

      case 'media':
        const { error: mediaError } = await supabase
          .from('media_files')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', userId)

        if (mediaError) {
          console.error('Error restoring media:', mediaError)
          return NextResponse.json({ error: 'Failed to restore media' }, { status: 500 })
        }
        result = { message: 'Media restored successfully' }
        break

      case 'mediaFolder':
        // Restore media folder
        const { error: mediaFolderError } = await supabase
          .from('media_folders')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', userId)

        if (mediaFolderError) {
          console.error('Error restoring media folder:', mediaFolderError)
          return NextResponse.json({ error: 'Failed to restore media folder' }, { status: 500 })
        }

        // Also restore all media files in this folder
        const { error: mediaRestoreError } = await supabase
          .from('media_files')
          .update({ deleted_at: null })
          .eq('media_folder_id', id)
          .eq('user_id', userId)

        if (mediaRestoreError) {
          console.error('Error restoring media files:', mediaRestoreError)
        }

        result = { message: 'Media folder restored successfully' }
        break

      default:
        return NextResponse.json({ error: 'Invalid type. Must be snippet, folder, category, media, or mediaFolder' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in restore API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
