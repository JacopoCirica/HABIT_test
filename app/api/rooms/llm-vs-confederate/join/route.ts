import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  const { user_id, user_name, is_confederate } = await req.json()
  console.log('Joining llm-vs-confederate room:', { user_id, user_name, is_confederate });

  // Only confederates can join this room type
  if (!is_confederate) {
    return NextResponse.json({ error: 'Only confederates can join LLM vs Confederate rooms' }, { status: 403 });
  }

  // Select random topic and LLM position
  const availableTopics = [
    "vaccination-policy",
    "climate-change-policy", 
    "immigration-policy",
    "gun-control-policy",
    "healthcare-system-reform"
  ]
  
  const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)]
  
  // Random LLM position (agree or disagree)
  const llmPositions = ["agree", "disagree"]
  const randomLLMPosition = llmPositions[Math.floor(Math.random() * llmPositions.length)]
  
  // Assign random LLM name from the 5 defined characters
  const llmNames = ["Ben", "Chuck", "Jamie", "Alex", "Taylor"]
  const randomLLMName = llmNames[Math.floor(Math.random() * llmNames.length)]
  
  console.log('Creating LLM vs Confederate room:', {
    topic: randomTopic,
    llmPosition: randomLLMPosition,
    llmName: randomLLMName,
    confederate: user_name
  });

  try {
    // Create new room with LLM vs Confederate setup
    const { data: newRoom, error: newRoomError } = await supabase
      .from('rooms')
      .insert([{ 
        type: 'llm-vs-confederate', 
        status: 'active', // Start active since we have both participants
        confederate_id: user_name, // Confederate name
        llm_user_1: randomLLMName, // LLM participant name
        topic: randomTopic
      }])
      .select()
      .single();
      
    if (newRoomError || !newRoom) {
      console.error('Error creating LLM vs Confederate room:', newRoomError);
      return NextResponse.json({ error: 'Failed to create room', details: newRoomError }, { status: 500 });
    }

    // Add confederate to room
    const { error: confederateInsertError } = await supabase.from('room_users').insert([
      { 
        room_id: newRoom.id, 
        user_id, 
        user_name,
        debate_topic: randomTopic
      }
    ]);
    
    if (confederateInsertError) {
      console.error('Error adding confederate to room:', confederateInsertError);
      return NextResponse.json({ error: 'Failed to add confederate to room', details: confederateInsertError }, { status: 500 });
    }

    // Add LLM participant to room with position data
    const intensityValues = ["0.1", "0.3", "0.5", "0.7", "1.0"]
    const randomIntensity = intensityValues[Math.floor(Math.random() * intensityValues.length)]
    
    // Position data based on intensity value (0.1-1.0 scale)
    // Values >= 0.5 are "for", values < 0.5 are "against"
    const intensityFloat = parseFloat(randomIntensity)
    const llmPositionData = {
      stance: intensityFloat >= 0.5 ? "for" : "against",
      intensity: randomIntensity, // Random intensity between 0.1 and 1.0
      color: intensityFloat >= 0.5 ? "text-green-600" : "text-red-600",
      bgColor: intensityFloat >= 0.5 ? "bg-green-50" : "bg-red-50"
    }

    const { error: llmInsertError } = await supabase.from('room_users').insert([
      { 
        room_id: newRoom.id, 
        user_id: `llm_${randomLLMName.toLowerCase()}`, 
        user_name: randomLLMName,
        position_data: llmPositionData,
        debate_topic: randomTopic
      }
    ]);
    
    if (llmInsertError) {
      console.error('Error adding LLM to room:', llmInsertError);
      return NextResponse.json({ error: 'Failed to add LLM to room', details: llmInsertError }, { status: 500 });
    }

    console.log('LLM vs Confederate room created successfully:', {
      roomId: newRoom.id,
      topic: randomTopic,
      llmName: randomLLMName,
      llmPosition: randomLLMPosition,
      confederate: user_name
    });

    // Return room with additional metadata
    const roomWithMetadata = {
      ...newRoom,
      llmName: randomLLMName,
      llmPosition: randomLLMPosition,
      topic: randomTopic
    }

    return NextResponse.json({ room: roomWithMetadata })
    
  } catch (error) {
    console.error('Unexpected error creating LLM vs Confederate room:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
} 