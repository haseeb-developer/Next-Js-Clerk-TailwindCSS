import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Validate userId is a number
    if (!/^\d+$/.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    const userIdNumber = parseInt(userId)

    console.log(`Fetching public snippets for user ID: ${userIdNumber}`)
    
    // Get all public snippets
    const { data: snippets, error } = await supabase
      .from('snippets')
      .select(`
        id,
        title,
        description,
        code,
        language,
        tags,
        is_public,
        is_favorite,
        created_at,
        updated_at,
        user_id,
        folder_id,
        category_id
      `)
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Supabase error fetching public snippets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch public snippets', details: error.message },
        { status: 500 }
      )
    }

    // Get unique user IDs from snippets
    const uniqueUserIds = [...new Set((snippets || []).map(snippet => snippet.user_id))]
    
    // Check if the requested user ID is valid
    if (userIdNumber < 1 || userIdNumber > uniqueUserIds.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the user at the requested index (userIdNumber - 1)
    const targetUserId = uniqueUserIds[userIdNumber - 1]

    // Filter snippets for the requested user
    const userSnippets = (snippets || []).filter(snippet => snippet.user_id === targetUserId)

    // Transform the data with user attribution
    const publicSnippets = userSnippets.map(snippet => ({
      id: snippet.id,
      title: snippet.title,
      description: snippet.description,
      code: snippet.code,
      language: snippet.language,
      tags: snippet.tags,
      is_public: snippet.is_public,
      is_favorite: snippet.is_favorite,
      created_at: snippet.created_at,
      updated_at: snippet.updated_at,
      user_id: snippet.user_id,
      folder_id: snippet.folder_id,
      category_id: snippet.category_id,
      user_name: `User ${userIdNumber}`,
      user_id_number: userIdNumber,
      user_email: null
    }))

    return NextResponse.json({
      snippets: publicSnippets,
      count: publicSnippets.length
    })

  } catch (error) {
    console.error('Error in user public snippets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}