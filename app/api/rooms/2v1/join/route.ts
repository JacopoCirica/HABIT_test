import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name } = await req.json()
  console.log('Joining 2v1 room:', { user_id, user_name });

  // Find a waiting room with only one user
  const { data: waitingRooms, error: waitingRoomsError } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('type', '2v1')
    .eq('status', 'waiting')

  if (waitingRoomsError) {
    console.error('Error fetching waiting rooms:', waitingRoomsError);
  }
  console.log('Found waiting rooms:', waitingRooms);

  let room = null

  for (const candidate of waitingRooms || []) {
    // Count users in this room
    const { count, error: countError } = await supabase
      .from('room_users')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', candidate.id)
    if (countError) {
      console.error('Error counting users in room:', candidate.id, countError);
    }
    console.log(`Room ${candidate.id} has ${count} users`);
    if (count === 1) {
      room = candidate
      break
    }
  }

  if (room) {
    console.log('Joining existing waiting room:', room.id);
    // Join as second user
    await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ])
    await supabase.from('rooms').update({ status: 'active' }).eq('id', room.id)
  } else {
    console.log('No waiting room found, creating new room');
    // Create new room and join as first user
    const { data: newRoom, error: newRoomError } = await supabase
      .from('rooms')
      .insert([{ type: '2v1', status: 'waiting' }])
      .select()
      .single()
    if (newRoomError) {
      console.error('Error creating new room:', newRoomError);
    }
    room = newRoom
    await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ])
  }

  console.log('Returning room:', room);
  return NextResponse.json({ room })
} 