import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name, user_opinions } = await req.json()
  console.log('Joining 1v1 room:', { user_id, user_name });

  // Find a waiting room with only one user (AI will be added automatically)
  const { data: waitingRooms, error: waitingRoomsError } = await supabase
    .from('rooms')
    .select('id, status, confederate_id, topic')
    .eq('type', '1v1')
    .eq('status', 'waiting')

  if (waitingRoomsError) {
    console.error('Error fetching waiting rooms:', waitingRoomsError);
  }
  console.log('Found waiting 1v1 rooms:', waitingRooms);

  let room = null

  // Check if there's a waiting room with space
  for (const candidate of waitingRooms || []) {
    // Count users in this room
    const { count, error: countError } = await supabase
      .from('room_users')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', candidate.id)
    
    if (countError) {
      console.error('Error counting users in room:', candidate.id, countError);
      continue
    }
    
    console.log(`Room ${candidate.id} has ${count} users`);
    if (count === 0) { // Empty room waiting for first user
      room = candidate
      break
    }
  }

  if (room) {
    console.log('Joining existing waiting 1v1 room:', room.id);
    // Join as the human user
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    
    if (userInsertError) {
      console.error('Error adding user to existing 1v1 room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room', details: userInsertError }, { status: 500 });
    }
    
    // Update room status to active (human user joined, AI is conceptually always "ready")
    const { error: updateRoomError } = await supabase.from('rooms').update({ 
      status: 'active' 
    }).eq('id', room.id);
    
    if (updateRoomError) {
      console.error('Error updating 1v1 room status to active:', updateRoomError);
      return NextResponse.json({ error: 'Failed to update room status', details: updateRoomError }, { status: 500 });
    }
  } else {
    console.log('No waiting 1v1 room found, creating new room');
    
    // Select topic based on first user's opinions
    let selectedTopic = "social-media-regulation" // Default fallback
    
    if (user_opinions) {
      try {
        // Import the topic selection logic
        const { getTopicToDebate, opinionToChatTopicMap } = await import('@/lib/opinion-analyzer')
        const topicAnalysis = getTopicToDebate(user_opinions)
        
        if (topicAnalysis) {
          selectedTopic = opinionToChatTopicMap[topicAnalysis.topic]
          console.log(`Selected 1v1 topic: ${topicAnalysis.topic} (${topicAnalysis.displayName}) -> ${selectedTopic}`)
          console.log(`User position: ${topicAnalysis.position} (${topicAnalysis.rawValue}/7)`)
        }
      } catch (error) {
        console.error('Error selecting topic from opinions:', error)
      }
    }
    
    console.log('Final selected topic for new 1v1 room:', selectedTopic);
    
    // Assign a random confederate name for the AI
    const confederateNames = ["Ben", "Chuck", "Jamie", "Alex", "Taylor"]
    const randomConfederate = confederateNames[Math.floor(Math.random() * confederateNames.length)]
    
    console.log('Assigning confederate for new 1v1 room:', randomConfederate);
    
    // Create new room with AI confederate and selected topic
    const { data: newRoom, error: newRoomError } = await supabase
      .from('rooms')
      .insert([{ 
        type: '1v1', 
        status: 'active', // Start active since AI is always ready
        confederate_id: randomConfederate,
        topic: selectedTopic
      }])
      .select()
      .single();
      
    if (newRoomError || !newRoom) {
      console.error('Error creating new 1v1 room:', newRoomError);
      return NextResponse.json({ error: 'Failed to create room', details: newRoomError }, { status: 500 });
    }
    
    room = newRoom;
    
    // Add human user to the room
    const { error: userInsertError } = await supabase.from('room_users').insert([
      { room_id: room.id, user_id, user_name }
    ]);
    
    if (userInsertError) {
      console.error('Error adding user to new 1v1 room:', userInsertError);
      return NextResponse.json({ error: 'Failed to add user to room', details: userInsertError }, { status: 500 });
    }
  }

  console.log('Returning 1v1 room:', room);
  return NextResponse.json({ room })
} 