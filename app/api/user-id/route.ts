import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get or create user ID number
    const { data, error } = await supabase
      .rpc('get_or_create_user_id_number', { clerk_id: user.id })

    if (error) {
      console.error('Error getting user ID number:', error)
      return NextResponse.json(
        { error: 'Failed to get user ID number' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user_id_number: data,
      clerk_user_id: user.id,
      first_name: user.firstName
    })

  } catch (error) {
    console.error('Error in user ID API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clerk_user_id } = await request.json()
    
    if (!clerk_user_id) {
      return NextResponse.json(
        { error: 'clerk_user_id is required' },
        { status: 400 }
      )
    }

    // Get or create user ID number
    const { data, error } = await supabase
      .rpc('get_or_create_user_id_number', { clerk_id: clerk_user_id })

    if (error) {
      console.error('Error creating user ID number:', error)
      return NextResponse.json(
        { error: 'Failed to create user ID number' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user_id_number: data,
      clerk_user_id: clerk_user_id
    })

  } catch (error) {
    console.error('Error in user ID POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
