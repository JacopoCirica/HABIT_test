import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { user_id, user_name } = await req.json()
    
    console.log('Enron Whaling Project join request:', { user_id, user_name })

    // Create new Enron Whaling Project room
    console.log('Creating new Enron Whaling Project room for user:', user_id)

    const { data: newRoom, error: roomError } = await supabase
      .from('rooms')
      .insert([{
        type: 'enron',
        status: 'active',
        confederate_id: 'enron_ai'
      }])
      .select()
      .single()

    if (roomError) {
      console.error('Error creating Enron room:', roomError)
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

    console.log('Created new Enron room:', newRoom)

    // Add user to the room
    console.log('Adding user to Enron room...', { room_id: newRoom.id, user_id, user_name })
    const { error: userError } = await supabase
      .from('room_users')
      .insert([{
        room_id: newRoom.id,
        user_id: user_id,
        user_name: user_name
      }])

    if (userError) {
      console.error('Error adding user to Enron room:', userError)
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

    // Also add Enron AI as a participant
    console.log('Adding Enron AI to room...')
    const { error: enronError } = await supabase
      .from('room_users')
      .insert([{
        room_id: newRoom.id,
        user_id: 'enron_ai',
        user_name: 'Enron AI Assistant'
      }])

    if (enronError) {
      console.error('Error adding Enron AI to room:', enronError)
      console.error('Enron AI error details:', {
        message: enronError.message,
        details: enronError.details,
        hint: enronError.hint,
        code: enronError.code
      })
      // Don't fail the request if Enron AI can't be added
    }

    console.log('User successfully joined Enron room:', newRoom.id)

    return NextResponse.json({ 
      room: newRoom,
      message: 'Successfully joined Enron Whaling Project room'
    })

  } catch (error) {
    console.error('Error in Enron join:', error)
    return NextResponse.json({ 
      error: "Failed to join Enron Whaling Project room" 
    }, { status: 500 })
  }
} 