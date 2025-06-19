import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name } = await req.json()

  // Try to find a waiting room
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('type', '2v1')
    .eq('status', 'waiting')
    .limit(1)

  let room
  if (rooms && rooms.length > 0) {
    // Join as second user
    room = rooms[0]
    await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ])
    // Set room to active
    await supabase.from('rooms').update({ status: 'active' }).eq('id', room.id)
  } else {
    // Create new room and join as first user
    const { data: newRoom, error: createError } = await supabase
      .from('rooms')
      .insert([{ type: '2v1', status: 'waiting' }])
      .select()
      .single()
    room = newRoom
    await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ])
  }

  return NextResponse.json({ room })
} 