import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: snippets, error } = await supabase
      .from('snippets')
      .select('*')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('Error fetching deleted snippets:', error)
      return NextResponse.json({ error: 'Failed to fetch deleted snippets' }, { status: 500 })
    }

    return NextResponse.json(snippets || [])
  } catch (error) {
    console.error('Error in deleted snippets API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
