import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name } = await req.json()
  console.log('Joining 2vs4 room:', { user_id, user_name });

  // Find a waiting room with only one user
  const { data: waitingRooms, error: waitingRoomsError } = await supabase
    .from('rooms')
    .select('id, status, confederate_id, llm_user_1, llm_user_2, llm_user_3')
    .eq('type', '2vs4')
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
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    if (userInsertError) {
      console.error('Error adding user to existing room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room', details: userInsertError }, { status: 500 });
    }
    const { error: updateRoomError } = await supabase.from('rooms').update({ status: 'active' }).eq('id', room.id);
    if (updateRoomError) {
      console.error('Error updating room status to active:', updateRoomError);
      return NextResponse.json({ error: 'Failed to update room status', details: updateRoomError }, { status: 500 });
    }
  } else {
    console.log('No waiting room found, creating new room');
    
    // Assign confederate names for all 4 LLMs (1 main confederate + 3 LLM users)
    const confederateNames = ["Ben", "Chuck", "Jamie", "Alex", "Taylor"]
    
    // Shuffle and select 4 unique confederate names
    const shuffledConfederates = [...confederateNames].sort(() => 0.5 - Math.random())
    const mainConfederate = shuffledConfederates[0]
    const llmUser1 = shuffledConfederates[1]
    const llmUser2 = shuffledConfederates[2] 
    const llmUser3 = shuffledConfederates[3]
    
    console.log('Assigning confederates for new 2vs4 room:', {
      mainConfederate,
      llmUser1,
      llmUser2,
      llmUser3
    });
    
    // Create new room with confederate names
    const { data: newRoom, error: newRoomError } = await supabase
      .from('rooms')
      .insert([{ 
        type: '2vs4', 
        status: 'waiting',
        confederate_id: mainConfederate,
        llm_user_1: llmUser1,
        llm_user_2: llmUser2,
        llm_user_3: llmUser3
      }])
      .select()
      .single();
    if (newRoomError || !newRoom) {
      console.error('Error creating new room:', newRoomError);
      return NextResponse.json({ error: 'Failed to create room', details: newRoomError }, { status: 500 });
    }
    room = newRoom;
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    if (userInsertError) {
      console.error('Error adding user to new room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room', details: userInsertError }, { status: 500 });
    }
  }

  console.log('Returning room:', room);
  return NextResponse.json({ room })
} 