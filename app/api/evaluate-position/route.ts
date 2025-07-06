import { NextRequest, NextResponse } from 'next/server'
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { 
      message, 
      currentPosition, 
      debateTopic, 
      roomId, 
      llmUserId 
    } = await req.json()

    console.log('Position evaluator called:', { 
      message: message.substring(0, 100) + '...', 
      currentPosition, 
      debateTopic, 
      roomId, 
      llmUserId 
    })
    
    // Debug: Check if we have valid position data
    if (!currentPosition || !currentPosition.stance || !currentPosition.intensity) {
      console.error('Invalid position data received:', currentPosition)
      return NextResponse.json({ 
        error: 'Invalid position data',
        details: 'Missing stance or intensity in position data'
      }, { status: 400 })
    }

    // Skip evaluation for neutral/greeting messages
    if (isNeutralMessage(message)) {
      console.log('Message is neutral, skipping position evaluation')
      return NextResponse.json({ 
        updatedPosition: currentPosition,
        reasoning: "Neutral message - no position change"
      })
    }

    // Create evaluation prompt
    const evaluationPrompt = `You are an expert debate analyst evaluating how a participant's message affects their confidence in their stated position.

## Current Context
- **Debate Topic**: ${debateTopic}
- **Participant's Stated Position**: ${currentPosition.stance === 'for' ? 'FOR' : 'AGAINST'} the topic
- **Current Confidence Level**: ${currentPosition.intensity} (scale: 0.1 = very weak, 1.0 = very strong)

## Message to Evaluate
"${message}"

## Your Task
Analyze how this message reflects the participant's confidence in their stated position. Consider:

1. **Reinforcement**: Does the message strongly support their position? (+0.1 to +0.3)
2. **Mild Support**: Does the message somewhat support their position? (+0.05 to +0.1)
3. **Neutral/Unrelated**: Does the message not relate to the position? (0 change)
4. **Doubt/Uncertainty**: Does the message show uncertainty or acknowledge opposing views? (-0.05 to -0.15)
5. **Contradiction**: Does the message contradict their stated position? (-0.2 to -0.4)

## Evaluation Rules
- Small changes: Most messages should result in changes of ±0.05 to ±0.15
- Medium changes: Strong arguments or clear doubts: ±0.15 to ±0.25
- Large changes: Complete contradictions or very strong arguments: ±0.25 to ±0.4
- Never drop below 0.1 or exceed 1.0
- Consider the current confidence level (harder to move from extremes)

## Response Format
Respond with ONLY a JSON object:
{
  "confidenceChange": [number between -0.4 and +0.4],
  "reasoning": "[brief explanation of why this change was made]",
  "messageType": "[reinforcement|support|neutral|doubt|contradiction]"
}`

    // Call OpenAI for evaluation
    const result = await generateText({
      model: openai("gpt-4o"),
      messages: [
        { role: "system", content: evaluationPrompt },
        { role: "user", content: `Evaluate this message: "${message}"` }
      ],
      temperature: 0.3, // Lower temperature for more consistent evaluation
      maxTokens: 200,
    })

    // Parse the evaluation result
    let evaluation
    try {
      evaluation = JSON.parse(result.text)
    } catch (parseError) {
      console.error('Failed to parse evaluation result:', result.text)
      return NextResponse.json({ 
        updatedPosition: currentPosition,
        reasoning: "Evaluation parsing failed"
      })
    }

    // Calculate new confidence level
    const currentConfidence = parseFloat(currentPosition.intensity)
    const confidenceChange = evaluation.confidenceChange || 0
    let newConfidence = currentConfidence + confidenceChange

    // Apply bounds and dampening for extreme values
    if (newConfidence < 0.1) {
      newConfidence = 0.1
    } else if (newConfidence > 1.0) {
      newConfidence = 1.0
    }

    // Round to one decimal place
    newConfidence = Math.round(newConfidence * 10) / 10

    // Create updated position data with correct stance based on intensity
    const updatedPosition = {
      ...currentPosition,
      intensity: newConfidence.toString(),
      stance: newConfidence >= 0.5 ? "for" : "against",
      color: newConfidence >= 0.5 ? "text-green-600" : "text-red-600",
      bgColor: newConfidence >= 0.5 ? "bg-green-50" : "bg-red-50"
    }

    // Update position in database
    const { error: updateError } = await supabase
      .from('room_users')
      .update({ position_data: updatedPosition })
      .eq('room_id', roomId)
      .eq('user_id', llmUserId)

    if (updateError) {
      console.error('Failed to update position in database:', updateError)
      return NextResponse.json({ 
        updatedPosition: currentPosition,
        reasoning: "Database update failed"
      })
    }

    console.log('Position updated:', {
      from: currentConfidence,
      to: newConfidence,
      change: confidenceChange,
      reasoning: evaluation.reasoning,
      messageType: evaluation.messageType
    })

    return NextResponse.json({
      updatedPosition,
      reasoning: evaluation.reasoning,
      messageType: evaluation.messageType,
      confidenceChange,
      previousConfidence: currentConfidence,
      newConfidence
    })

  } catch (error) {
    console.error('Position evaluation error:', error)
    return NextResponse.json({ 
      error: 'Position evaluation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Helper function to detect neutral messages
function isNeutralMessage(message: string): boolean {
  const neutralPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
    /^(thanks|thank you|ok|okay|sure|alright)/i,
    /^(how are you|how's it going|what's up)/i,
    /^(nice to meet you|pleasure to meet you)/i,
    /^(goodbye|bye|see you|talk to you later)/i,
    /^(yes|no|maybe|perhaps|possibly)$/i,
    /^(hmm|hm|uh|um|well)$/i,
    /^(interesting|that's interesting|i see|i understand)$/i
  ]

  const messageText = message.toLowerCase().trim()
  
  // Check if message is very short (likely neutral)
  if (messageText.length < 10) {
    return true
  }

  // Check against neutral patterns
  return neutralPatterns.some(pattern => pattern.test(messageText))
} 