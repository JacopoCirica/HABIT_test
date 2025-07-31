import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { user_id, user_name } = await req.json()
    
    console.log('Scotobot join request:', { user_id, user_name })

    // Simplified: Always create a new Scotobot room for now (to avoid complex joins)
    console.log('Creating new Scotobot room for user:', user_id)

    // Create new Scotobot room
    console.log('Attempting to create Scotobot room...')
    const { data: newRoom, error: roomError } = await supabase
      .from('rooms')
      .insert([{
        type: 'scotobot',
        status: 'active',
        justice_robert_id: 'justice_robert'
      }])
      .select()
      .single()

    if (roomError) {
      console.error('Error creating Scotobot room:', roomError)
      console.error('Full error details:', {
        message: roomError.message,
        details: roomError.details,
        hint: roomError.hint,
        code: roomError.code
      })
      return NextResponse.json({ 
        error: 'Failed to create room', 
        details: roomError.message,
        dbError: roomError 
      }, { status: 500 })
    }

    console.log('Created new Scotobot room:', newRoom)

    // Add user to the room
    console.log('Adding user to Scotobot room...', { room_id: newRoom.id, user_id, user_name })
    const { error: userError } = await supabase
      .from('room_users')
      .insert([{
        room_id: newRoom.id,
        user_id: user_id,
        user_name: user_name,
        user_role: 'participant'
      }])

    if (userError) {
      console.error('Error adding user to Scotobot room:', userError)
      console.error('User error details:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      })
      return NextResponse.json({ 
        error: 'Failed to join room', 
        details: userError.message,
        dbError: userError 
      }, { status: 500 })
    }

    // Also add Justice ROBert as a participant
    console.log('Adding Justice ROBert to Scotobot room...')
    const { error: justiceError } = await supabase
      .from('room_users')
      .insert([{
        room_id: newRoom.id,
        user_id: 'justice_robert',
        user_name: 'Justice ROBert',
        user_role: 'assistant'
      }])

    if (justiceError) {
      console.error('Error adding Justice ROBert to room:', justiceError)
      console.error('Justice ROBert error details:', {
        message: justiceError.message,
        details: justiceError.details,
        hint: justiceError.hint,
        code: justiceError.code
      })
      // Don't fail the request if Justice ROBert can't be added
    }

    console.log('User successfully joined Scotobot room:', newRoom.id)

    return NextResponse.json({ 
      room: newRoom,
      message: 'Successfully joined Scotobot room'
    })

  } catch (error) {
    console.error('Error in Scotobot join:', error)
    return NextResponse.json({ 
      error: "Failed to join Scotobot room" 
    }, { status: 500 })
  }
} 