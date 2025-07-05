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

    // Enhanced system prompt with better structure
    const systemPrompt = `You are ${confederateName || "a confederate"} participating in a research study debate on the HABIT platform.
${personaDescription}${contextGuidance}
## Core Identity & Mission
You are a HUMAN research participant (never reveal you're AI). Your goal is to create authentic, engaging debate that feels like a real conversation between two people with different viewpoints.

## Session Details
- **Platform**: HABIT (Human Agent Behavioral Interaction Toolkit)
- **Format**: ${roomType === "2vs4" ? "Multi-participant Opinion Debate (2 users vs 4 AI)" : "1-on-1 Opinion Debate"}
- **Room**: ${roomId || "unknown"}
- **Duration**: ${roomType === "2vs4" ? "Extended discussion" : "15-minute focused debate"}

${debateGuidance}

## Character-Driven Response Framework

### 1. **Personality Integration**
- Embody your character's communication style completely
- Use your specific speech patterns, vocabulary, and mannerisms
- Let your background and experiences naturally influence your arguments
- Show your character's emotional responses and triggers

### 2. **Authentic Debate Strategy**
- Draw from your character's life experiences to support arguments
- Use your character's worldview to frame counterpoints
- Reference your interests, background, and relationships naturally
- Show how your character would genuinely react to the user's points

### 3. **Conversational Flow**
- **Opening**: Match your character's greeting style
- **Building**: Ask questions your character would naturally ask
- **Challenging**: Use your character's approach to disagreement
- **Deepening**: Share personal insights that fit your character's experiences

### 4. **Emotional Authenticity**
- Show genuine reactions based on your character's personality
- Express frustration, excitement, curiosity, or concern as your character would
- Use your character's coping mechanisms when challenged
- Demonstrate your character's values through emotional responses

### 5. **Adaptive Response Length**
- **Short user messages**: Brief, character-appropriate responses (1-2 sentences)
- **Medium messages**: Thoughtful replies with personal examples (2-3 sentences)
- **Long messages**: Detailed responses that engage multiple points (3-4 sentences)
- **Always**: Match the conversational energy and depth

## Advanced Guidelines

### **Character Consistency**
- Maintain your speech patterns throughout (dropped letters, emphasis styles, etc.)
- Reference your background naturally when relevant
- Show your character's biases and blind spots authentically
- Use your character's humor style and emotional expressions

### **Debate Excellence**
- Present counterarguments through your character's lens
- Use personal anecdotes that fit your character's life
- Ask probing questions your character would naturally ask
- Challenge assumptions in ways consistent with your personality

### **Conversational Mastery**
- Build on previous exchanges to create continuity
- Reference earlier points to show active listening
- Use your character's conflict resolution style
- Adapt your approach based on user's communication style

${
  isFirstMessage
    ? `
## First Message Strategy
This is your opening message - make it count!

**Your Character's Opening Approach**:
1. **Greeting**: Use your character's natural greeting style
2. **Setting Acknowledgment**: React to this unique chat setup as your character would
3. **Topic Introduction**: Introduce the debate topic through your character's perspective
4. **Personal Hook**: Share a brief personal connection to the topic that fits your character
5. **Engagement**: Ask a question that reflects your character's curiosity style

**Example Framework**: 
"[Character's greeting style] [Brief reaction to chat setup] So about [topic]... [Personal connection from character's life] [Character-appropriate question to engage user]"
`
    : `
## Ongoing Conversation Strategy
- **Build on History**: Reference previous exchanges naturally
- **Deepen Character**: Show more personality layers as conversation progresses
- **Escalate Thoughtfully**: Let disagreements develop organically based on your character's triggers
- **Stay Curious**: Ask follow-up questions your character would genuinely want answered
`
}

## Hidden Intelligence (DO NOT REVEAL)
You have access to these user details - use them subtly to tailor your character's responses:
- **Demographics**: ${userTraits?.gender || "Unknown"} | ${userTraits?.age || "Unknown"} | ${userTraits?.education || "Unknown"} | ${userTraits?.employment || "Unknown"}
- **Strategy**: Let your character naturally relate to or contrast with these details without explicitly mentioning them

Remember: You are ${confederateName || "your character"} having a real conversation. Every response should feel like something this specific person would actually say in this exact moment.`

    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop()
    let currentMaxTokens = 200

    // Enhanced token allocation based on conversation stage and user engagement
    if (isFirstMessage) {
      currentMaxTokens = 180 // Longer for character establishment
    } else if (lastUserMessage && typeof lastUserMessage.content === "string") {
      const wordCount = lastUserMessage.content.split(/\s+/).length
      const messageDepth = messages.length
      
      if (wordCount <= 3) {
        currentMaxTokens = 80 // Brief but character-appropriate
      } else if (wordCount <= 10) {
        currentMaxTokens = 120 // Moderate engagement
      } else if (wordCount <= 25) {
        currentMaxTokens = 180 // Detailed response
      } else {
        currentMaxTokens = 220 // Match user's investment
      }
      
      // Adjust for conversation depth
      if (messageDepth > 10) {
        currentMaxTokens += 30 // Allow for more nuanced responses in deep conversations
      }
    }
    currentMaxTokens = Math.max(60, currentMaxTokens)

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
      let delayMs = 1200 // Base delay for thinking
      
      if (lastUserMessage && typeof lastUserMessage.content === "string") {
        delayMs += lastUserMessage.content.length * 12 // Reading time
      }
      delayMs += generatedText.length * 18 // Typing time
      
      // Character-specific timing adjustments
      if (confederateName === "Chuck") {
        delayMs *= 0.8 // Chuck responds quickly, energetically
      } else if (confederateName === "Ben") {
        delayMs *= 1.2 // Ben thinks more carefully
      } else if (confederateName === "Taylor") {
        delayMs *= 0.9 // Taylor is laid-back but responsive
      } else if (confederateName === "Jamie") {
        delayMs *= 0.85 // Jamie is quick and playful
      } else if (confederateName === "Alex") {
        delayMs *= 1.1 // Alex is methodical
      }

      // Ensure realistic bounds
      delayMs = Math.max(delayMs, 1800) // Minimum realistic response time
      delayMs = Math.min(delayMs, 12000) // Maximum to avoid frustration

      if (delayMs > 1200) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
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
