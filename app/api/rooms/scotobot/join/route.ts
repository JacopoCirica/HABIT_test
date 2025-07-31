import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { user_id, user_name } = await req.json()
    
    console.log('Scotobot join request:', { user_id, user_name })

    // Check if user is already in an active Scotobot room
    const { data: existingRoomUser, error: existingError } = await supabase
      .from('room_users')
      .select(`
        room_id,
        rooms!inner (
          id,
          type,
          status,
          created_at
        )
      `)
      .eq('user_id', user_id)
      .eq('rooms.type', 'scotobot')
      .in('rooms.status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!existingError && existingRoomUser) {
      console.log('User already in Scotobot room:', existingRoomUser)
      
      // Get full room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', existingRoomUser.room_id)
        .single()

      if (!roomError && roomData) {
        return NextResponse.json({ room: roomData })
      }
    }

    // Create new Scotobot room
    const { data: newRoom, error: roomError } = await supabase
      .from('rooms')
      .insert([{
        type: 'scotobot',
        status: 'active' // Scotobot rooms are immediately active
      }])
      .select()
      .single()

    if (roomError) {
      console.error('Error creating Scotobot room:', roomError)
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    console.log('Created new Scotobot room:', newRoom)

    // Add user to the room
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
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
    }

    // Also add Justice ROBert as a participant
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