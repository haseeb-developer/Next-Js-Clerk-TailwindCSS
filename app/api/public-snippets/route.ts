import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '../../../lib/supabase'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    // Fetch public snippets
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
      .limit(100) // Limit to prevent abuse

    if (error) {
      console.error('Supabase error fetching public snippets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch public snippets', details: error.message },
        { status: 500 }
      )
    }

    // Get unique user IDs from snippets
    const uniqueUserIds = [...new Set((snippets || []).map(snippet => snippet.user_id))]
    
    // Fetch user information from Clerk and database for all unique user IDs
    const userInfoMap: { [key: string]: { userName: string; user_id_number: number } } = {}
    
    // Fetch user data from Clerk and database for each unique user ID
    // Use Promise.all for better performance
    const userPromises = uniqueUserIds.map(async (userId) => {
      try {
        // Get user ID number from database
        const { data: userData } = await supabase
          .from('user_id_numbers')
          .select('user_id_number')
          .eq('clerk_user_id', userId)
          .single()

        const clerk = await clerkClient()
        const user = await clerk.users.getUser(userId)
        // Use firstName, or fallback to email username, or just "User"
        const userName = user.firstName || 
                        user.emailAddresses[0]?.emailAddress.split('@')[0] || 
                        'User'
        
        return { 
          userId, 
          userName, 
          user_id_number: userData?.user_id_number || 1 
        }
      } catch (error) {
        console.log(`Could not fetch user info for ${userId}:`, error)
        // Fallback to a simple identifier
        const idPart = userId.replace('user_', '').substring(0, 6)
        return { 
          userId, 
          userName: `User ${idPart}`, 
          user_id_number: 1 
        }
      }
    })

    // Wait for all user data to be fetched
    const userResults = await Promise.all(userPromises)
    
    // Build the user info map
    userResults.forEach(({ userId, userName, user_id_number }) => {
      userInfoMap[userId] = { userName, user_id_number }
    })

    // Transform the data with user attribution
    const publicSnippets = (snippets || []).map(snippet => {
      // Get user info from our map (should have real names from Clerk now)
      const userInfo = userInfoMap[snippet.user_id] || { userName: 'Anonymous', user_id_number: 1 }

      return {
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
        // User attribution - now using real Clerk user data
        user_name: userInfo.userName,
        user_id_number: userInfo.user_id_number,
        user_email: null
      }
    })

    return NextResponse.json({
      snippets: publicSnippets,
      count: publicSnippets.length
    })

  } catch (error) {
    console.error('Error in public snippets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Add a POST endpoint for creating public snippets (if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { snippet_id } = body

    if (!snippet_id) {
      return NextResponse.json(
        { error: 'Snippet ID is required' },
        { status: 400 }
      )
    }

    // This would require authentication to make a snippet public
    // For now, we'll just return an error since this should be done through the authenticated interface
    return NextResponse.json(
      { error: 'Use the authenticated interface to create public snippets' },
      { status: 403 }
    )

  } catch (error) {
    console.error('Error in public snippets POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
