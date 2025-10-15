import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: folderId } = await params

    // Soft delete the folder
    const { error } = await supabase
      .from('folders')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .eq('user_id', userId)
      .is('deleted_at', null) // Only update if not already deleted

    if (error) {
      console.error('Error soft deleting folder:', error)
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Folder moved to recycle bin' })
  } catch (error) {
    console.error('Error in folder soft delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
