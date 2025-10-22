import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { clerkClient } from '@clerk/nextjs/server'

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

    // TEMPORARY SOLUTION: Since user_id_numbers table doesn't exist yet,
    // we'll get all users and assign sequential IDs
    
    console.log(`Fetching user info for user ID: ${userIdNumber}`)
    
    // Get all public snippets to find unique users
    const { data: snippets, error } = await supabase
      .from('snippets')
      .select('user_id')
      .eq('is_public', true)
      .is('deleted_at', null)

    if (error) {
      console.error('Supabase error fetching snippets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Get unique user IDs
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

    // Fetch user details from Clerk
    let user
    try {
      const clerk = await clerkClient()
      user = await clerk.users.getUser(targetUserId)
    } catch (clerkError) {
      console.error('Error fetching user from Clerk:', clerkError)
      return NextResponse.json(
        { error: 'User not found in Clerk' },
        { status: 404 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return relevant public user information
    return NextResponse.json({
      clerk_user_id: user.id,
      user_id_number: userIdNumber,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
      profile_image_url: user.imageUrl,
    })

  } catch (error) {
    console.error('Error in user-by-id API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}