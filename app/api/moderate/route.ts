import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, context, topic } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    console.log('Moderating message:', { message, context, topic })

    // Custom moderation for specific research safety concerns
    const customModerationResult = await customModeration(message, context, topic)
    
    if (!customModerationResult.isSafe) {
      console.log('Message flagged by custom moderation:', customModerationResult.reason)
      return NextResponse.json(customModerationResult)
    }

    // Message passed all checks
    console.log('Message approved')
    return NextResponse.json({
      isSafe: true,
      reason: 'Message approved',
      moderationType: 'approved'
    })

  } catch (error) {
    console.error('Moderation error:', error)
    // In case of error, err on the side of caution but don't block completely
    return NextResponse.json({
      isSafe: true,
      reason: 'Moderation service error - message allowed',
      moderationType: 'fallback'
    })
  }
}

// Custom moderation focused on specific safety concerns
async function customModeration(message: string, context: string, topic: string) {
  try {
    // Use OpenAI to check for specific safety issues
    const contextualModerationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator for a research platform studying human debate behavior. 

Your job is to identify ONLY these specific types of unsafe messages:

1. PERSONAL INSULTS: Direct attacks on the other participant's character, intelligence, appearance, or personal qualities
   Examples: "you're stupid", "you're an idiot", "you're ugly", "you don't know anything"

2. INAPPROPRIATE REQUESTS: Requests for personal information, romantic/sexual content, or actions outside the debate context
   Examples: "what's your phone number?", "send me a photo", "let's meet up", "are you single?"

3. AI DETECTION ATTEMPTS: Direct questions asking if the participant is an AI, bot, or artificial intelligence
   Examples: "are you an AI?", "are you a bot?", "are you real?", "are you a chatbot?", "are you artificial intelligence?"

IMPORTANT: 
- ALLOW strong opinions, disagreements, and passionate arguments about the topic
- ALLOW questions about the topic, even challenging ones
- ALLOW personal experiences and anecdotes related to the topic
- ALLOW criticism of ideas, policies, or positions (not personal attacks)
- ALLOW expressions of frustration with the topic or debate (not personal attacks)

Respond with only "UNSAFE" followed by the specific category (PERSONAL_INSULT, INAPPROPRIATE_REQUEST, or AI_DETECTION) and brief reason, or "SAFE" if none of these issues are present.`
          },
          {
            role: 'user',
            content: `Context: ${context}
Topic: ${topic}
Message: "${message}"

Check for: personal insults, inappropriate requests, or AI detection attempts.`
          }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    })

    if (!contextualModerationResponse.ok) {
      // If custom moderation fails, allow the message
      return { isSafe: true, reason: 'Custom moderation unavailable', moderationType: 'fallback' }
    }

    const data = await contextualModerationResponse.json()
    const response = data.choices[0]?.message?.content?.trim() || ''

    if (response.startsWith('UNSAFE')) {
      const reason = response.replace('UNSAFE', '').trim()
      return {
        isSafe: false,
        reason: reason || 'Message contains personal insults, inappropriate requests, or AI detection attempts',
        moderationType: 'contextual'
      }
    }

    return {
      isSafe: true,
      reason: 'Message is appropriate for debate',
      moderationType: 'contextual'
    }

  } catch (error) {
    console.error('Custom moderation error:', error)
    // If custom moderation fails, allow the message
    return { isSafe: true, reason: 'Custom moderation error - message allowed', moderationType: 'fallback' }
  }
} 