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

      case 'media':
        // Get file path first
        const { data: mediaFile, error: fetchMediaError } = await supabase
          .from('media_files')
          .select('file_url')
          .eq('id', id)
          .eq('user_id', userId)
          .single()

        if (fetchMediaError) {
          console.error('Error fetching media file:', fetchMediaError)
        }

        // Delete from storage
        if (mediaFile?.file_url) {
          const urlParts = mediaFile.file_url.split('/')
          const filePath = urlParts[urlParts.length - 1]
          
          const { error: storageError } = await supabase.storage
            .from('media')
            .remove([filePath])

          if (storageError) {
            console.error('Error deleting file from storage:', storageError)
          }
        }

        // Delete from database
        const { error: mediaError } = await supabase
          .from('media_files')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .not('deleted_at', 'is', null)

        if (mediaError) {
          console.error('Error permanently deleting media:', mediaError)
          return NextResponse.json({ error: 'Failed to permanently delete media' }, { status: 500 })
        }
        result = { message: 'Media permanently deleted' }
        break

      case 'mediaFolder':
        // Get all media files in this folder
        const { data: mediaFiles, error: fetchFilesError } = await supabase
          .from('media_files')
          .select('file_url')
          .eq('media_folder_id', id)
          .eq('user_id', userId)

        // Delete files from storage
        if (mediaFiles && mediaFiles.length > 0 && !fetchFilesError) {
          const filePaths = mediaFiles.map(file => {
            const urlParts = file.file_url.split('/')
            return urlParts[urlParts.length - 1]
          })

          const { error: storageError } = await supabase.storage
            .from('media')
            .remove(filePaths)

          if (storageError) {
            console.error('Error deleting files from storage:', storageError)
          }
        }

        // Delete media file records
        const { error: mediaDeleteError } = await supabase
          .from('media_files')
          .delete()
          .eq('media_folder_id', id)
          .eq('user_id', userId)

        if (mediaDeleteError) {
          console.error('Error deleting media files:', mediaDeleteError)
        }

        // Delete media folder
        const { error: mediaFolderError } = await supabase
          .from('media_folders')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .not('deleted_at', 'is', null)

        if (mediaFolderError) {
          console.error('Error permanently deleting media folder:', mediaFolderError)
          return NextResponse.json({ error: 'Failed to permanently delete media folder' }, { status: 500 })
        }
        result = { message: 'Media folder permanently deleted' }
        break

      default:
        return NextResponse.json({ error: 'Invalid type. Must be snippet, folder, category, media, or mediaFolder' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in permanent delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
