import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name, is_confederate } = await req.json()
  console.log('Joining 1v1-human room:', { user_id, user_name, is_confederate });

  // If this is a confederate joining via external link
  if (is_confederate) {
    // Find a waiting room with only one user
    const { data: waitingRooms, error: waitingRoomsError } = await supabase
      .from('rooms')
      .select('id, status, confederate_id')
      .eq('type', '1v1-human')
      .eq('status', 'waiting')

    if (waitingRoomsError) {
      console.error('Error fetching waiting rooms:', waitingRoomsError);
    }
    console.log('Found waiting rooms for confederate:', waitingRooms);

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
      console.log('Confederate joining existing waiting room:', room.id);
      // Join as confederate with name "Ben"
      const { error: userInsertError } = await supabase.from('room_users').insert([
        { room_id: room.id, user_id, user_name: 'Ben' }
      ]);
      if (userInsertError) {
        console.error('Error adding confederate to existing room:', userInsertError);
        return NextResponse.json({ error: 'Failed to add confederate to room', details: userInsertError }, { status: 500 });
      }
      
      // Update room with confederate name and set to active
      const { error: updateRoomError } = await supabase.from('rooms').update({ 
        status: 'active', 
        confederate_id: 'Ben' 
      }).eq('id', room.id);
      if (updateRoomError) {
        console.error('Error updating room status to active:', updateRoomError);
        return NextResponse.json({ error: 'Failed to update room status', details: updateRoomError }, { status: 500 });
      }

      console.log('Confederate successfully joined room:', room);
      return NextResponse.json({ room: { ...room, status: 'active', confederate_id: 'Ben' } })
    } else {
      // No waiting room found for confederate to join
      console.log('No waiting room found for confederate');
      return NextResponse.json({ error: 'No waiting room available for confederate to join' }, { status: 404 });
    }
  }

  // Regular user joining logic (existing code)
  // Find a waiting room with only one user
  const { data: waitingRooms, error: waitingRoomsError } = await supabase
    .from('rooms')
    .select('id, status, confederate_id')
    .eq('type', '1v1-human')
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
    // Join as second user (confederate)
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    if (userInsertError) {
      console.error('Error adding confederate user to existing room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room', details: userInsertError }, { status: 500 });
    }
    
    // Update room with confederate name and set to active
    const { error: updateRoomError } = await supabase.from('rooms').update({ 
      status: 'active', 
      confederate_id: user_name 
    }).eq('id', room.id);
    if (updateRoomError) {
      console.error('Error updating room status to active:', updateRoomError);
      return NextResponse.json({ error: 'Failed to update room status', details: updateRoomError }, { status: 500 });
    }
  } else {
    console.log('No waiting room found, creating new room');
    
    // Create new room without confederate assignment (will be assigned when second user joins)
    const { data: newRoom, error: newRoomError } = await supabase
      .from('rooms')
      .insert([{ 
        type: '1v1-human', 
        status: 'waiting',
        confederate_id: null
      }])
      .select()
      .single();
    if (newRoomError || !newRoom) {
      console.error('Error creating new room:', newRoomError);
      return NextResponse.json({ error: 'Failed to create room', details: newRoomError }, { status: 500 });
    }
    room = newRoom;
    // First user joins as regular participant
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    if (userInsertError) {
      console.error('Error adding participant to new room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room', details: userInsertError }, { status: 500 });
    }
  }

  console.log('Returning room:', room);
  return NextResponse.json({ room })
} 