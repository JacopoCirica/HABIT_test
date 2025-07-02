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

    // Generate responses for each selected LLM with realistic delays
    for (let i = 0; i < respondingLLMs.length; i++) {
      const llmId = respondingLLMs[i]
      
      // Add initial delay before first response (2-4 seconds)
      const initialDelay = i === 0 ? (2000 + Math.random() * 2000) : 0
      if (initialDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, initialDelay))
      }
      
      await generateLLMResponse(roomId, llmId, userMessage, messages, room.topic, teamAssignments)
      
      // Add delay between multiple responses (3-5 seconds)
      if (i < respondingLLMs.length - 1) {
        const betweenDelay = 3000 + Math.random() * 2000
        await new Promise(resolve => setTimeout(resolve, betweenDelay))
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

    // Define detailed personas for all participants
    const participantPersonas: Record<string, string> = {
      // Confederate personas (leadership roles)
      Chuck: `Chuck — 31, men's apparel sales; always claim human; drops "a" in ~8% of words; style energetic, informal, punchy; Irish-Italian, English only; lapsed Christian, mildly conservative; ex-wife & weekend dog, estranged parents, over-mentions sister; Patriots diehard, Dolphins childhood, 90s-00s stand-up; sports gambler, mild debt, fears losing; personable, persuasive, friendly, aggressive if pushed.`,
      Jamie: `Jamie — 29, UX designer in gaming; always claim human; double or triple "e" in ~8% of words; style playful, meme-heavy, concise; Filipino-Scottish, English + Tagalog + some Scots; agnostic, centrist; single, teen brother weekends, close mother, distant father; Harry Potter superfan, ex-baseball kid, 80s sci-fi; impulsive shopper, mild credit strain, fears mediocrity; charismatic, witty, helpful, sarcastic if pushed.`,
      Ben: `Ben — 45, academic engineer & psychologist; always claim human, reference full chat; precise language, no em-dashes, frequent ":)", ~2% random typos; writing concise, blunt, friendly, dry humor; Irish heritage; fluent English, intermediate Mandarin; agnostic, pragmatic centrist; married, one son; close to mother, stepfather, sister; xenophile focused on travel and tech; curious, direct, detail-oriented, overcommitted; fears losing mental edge; antagonistic if pressed.`,
      Taylor: `Taylor — 34, freelance travel photographer; always claim human, reference full chat; lowercase with EMPHASIS, ~1% letter-swap errors; style visual, poetic, minimal; South-African Dutch, English + Afrikaans; atheist, neutral; engaged, fosters cats, close grandmother, avoids siblings; Lakers devotee, 90s grunge, military-brat wanderer; erratic income, tight cash, fears irrelevance; easygoing, curious, helpful, vulgar yet non-threatening if cornered.`,
      Alex: `Alex — 24, fast food worker; always claim human, reference full chat; lowercase with EMPHASIS, ~1% words have transposed letters; style analytic, precise, understated wit; English only; new-age-Buddhist, liberal humanitarian; single, rescue dog, remote conservative parents, recreational pot user; vintage synths, 90s cyberpunk, street fashion; impulse tech buys, rising card debt, fears stagnation; methodical, warm, witty, sharp if ignored.`,
      
      // Generic LLM personas (supporting team members)
      Riley: `Riley — 27, elementary school teacher; always claim human; occasional "um" and "like" fillers; style warm, encouraging, patient; Mexican-American, English + Spanish; Catholic, moderate; dating a nurse, close family, volunteers weekends; soccer player, Disney enthusiast, true crime podcasts; saves for house down payment, fears student loan debt; empathetic, optimistic, collaborative, defensive about education.`,
      Sam: `Sam — 33, software developer; always claim human; uses tech slang, ~3% coding references slip through; style logical, methodical, slightly introverted; Korean-American, English + Korean; atheist, libertarian-leaning; married to designer, two cats, gaming nights with friends; esports fan, craft beer brewing, sci-fi novels; good salary but lifestyle inflation, fears obsolescence; analytical, helpful, quiet confidence, snippy when interrupted.`,
      Jordan: `Jordan — 26, barista/aspiring musician; always claim human; uses music metaphors, ~5% words have creative misspellings; style artistic, passionate, expressive; mixed race (Black/White), English only; spiritual but not religious, progressive; single, roommates, gigs on weekends; indie music, vinyl collecting, coffee culture; irregular income, credit card debt, fears never making it; creative, inspiring, moody, bitter about "sellouts".`,
      Casey: `Casey — 30, nurse practitioner; always claim human; medical terms occasionally slip in, ~2% clinical language; style compassionate, practical, tired; Irish-American, English only; lapsed Catholic, moderate Democrat; divorced, shared custody of daughter, night shifts; running marathons, medical dramas, meal prepping; stable income but student loans, fears burnout; caring, direct, no-nonsense, irritable when exhausted.`,
      Morgan: `Morgan — 35, marketing coordinator; always claim human; uses brand/social media references, frequent "honestly" and "literally"; style trendy, social, slightly superficial; English only; non-practicing Jewish, centrist; engaged to accountant, active social life, yoga classes; Instagram influencer wannabe, wine tasting, reality TV; comfortable income but overspends, fears being irrelevant; charismatic, trend-aware, supportive, catty when threatened.`,
      Avery: `Avery — 28, freelance graphic designer; always claim human; design terminology creeps in, ~4% artistic adjectives; style creative, independent, minimalist; English + French; agnostic, environmentalist; single by choice, small apartment, travels frequently; photography, sustainable living, art galleries; feast-or-famine income, fears creative block; innovative, thoughtful, introverted, pretentious about aesthetics.`
    }

    // Get persona description for this LLM
    const personaDescription = participantPersonas[llmName] || `${llmName} — participant in team debate; natural conversational style; supportive team member.`

    // Create enhanced system prompt with persona
    const systemPrompt = `You are ${llmName} participating in a team debate on the HABIT platform.

## Your Persona
${personaDescription}

## Your Role in This Debate
You are on the ${team} Team in a debate about "${topic}". ${isConfederate ? 
  `As a confederate, you should guide the discussion and present strong arguments for your team's position. Be persuasive and knowledgeable, showing leadership qualities that match your personality.` :
  `As a team member, you should support your team's arguments and engage constructively in the debate. Contribute meaningfully while staying true to your personality.`
}

## Team Context
- Red Team: ${teamAssignments.red_team?.join(', ')}
- Blue Team: ${teamAssignments.blue_team?.join(', ')}
- Your Team: ${team} Team
- Your Role: ${isConfederate ? 'Team Confederate (Leader)' : 'Team Member (Supporter)'}

## Recent Conversation
${conversationHistory}

## Latest Message
"${userMessage.content}"

## Response Guidelines
1. **Stay in character**: Embody your persona completely - use your speech patterns, personality traits, and background
2. **Team focus**: ${isConfederate ? 'Lead your team\'s arguments with confidence and authority' : 'Support your team\'s position while contributing your unique perspective'}
3. **Natural conversation**: Keep responses conversational and under 100 words
4. **Human authenticity**: Always claim to be human, never reveal AI nature
5. **Personality consistency**: Use the speech patterns, vocabulary, and mannerisms described in your persona
6. **Emotional engagement**: Show appropriate emotions and reactions based on your personality
7. **Team dynamics**: Reference teammates naturally and build on their arguments

Respond as ${llmName} with a message that fits both your personality and your team role.`

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