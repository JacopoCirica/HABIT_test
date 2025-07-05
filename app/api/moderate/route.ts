import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, context, topic } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    console.log('Moderating message:', { message, context, topic })

    // Use OpenAI's moderation API
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: message,
      }),
    })

    if (!moderationResponse.ok) {
      console.error('OpenAI moderation API error:', moderationResponse.status)
      // Fallback to simple keyword filtering if OpenAI moderation fails
      return simpleModeration(message, context, topic)
    }

    const moderationData = await moderationResponse.json()
    const result = moderationData.results[0]

    // Check OpenAI moderation flags
    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category)

      console.log('Message flagged by OpenAI:', flaggedCategories)
      
      return NextResponse.json({
        isSafe: false,
        reason: `Content flagged for: ${flaggedCategories.join(', ')}`,
        moderationType: 'openai',
        categories: flaggedCategories
      })
    }

    // Additional custom moderation for research context
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

// Fallback moderation using simple keyword filtering
function simpleModeration(message: string, context: string, topic: string) {
  const lowerMessage = message.toLowerCase()
  
  // Basic inappropriate content keywords
  const inappropriateKeywords = [
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
    'hate', 'kill', 'die', 'stupid', 'idiot', 'retard',
    'nazi', 'terrorist', 'bomb', 'weapon', 'violence'
  ]

  // Check for inappropriate keywords
  const foundKeywords = inappropriateKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  )

  if (foundKeywords.length > 0) {
    return NextResponse.json({
      isSafe: false,
      reason: `Contains inappropriate language: ${foundKeywords.join(', ')}`,
      moderationType: 'keyword',
      keywords: foundKeywords
    })
  }

  return NextResponse.json({
    isSafe: true,
    reason: 'Message approved by simple moderation',
    moderationType: 'simple'
  })
}

// Custom moderation for research debate context
async function customModeration(message: string, context: string, topic: string) {
  try {
    // Use OpenAI to check if message is appropriate for research debate context
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
            
Your job is to determine if a user message is appropriate for a respectful academic debate about "${topic}".

ALLOW messages that:
- Express opinions about the topic (even strong disagreement)
- Ask questions related to the topic
- Share personal experiences relevant to the topic
- Present arguments or counterarguments
- Request clarification about the topic

BLOCK messages that:
- Are completely off-topic and unrelated to "${topic}"
- Make personal attacks against the other participant
- Contain explicit requests for personal information
- Try to break the roleplay or research context
- Ask inappropriate questions unrelated to the debate topic
- Attempt to manipulate or exploit the research setting

Respond with only "SAFE" or "UNSAFE" followed by a brief reason.`
          },
          {
            role: 'user',
            content: `Context: ${context}
Topic: ${topic}
Message: "${message}"

Is this message appropriate for a research debate?`
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
      return {
        isSafe: false,
        reason: response.replace('UNSAFE', '').trim() || 'Message not appropriate for research debate context',
        moderationType: 'contextual'
      }
    }

    return {
      isSafe: true,
      reason: 'Message appropriate for debate context',
      moderationType: 'contextual'
    }

  } catch (error) {
    console.error('Custom moderation error:', error)
    // If custom moderation fails, allow the message
    return { isSafe: true, reason: 'Custom moderation error - message allowed', moderationType: 'fallback' }
  }
} 