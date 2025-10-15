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

    const { id: categoryId } = await params

    // Soft delete the category
    const { error } = await supabase
      .from('categories')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .is('deleted_at', null) // Only update if not already deleted

    if (error) {
      console.error('Error soft deleting category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Category moved to recycle bin' })
  } catch (error) {
    console.error('Error in category soft delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
