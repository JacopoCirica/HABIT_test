import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name } = await req.json()
  console.log('Joining team-vs-team room:', { user_id, user_name });

  // Find a room that's not full (has less than 4 human participants)
  const { data: availableRooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, status, red_team_confederate, blue_team_confederate, red_team_llm, blue_team_llm')
    .eq('type', 'team-vs-team')
    .in('status', ['waiting', 'filling'])

  if (roomsError) {
    console.error('Error fetching available rooms:', roomsError);
  }
  console.log('Found available rooms:', availableRooms);

  let room = null

  // Check each room to see if it has space
  for (const candidate of availableRooms || []) {
    const { count, error: countError } = await supabase
      .from('room_users')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', candidate.id)
    
    if (countError) {
      console.error('Error counting users in room:', candidate.id, countError);
      continue
    }
    
    console.log(`Room ${candidate.id} has ${count || 0} human participants`);
    if ((count || 0) < 4) { // Room has space for more humans
      room = candidate
      break
    }
  }

  if (room) {
    console.log('Joining existing room:', room.id);
    
    // Get current members count
    const { data: currentMembers, error: membersError } = await supabase
      .from('room_users')
      .select('user_id')
      .eq('room_id', room.id)
    
    if (membersError) {
      console.error('Error fetching current members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch room members' }, { status: 500 });
    }

    // Add user to room (teams will be assigned client-side based on join order)
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    
    if (userInsertError) {
      console.error('Error adding user to room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room' }, { status: 500 });
    }

    // Check if room is now full (4 humans) and should be activated
    const newCount = (currentMembers?.length || 0) + 1
    if (newCount >= 4) {
      // Activate room and add LLMs
      await activateRoomWithLLMs(room.id)
    }

  } else {
    console.log('No available room found, creating new room');
    
    // Assign confederate names for both teams
    const confederateNames = ["Ben", "Chuck", "Jamie", "Alex", "Taylor"]
    const shuffledConfederates = [...confederateNames].sort(() => 0.5 - Math.random())
    const redConfederate = shuffledConfederates[0]
    const blueConfederate = shuffledConfederates[1]
    
    // Assign LLM names for both teams
    const llmNames = ["Sam", "Jordan", "Casey", "Riley", "Morgan", "Avery"]
    const shuffledLLMs = [...llmNames].sort(() => 0.5 - Math.random())
    const redLLM = shuffledLLMs[0]
    const blueLLM = shuffledLLMs[1]
    
    console.log('Creating new team-vs-team room with:', {
      redConfederate,
      blueConfederate,
      redLLM,
      blueLLM
    });
    
    // Create new room
    const { data: newRoom, error: newRoomError } = await supabase
      .from('rooms')
      .insert([{ 
        type: 'team-vs-team', 
        status: 'filling',
        red_team_confederate: redConfederate,
        blue_team_confederate: blueConfederate,
        red_team_llm: redLLM,
        blue_team_llm: blueLLM
      }])
      .select()
      .single();
      
    if (newRoomError || !newRoom) {
      console.error('Error creating new room:', newRoomError);
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
    
    room = newRoom;
    
    // First user joins the room
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    
    if (userInsertError) {
      console.error('Error adding user to new room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room' }, { status: 500 });
    }
  }

  console.log('Returning room:', room);
  return NextResponse.json({ room })
}

// Helper function to activate room and add LLMs
async function activateRoomWithLLMs(roomId: string) {
  console.log('Activating room with LLMs:', roomId);
  
  // Get room details
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('red_team_confederate, blue_team_confederate, red_team_llm, blue_team_llm')
    .eq('id', roomId)
    .single()
    
  if (roomError || !room) {
    console.error('Error fetching room for LLM activation:', roomError);
    return
  }

  // Add 4 LLM participants (teams will be assigned client-side)
  const llmsToAdd = [
    { user_id: 'llm_red_confederate', user_name: room.red_team_confederate },
    { user_id: 'llm_red_member', user_name: room.red_team_llm },
    { user_id: 'llm_blue_confederate', user_name: room.blue_team_confederate },
    { user_id: 'llm_blue_member', user_name: room.blue_team_llm }
  ]

  // Insert LLM participants
  const { error: llmInsertError } = await supabase
    .from('room_users')
    .insert(llmsToAdd.map(llm => ({ 
      room_id: roomId, 
      user_id: llm.user_id, 
      user_name: llm.user_name
    })))
    
  if (llmInsertError) {
    console.error('Error adding LLMs to room:', llmInsertError);
  }

  // Update room status to active
  const { error: updateError } = await supabase
    .from('rooms')
    .update({ status: 'active' })
    .eq('id', roomId)
    
  if (updateError) {
    console.error('Error updating room status:', updateError);
  }
  
  console.log('Room activated with LLMs successfully');
} 