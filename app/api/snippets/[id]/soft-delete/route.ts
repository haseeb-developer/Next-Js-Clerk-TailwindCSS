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

    const { id: snippetId } = await params

    // Soft delete the snippet
    const { error } = await supabase
      .from('snippets')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', snippetId)
      .eq('user_id', userId)
      .is('deleted_at', null) // Only update if not already deleted

    if (error) {
      console.error('Error soft deleting snippet:', error)
      return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Snippet moved to recycle bin' })
  } catch (error) {
    console.error('Error in snippet soft delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
