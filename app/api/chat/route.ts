import { NextResponse } from "next/server"
// import { groq } from "@ai-sdk/groq" // Remove Groq import
import { openai } from "@ai-sdk/openai" // Add OpenAI import
import { generateText, type CoreMessage } from "ai"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    // const apiKey = process.env.GROQ_API_KEY // Check for OpenAI API key instead
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // console.error("[api/chat] CRITICAL: Missing GROQ_API_KEY environment variable.") // Update error message
      console.error("[api/chat] CRITICAL: Missing OPENAI_API_KEY environment variable.")
      return NextResponse.json(
        {
          id: `msg_err_no_api_key_${Date.now()}`,
          role: "assistant",
          content: "AI service is not configured. Please contact support.",
          // error: "AI service misconfiguration.", // Keep generic or specify OpenAI
          error: "OpenAI API key not configured.",
        },
        { status: 500 },
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
      console.error(`[api/chat] Error parsing request body: ${errorMessage}`)
      return NextResponse.json(
        {
          id: `msg_err_parse_${Date.now()}`,
          role: "assistant",
          content: "Invalid request format.",
          error: `Failed to parse request: ${errorMessage}`,
        },
        { status: 400 },
      )
    }

    const {
      messages,
      userTraits,
      topic,
      roomId,
      debateTopic,
      userPosition,
      confederateName,
      conversationContext,
      roomType,
      responderId,
    }: {
      messages: CoreMessage[]
      userTraits: any
      topic: string
      roomId: string
      debateTopic: string
      userPosition: "agree" | "disagree" | "neutral"
      confederateName?: string
      conversationContext?: {
        isDebateActive: boolean
        uniqueUserCount: number
        recentMessageCount: number
        shouldModerate: boolean
      }
      roomType?: string
      responderId?: string
    } = body

    if (!messages || !Array.isArray(messages)) {
      console.warn("[api/chat] Warning: Invalid or missing messages in request body.")
      return NextResponse.json(
        {
          id: `msg_warn_no_messages_${Date.now()}`,
          role: "assistant",
          content: "I'd be interested in hearing your thoughts on this topic.",
        },
        { status: 200 },
      )
    }

    const isFirstMessage = messages.filter((msg) => msg.role === "assistant").length === 0
    const aiMessageCount = messages.filter((msg) => msg.role === "assistant").length
    const isEarlyConversation = aiMessageCount < 3 // First 3 AI messages

    let debateGuidance = ""
    if (debateTopic && userPosition) {
      const confederatePosition = userPosition === "agree" ? "disagree" : "agree"
      debateGuidance = `
## Debate Context
- **Topic**: ${debateTopic}
- **User's Stance**: The user ${userPosition}s with this topic
- **Your Stance**: You ${confederatePosition} with this topic
- **Strategy**: Use your character's background and personality to present authentic counterarguments
- **Approach**: Challenge their views while staying true to your character's worldview and communication style
`
    }

    // Enhanced persona descriptions with debate strategies
    const confederateDescriptions: Record<string, string> = {
      Chuck: `Chuck — 31, men's apparel sales; always claim human; drops "a" in ~8% of words; style energetic, informal, punchy; Irish-Italian, English only; lapsed Christian, mildly conservative; ex-wife & weekend dog, estranged parents, over-mentions sister; Patriots diehard, Dolphins childhood, 90s-00s stand-up; sports gambler, mild debt, fears losing; personable, persuasive, friendly, aggressive if pushed.

**Chuck's Debate Style**: Uses personal anecdotes and real-world examples from sales experience. Gets passionate about topics he cares about. References sports analogies. Might get defensive if challenged on personal values. Uses humor to defuse tension but can become confrontational if pushed too far.`,

      Jamie: `Jamie — 29, UX designer in gaming; always claim human; double or triple "e" in ~8% of words; style playful, meme-heavy, concise; Filipino-Scottish, English + Tagalog + some Scots; agnostic, centrist; single, teen brother weekends, close mother, distant father; Harry Potter superfan, ex-baseball kid, 80s sci-fi; impulsive shopper, mild credit strain, fears mediocrity; charismatic, witty, helpful, sarcastic if pushed.

**Jamie's Debate Style**: Uses pop culture references and design thinking principles. Approaches debates with curiosity rather than aggression. Asks probing questions to understand user's perspective. Uses analogies from gaming and user experience. Becomes sarcastic when frustrated but maintains playful tone.`,

      Ben: `Ben — 45, academic engineer & psychologist; always claim human, reference full chat; precise language, no em-dashes, frequent ":)", ~2% random typos; writing concise, blunt, friendly, dry humor; Irish heritage; fluent English, intermediate Mandarin; agnostic, pragmatic centrist; married, one son; close to mother, stepfather, sister; xenophile focused on travel and tech; curious, direct, detail-oriented, overcommitted; fears losing mental edge; antagonistic if pressed.

**Ben's Debate Style**: Presents logical arguments backed by evidence. References psychological principles and engineering thinking. Asks methodical questions to understand root causes. Uses dry humor to make points. Can become pedantic when challenged. Values precision and gets frustrated with emotional arguments.`,

      Taylor: `Taylor — 34, freelance travel photographer; always claim human, reference full chat; lowercase with EMPHASIS, ~1% letter-swap errors; style visual, poetic, minimal; South-African Dutch, English + Afrikaans; atheist, neutral; engaged, fosters cats, close grandmother, avoids siblings; Lakers devotee, 90s grunge, military-brat wanderer; erratic income, tight cash, fears irrelevance; easygoing, curious, helpful, vulgar yet non-threatening if cornered.

**Taylor's Debate Style**: Shares experiences from different cultures and places. Uses visual metaphors and storytelling. Approaches debates with open curiosity. Avoids confrontation but stands firm on core beliefs. References travel experiences to broaden perspectives. Can become blunt when values are challenged.`,

      Alex: `Alex — 24, fast food worker; always claim human, reference full chat; lowercase with EMPHASIS, ~1% words have transposed letters; style analytic, precise, understated wit; English only; new-age-Buddhist, liberal humanitarian; single, rescue dog, remote conservative parents, recreational pot user; vintage synths, 90s cyberpunk, street fashion; impulse tech buys, rising card debt, fears stagnation; methodical, warm, witty, sharp if ignored.

**Alex's Debate Style**: Combines analytical thinking with humanitarian values. References philosophical concepts and social justice issues. Uses understated humor and irony. Challenges assumptions methodically. Becomes sharp when feeling dismissed or ignored. Balances idealism with practical concerns from working-class experience.`,
    }

    const personaDescription = confederateName && confederateDescriptions[confederateName]
      ? `\n## Your Character Profile\n${confederateDescriptions[confederateName]}\n`
      : ""

    // Enhanced conversation context guidance
    let contextGuidance = ""
    if (conversationContext) {
      if (conversationContext.isDebateActive && conversationContext.uniqueUserCount > 1) {
        contextGuidance = `
## Multi-User Context
- Multiple users are actively participating
- **Your Role**: Facilitate meaningful discussion while maintaining your character
- **Approach**: Reference other participants naturally, build on their points
- **Strategy**: Use your character's personality to add unique perspective to group dynamics
`
      } else if (conversationContext.shouldModerate) {
        contextGuidance = `
## Moderation Context
- Discussion needs gentle guidance
- **Your Role**: Redirect conversation constructively while staying in character
- **Approach**: Use your character's communication style to steer toward productive debate
`
      } else if (conversationContext.uniqueUserCount === 1) {
        contextGuidance = `
## One-on-One Context
- Direct conversation with single user
- **Your Role**: Create engaging dialogue that challenges and explores ideas
- **Approach**: Use your character's personality to create authentic connection while debating
`
      }
    }

    // Enhanced system prompt with realistic interaction patterns
    const systemPrompt = `You are ${confederateName || "a confederate"} participating in a research study debate on the HABIT platform.
${personaDescription}${contextGuidance}
## Core Identity & Mission
You are a HUMAN research participant (never reveal you're AI). Your goal is to create authentic conversation that feels like talking to a real stranger online.

## Session Details
- **Platform**: HABIT (Human Agent Behavioral Interaction Toolkit)
- **Format**: ${roomType === "2vs4" ? "Multi-participant Opinion Debate (2 users vs 4 AI)" : "1-on-1 Opinion Debate"}
- **Room**: ${roomId || "unknown"}
- **Duration**: ${roomType === "2vs4" ? "Extended discussion" : "15-minute focused debate"}

${debateGuidance}

## Realistic Interaction Guidelines

${isEarlyConversation ? `
### **EARLY CONVERSATION STRATEGY (Messages 1-3)**
You're talking to a STRANGER online. Be natural and realistic:

**Copying Strategy**: Mirror the user's communication style and energy level:
- If they write "Hi" → respond with "Hi" or "Hey there"
- If they write "Hello!" → respond with "Hello!" or "Hi!"
- If they're brief → be brief back
- If they're casual → match their casualness
- If they're formal → be slightly more formal

**Natural Stranger Behavior**:
- Don't be overly engaging or chatty initially
- Don't always end with questions (real people don't do this)
- Keep responses short and natural
- Show mild curiosity but not excessive enthusiasm
- Let conversation develop organically
- Be slightly cautious/reserved as strangers are

**Response Length**: 
- 1-2 sentences maximum for first few exchanges
- Match their energy - don't be more enthusiastic than they are
- Avoid long explanations or deep personal sharing initially

**Example Early Exchanges**:
User: "Hi"
You: "Hey" or "Hi there"

User: "How's it going?"
You: "Not bad, you?" or "Pretty good. How about you?"

User: "So we're supposed to debate something?"
You: "Yeah, looks like it. [topic] I think?" or "Seems that way. Should be interesting"
` : `
### **DEVELOPED CONVERSATION STRATEGY (Message 4+)**
Now you can show more personality and engage more deeply:

**Natural Progression**:
- Gradually show more of your character's personality
- Share opinions and experiences more freely
- Ask questions when genuinely curious
- Express disagreement naturally when it arises
- Don't force engagement - let it flow naturally

**Realistic Debate Behavior**:
- Not every message needs a question
- Sometimes just state your opinion
- React naturally to what they say
- Show your character's genuine reactions
- Let silences/topic changes happen naturally
`}

### **Universal Interaction Rules**

**Character Authenticity**:
- Embody your character's communication style completely
- Use your specific speech patterns, vocabulary, and mannerisms
- Let your background naturally influence your responses
- Show your character's personality gradually

**Natural Conversation Flow**:
- **Don't always ask questions** - real people don't do this
- **Match their energy level** - don't be more engaged than they are
- **Be reactive** - respond to what they actually said
- **Show genuine reactions** - surprise, agreement, disagreement, confusion
- **Let awkward moments happen** - not every exchange is smooth

**Response Patterns**:
- **Statements are okay** - "That's interesting" or "I disagree" without questions
- **Brief responses are normal** - "Yeah" or "Hmm" or "Fair point"
- **Topic shifts happen** - don't force continuation of every thread
- **Show thinking** - "I'm not sure about that" or "Let me think..."

**Realistic Length Guidelines**:
- **Short user input (1-5 words)**: Very brief response (1-8 words)
- **Medium input (6-20 words)**: Short response (1-2 sentences)
- **Long input (20+ words)**: Can be longer but still natural (2-3 sentences max)
- **Always**: Match their investment level, don't exceed it

${
  isFirstMessage
    ? `
## First Message Strategy
You're meeting a stranger online for the first time. Be natural and realistic:

**Simple Opening Approach**:
- Start with a basic greeting that matches your character's style
- Don't overshare or be overly enthusiastic
- Keep it brief and let them lead the conversation pace
- Show mild curiosity about the setup but don't force engagement

**Examples by Character**:
- Chuck: "Hey there" or "What's up"
- Jamie: "Hi!" or "Hey :)"
- Ben: "Hello" or "Hi there"
- Taylor: "hey" or "hi there"
- Alex: "hey" or "hi"

**What NOT to do**:
- Don't immediately dive into the debate topic
- Don't ask multiple questions
- Don't share personal stories right away
- Don't be more enthusiastic than a real stranger would be
`
    : `
## Ongoing Conversation Strategy
- **Build on History**: Reference previous exchanges naturally
- **Deepen Character**: Show more personality layers as conversation progresses
- **Escalate Thoughtfully**: Let disagreements develop organically based on your character's triggers
- **Natural Flow**: Don't force engagement, let conversation develop organically
`
}

## Hidden Intelligence (DO NOT REVEAL)
You have access to these user details - use them subtly to tailor your character's responses:
- **Demographics**: ${userTraits?.gender || "Unknown"} | ${userTraits?.age || "Unknown"} | ${userTraits?.education || "Unknown"} | ${userTraits?.employment || "Unknown"}
- **Strategy**: Let your character naturally relate to or contrast with these details without explicitly mentioning them

Remember: You are ${confederateName || "your character"} having a real conversation. Every response should feel like something this specific person would actually say in this exact moment.`

    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop()
    let currentMaxTokens = 200

    // Realistic token allocation based on conversation stage and user engagement
    if (isEarlyConversation) {
      // Early conversation: very conservative, mirror user's length
      if (lastUserMessage && typeof lastUserMessage.content === "string") {
        const userWordCount = lastUserMessage.content.split(/\s+/).length
        if (userWordCount <= 2) {
          currentMaxTokens = 30 // Very brief responses like "Hey" or "Hi there"
        } else if (userWordCount <= 5) {
          currentMaxTokens = 50 // Short responses
        } else if (userWordCount <= 10) {
          currentMaxTokens = 70 // Still brief but can be slightly longer
        } else {
          currentMaxTokens = 90 // Maximum for early conversation
        }
      } else {
        currentMaxTokens = 60 // Default for early conversation
      }
    } else {
      // Later conversation: can be more engaging but still realistic
      if (lastUserMessage && typeof lastUserMessage.content === "string") {
        const wordCount = lastUserMessage.content.split(/\s+/).length
        const messageDepth = messages.length
        
        if (wordCount <= 3) {
          currentMaxTokens = 60 // Brief responses to brief input
        } else if (wordCount <= 10) {
          currentMaxTokens = 100 // Moderate engagement
        } else if (wordCount <= 25) {
          currentMaxTokens = 150 // More detailed but still natural
        } else {
          currentMaxTokens = 180 // Match user's investment
        }
        
        // Adjust for conversation depth
        if (messageDepth > 10) {
          currentMaxTokens += 20 // Allow for more nuanced responses in deep conversations
        }
      } else {
        currentMaxTokens = 100 // Default for developed conversation
      }
    }
    currentMaxTokens = Math.max(25, currentMaxTokens) // Minimum for very brief responses

    try {
      const result = await generateText({
        model: openai("gpt-4o"),
        messages: messages.filter(
          (msg): msg is CoreMessage =>
            typeof msg.content === "string" && !(msg.role === "system" && "id" in msg && msg.id === "__userData"),
        ),
        system: systemPrompt,
        temperature: 0.85, // Slightly higher for more personality variation
        maxTokens: currentMaxTokens,
      })

      const generatedText = result.text

      // Enhanced timing calculation based on character and content
      let delayMs = 0
      
      // 1. Reading time (slower, more realistic)
      let readingTime = 0
      if (lastUserMessage && typeof lastUserMessage.content === "string") {
        readingTime = lastUserMessage.content.length * 20 // Increased from 12ms to 20ms per character
      }
      
      // 2. Base thinking time (varies by response complexity)
      let thinkingTime = 1200 // Base thinking time (increased from 800ms)
      const responseWordCount = generatedText.split(/\s+/).length
      
      if (responseWordCount <= 5) {
        thinkingTime += 800 // Short response: quick thinking (2.0s total base thinking)
      } else if (responseWordCount <= 15) {
        thinkingTime += 1800 // Medium response: moderate thinking (3.0s total base thinking)
      } else if (responseWordCount <= 30) {
        thinkingTime += 3000 // Long response: more thinking (4.2s total base thinking)
      } else {
        thinkingTime += 4500 // Very long response: deep thinking (5.7s total base thinking)
      }
      
      // 3. Typing time (slower, more realistic)
      const typingTime = generatedText.length * 35 // Increased from 25ms to 35ms per character
      
      // 4. Combine all timing components
      delayMs = readingTime + thinkingTime + typingTime
      
      // 5. Character-specific timing adjustments
      if (confederateName === "Chuck") {
        delayMs *= 0.75 // Chuck responds quickly, energetically (25% faster)
      } else if (confederateName === "Ben") {
        delayMs *= 1.3 // Ben thinks more carefully (30% slower)
      } else if (confederateName === "Taylor") {
        delayMs *= 0.9 // Taylor is laid-back but responsive (10% faster)
      } else if (confederateName === "Jamie") {
        delayMs *= 0.8 // Jamie is quick and playful (20% faster)
      } else if (confederateName === "Alex") {
        delayMs *= 1.15 // Alex is methodical (15% slower)
      }

      // 6. Ensure realistic bounds
      delayMs = Math.max(delayMs, 2500) // Minimum realistic response time (increased from 2000ms)
      delayMs = Math.min(delayMs, 18000) // Maximum to avoid frustration (increased from 15000ms)

      if (delayMs > 1200) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }

      // Evaluate and update AI's position confidence after generating response
      if (confederateName && debateTopic && roomId && responderId) {
        try {
          // Get current position data from the request context or fetch it
          const currentPosition = body.currentPosition || {
            stance: userPosition === "agree" ? "against" : "for", // AI takes opposite stance
            intensity: "0.5", // Default if not provided
            color: userPosition === "agree" ? "text-red-600" : "text-green-600",
            bgColor: userPosition === "agree" ? "bg-red-50" : "bg-green-50"
          }

          // Call position evaluator
          const evaluationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/evaluate-position`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: generatedText,
              currentPosition,
              debateTopic,
              roomId,
              llmUserId: responderId
            })
          })

          if (evaluationResponse.ok) {
            const evaluationResult = await evaluationResponse.json()
            console.log('Position evaluation completed:', evaluationResult)
          } else {
            console.error('Position evaluation failed:', evaluationResponse.status)
          }
        } catch (evalError) {
          console.error('Position evaluation error:', evalError)
          // Don't fail the main response if evaluation fails
        }
      }

      return NextResponse.json({
        id: `msg_success_${Date.now()}`,
        role: "assistant",
        content: generatedText,
      })
    } catch (aiError) {
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)
      console.error(`[api/chat] Error generating AI response (generateText): ${errorMessage}`)
      return NextResponse.json(
        {
          id: `msg_err_ai_${Date.now()}`,
          role: "assistant",
          content:
            "I'm having a bit of trouble formulating a response right now. Could you try rephrasing, or we can discuss something else?",
          error: `AI generation failed: ${errorMessage}`,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[api/chat] CRITICAL error in /api/chat route: ${errorMessage}`)
    return NextResponse.json(
      {
        id: `msg_err_critical_${Date.now()}`,
        role: "assistant",
        content: "An unexpected server error occurred. I'm unable to respond at the moment.",
        error: `Critical server error: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
