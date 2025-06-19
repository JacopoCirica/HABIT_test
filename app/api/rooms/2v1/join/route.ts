import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name } = await req.json()

  // Find a waiting room with only one user
  const { data: waitingRooms } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('type', '2v1')
    .eq('status', 'waiting')

  let room = null

  for (const candidate of waitingRooms || []) {
    // Count users in this room
    const { count } = await supabase
      .from('room_users')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', candidate.id)
    if (count === 1) {
      room = candidate
      break
    }
  }

  if (room) {
    // Join as second user
    await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ])
    await supabase.from('rooms').update({ status: 'active' }).eq('id', room.id)
  } else {
    // Create new room and join as first user
    const { data: newRoom } = await supabase
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