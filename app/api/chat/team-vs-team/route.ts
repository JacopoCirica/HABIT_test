import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { roomId, userMessage, teamAssignments } = await req.json()
    console.log('Team-vs-team LLM API called:', { roomId, userMessage: userMessage.content, teamAssignments })

    if (!roomId || !userMessage || !teamAssignments) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get room details including topic
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('topic, confederate_id')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      console.error('Error fetching room:', roomError)
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get all messages for context
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Determine which team the user belongs to
    const userTeam = teamAssignments.red_team?.includes(userMessage.sender_id) ? 'red' : 'blue'
    const opposingTeam = userTeam === 'red' ? 'blue' : 'red'
    
    console.log(`User is on ${userTeam} team, opposing team is ${opposingTeam}`)

    // Get LLM participants from both teams
    const redTeamLLMs = teamAssignments.red_team?.filter((id: string) => id.includes('llm_')) || []
    const blueTeamLLMs = teamAssignments.blue_team?.filter((id: string) => id.includes('llm_')) || []
    
    // Randomly select 1-2 LLMs to respond (from both teams, but favor opposing team)
    const allLLMs = [...redTeamLLMs, ...blueTeamLLMs]
    const opposingTeamLLMs = opposingTeam === 'red' ? redTeamLLMs : blueTeamLLMs
    
    // 70% chance opposing team responds, 30% chance same team responds
    const shouldOpposingTeamRespond = Math.random() < 0.7
    const availableLLMs = shouldOpposingTeamRespond ? opposingTeamLLMs : allLLMs
    
    // Select 1-2 random LLMs to respond
    const numResponders = Math.floor(Math.random() * 2) + 1 // 1 or 2 responders
    const shuffledLLMs = [...availableLLMs].sort(() => 0.5 - Math.random())
    const respondingLLMs = shuffledLLMs.slice(0, numResponders)
    
    console.log('LLMs selected to respond:', respondingLLMs)

    // Generate responses for each selected LLM
    for (const llmId of respondingLLMs) {
      await generateLLMResponse(roomId, llmId, userMessage, messages, room.topic, teamAssignments)
      
      // Add small delay between responses to make it feel more natural
      if (respondingLLMs.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return NextResponse.json({ success: true, respondingLLMs })
  } catch (error) {
    console.error('Team-vs-team LLM API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateLLMResponse(roomId: string, llmId: string, userMessage: any, messages: any[], topic: string, teamAssignments: any) {
  try {
    // Get LLM name from room_users table
    const { data: llmUser, error: llmError } = await supabase
      .from('room_users')
      .select('user_name')
      .eq('room_id', roomId)
      .eq('user_id', llmId)
      .single()

    if (llmError || !llmUser) {
      console.error('Error fetching LLM user:', llmError)
      return
    }

    const llmName = Array.isArray(llmUser.user_name) ? llmUser.user_name[0] : llmUser.user_name

    // Determine LLM's team and role
    const isRedTeam = teamAssignments.red_team?.includes(llmId)
    const isConfederate = llmId.includes('confederate')
    const team = isRedTeam ? 'Red' : 'Blue'
    
    // Create conversation context
    const conversationHistory = messages.map(msg => 
      `${msg.sender_id === 'moderator' ? 'Moderator' : 'Participant'}: ${msg.content}`
    ).join('\n')

    // Create system prompt based on role and team
    const systemPrompt = `You are ${llmName}, a ${isConfederate ? 'confederate' : 'participant'} on the ${team} Team in a debate about "${topic}". 

${isConfederate ? 
  `As a confederate, you should guide the discussion and present strong arguments for your team's position. Be persuasive and knowledgeable.` :
  `As a team member, you should support your team's arguments and engage constructively in the debate.`
}

Team assignments:
- Red Team: ${teamAssignments.red_team?.join(', ')}
- Blue Team: ${teamAssignments.blue_team?.join(', ')}

Recent conversation:
${conversationHistory}

Latest message from user: "${userMessage.content}"

Respond as ${llmName} with a thoughtful, engaging message that fits your role and team position. Keep responses conversational and under 100 words. ${isConfederate ? 'Show leadership in the discussion.' : 'Support your team\'s arguments.'}`

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage.content }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    })

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', openAIResponse.status)
      return
    }

    const data = await openAIResponse.json()
    const llmResponse = data.choices[0]?.message?.content?.trim()

    if (!llmResponse) {
      console.error('No response from OpenAI')
      return
    }

    // Insert LLM response into database
    const { error: insertError } = await supabase
      .from('messages')
      .insert([{
        room_id: roomId,
        sender_id: llmId,
        sender_role: 'assistant',
        content: llmResponse,
      }])

    if (insertError) {
      console.error('Error inserting LLM response:', insertError)
    } else {
      console.log(`${llmName} (${llmId}) responded:`, llmResponse)
    }
  } catch (error) {
    console.error('Error generating LLM response:', error)
  }
} 