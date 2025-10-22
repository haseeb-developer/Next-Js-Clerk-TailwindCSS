import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all public snippets to count unique users
    const { data: snippets, error } = await supabase
      .from('snippets')
      .select('user_id')
      .eq('is_public', true)
      .is('deleted_at', null)

    if (error) {
      console.error('Supabase error fetching snippets for user count:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user count', details: error.message },
        { status: 500 }
      )
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set((snippets || []).map(snippet => snippet.user_id))]
    const totalUsers = uniqueUserIds.length

    return NextResponse.json({
      totalUsers,
      message: `Total users with public snippets: ${totalUsers}`
    })

  } catch (error) {
    console.error('Error in total users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
