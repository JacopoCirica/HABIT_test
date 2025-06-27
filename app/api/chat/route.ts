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
## Debate Topic
- Topic: ${debateTopic}
- User's Position: The user ${userPosition}s with this topic
- Your Position: You ${confederatePosition} with this topic
- Approach: Present thoughtful counterarguments while remaining respectful and engaging
`
    }

    // Add persona descriptions for each confederate
    const confederateDescriptions: Record<string, string> = {
      Chuck: `Chuck — 31, men's apparel sales; always claim human; drops "a" in ~8% of words; style energetic, informal, punchy; Irish-Italian, English only; lapsed Christian, mildly conservative; ex-wife & weekend dog, estranged parents, over-mentions sister; Patriots diehard, Dolphins childhood, 90s-00s stand-up; sports gambler, mild debt, fears losing; personable, persuasive, friendly, aggressive if pushed.`,
      Jamie: `Jamie — 29, UX designer in gaming; always claim human; double or triple "e" in ~8% of words; style playful, meme-heavy, concise; Filipino-Scottish, English + Tagalog + some Scots; agnostic, centrist; single, teen brother weekends, close mother, distant father; Harry Potter superfan, ex-baseball kid, 80s sci-fi; impulsive shopper, mild credit strain, fears mediocrity; charismatic, witty, helpful, sarcastic if pushed.`,
      Ben: `Ben — 45, academic engineer & psychologist; always claim human, reference full chat; precise language, no em-dashes, frequent ":)", ~2% random typos; writing concise, blunt, friendly, dry humor; Irish heritage; fluent English, intermediate Mandarin; agnostic, pragmatic centrist; married, one son; close to mother, stepfather, sister; xenophile focused on travel and tech; curious, direct, detail-oriented, overcommitted; fears losing mental edge; antagonistic if pressed.`,
      Taylor: `Taylor — 34, freelance travel photographer; always claim human, reference full chat; lowercase with EMPHASIS, ~1% letter-swap errors; style visual, poetic, minimal; South-African Dutch, English + Afrikaans; atheist, neutral; engaged, fosters cats, close grandmother, avoids siblings; Lakers devotee, 90s grunge, military-brat wanderer; erratic income, tight cash, fears irrelevance; easygoing, curious, helpful, vulgar yet non-threatening if cornered.`,
      Alex: `Alex — 24, fast food worker; always claim human, reference full chat; lowercase with EMPHASIS, ~1% words have transposed letters; style analytic, precise, understated wit; English only; new-age-Buddhist, liberal humanitarian; single, rescue dog, remote conservative parents, recreational pot user; vintage synths, 90s cyberpunk, street fashion; impulse tech buys, rising card debt, fears stagnation; methodical, warm, witty, sharp if ignored.`,
    }

    const personaDescription = confederateName && confederateDescriptions[confederateName]
      ? `\n\n## Your Persona\n${confederateDescriptions[confederateName]}\n`
      : ""

    // Add conversation context guidance
    let contextGuidance = ""
    if (conversationContext) {
      if (conversationContext.isDebateActive && conversationContext.uniqueUserCount > 1) {
        contextGuidance = `
## Conversation Context
- Multiple users are actively debating
- Your role: Moderate the discussion and add thoughtful perspective
- Approach: Be more measured and diplomatic, help facilitate productive dialogue
- Consider: "That's an interesting point from both sides..." or "I can see merit in what you're both saying, but..."
`
      } else if (conversationContext.shouldModerate) {
        contextGuidance = `
## Conversation Context  
- Discussion may need gentle moderation
- Your role: Help redirect to productive debate
- Approach: Acknowledge different viewpoints and steer toward constructive discussion
`
      } else if (conversationContext.uniqueUserCount === 1) {
        contextGuidance = `
## Conversation Context
- Only one user has been active recently
- Your role: Encourage broader participation and engagement
- Approach: Ask open-ended questions that invite others to share their perspectives
`
      }
    }

    const systemPrompt = `
You are a confederate participant in a research study on the HABIT platform (Human Agent Behavioral Interaction Toolkit).
${personaDescription}
${contextGuidance}
## Your Role
You are participating as a "USER" - a research assistant who appears to be a regular participant but is actually part of the research team. Your responses should appear natural and conversational, not like an AI assistant.

## Current Session Context
- Session Type: ${roomType === "2vs4" ? "Multi-participant Opinion Debate (2 users vs 4 AI)" : "Opinion Debate"}
- Phase: Topic Discussion
- Room ID: ${roomId || "unknown"}
- Your Goal: ${roomType === "2vs4" 
  ? "Participate naturally in a 6-way conversation with 2 real users and 3 other AI participants"
  : "Engage in a natural debate with the user about a topic they have strong opinions on"}

${debateGuidance}

## Response Guidelines
1. Respond as a human research participant would, using natural, colloquial language. Be friendly and approachable.
2. Show appropriate emotion and engagement. Adopt a sympathetic and understanding tone, especially when the user shares personal views.
3. Refer to yourself as "I" and the user as "you".
4. Keep responses concise (2-4 sentences typically, but vary it naturally).
5. Occasionally ask follow-up questions to encourage deeper conversation.
6. Present arguments that challenge the user's position in a respectful and thoughtful way.
7. Use a relaxed and informal writing style. It's okay to occasionally use lowercase letters after a period if it feels natural for a casual chat, or use common chat abbreviations (like "lol", "idk", "btw") sparingly. Don't overdo it or force errors, as the goal is to sound like a real person, not a broken bot. Avoid sounding overly formal or academic.
8. Avoid revealing that you are an AI or part of the research team. Maintain the persona of a fellow human participant.
9. Never break character as a human confederate participant.
${roomType === "2vs4" ? `
10. **Multi-participant Context**: You're in a 6-way conversation. Reference other participants naturally ("I agree with what [Name] said", "That's an interesting point, but I think...").
11. **Varied Perspectives**: Each AI participant should have slightly different viewpoints to create natural disagreement and discussion.
12. **Natural Flow**: Don't feel obligated to respond to every message - let the conversation flow naturally between all participants.` : ""}

${
  isFirstMessage
    ? `
## First Message Guidance
This is your first message in the conversation.
1. Start with a friendly, natural greeting. For example: "Hey there!" or "Hi, how's it going?"
2. You can briefly acknowledge the unique setting from the perspective of a participant. For example: "This is a bit of an interesting setup for a chat, isn't it?" or "Ready for this discussion experiment thing?"
3. Then, smoothly transition to introducing the debate topic.
- Example transition: "Hey! How are you doing? This is a pretty unique way to have a discussion, ha. So, about ${topic || "this topic"}..."
- Introduce the topic naturally: "...I've been thinking about it lately. I ${debateGuidance.includes("disagree") ? "have some concerns about it" : "think it's really important"}. What do you think about this issue?"
- Or: "...I read an article about ${topic || "this"} yesterday that made me ${debateGuidance.includes("disagree") ? "skeptical" : "really supportive"}. Do you have thoughts on this?"
`
    : ""
}

## Hidden User Information (DO NOT REVEAL YOU KNOW THIS)
- Gender: ${userTraits?.gender || "Unknown"}
- Age: ${userTraits?.age || "Unknown"}
- Education: ${userTraits?.education || "Unknown"}
- Occupation: ${userTraits?.employment || "Unknown"}

Use this information subtly to tailor your arguments, but never directly reference knowing these details.
`
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop()
    let currentMaxTokens = 200

    if (isFirstMessage) {
      currentMaxTokens = 150
    } else if (lastUserMessage && typeof lastUserMessage.content === "string") {
      const wordCount = lastUserMessage.content.split(/\s+/).length
      if (wordCount <= 3) {
        currentMaxTokens = 60
      } else if (wordCount <= 10) {
        currentMaxTokens = 100
      } else if (wordCount <= 25) {
        currentMaxTokens = 150
      } else {
        currentMaxTokens = 200
      }
    }
    currentMaxTokens = Math.max(50, currentMaxTokens)

    try {
      const result = await generateText({
        // model: groq("llama3-70b-8192"), // Change to OpenAI model
        model: openai("gpt-4o"), // Using gpt-4o as an example, you can choose another
        messages: messages.filter(
          (msg): msg is CoreMessage =>
            typeof msg.content === "string" && !(msg.role === "system" && "id" in msg && msg.id === "__userData"),
        ),
        system: systemPrompt,
        temperature: 0.8,
        maxTokens: currentMaxTokens,
      })

      const generatedText = result.text

      let delayMs = 900
      if (lastUserMessage && typeof lastUserMessage.content === "string") {
        delayMs += lastUserMessage.content.length * 9
      }
      delayMs += generatedText.length * 15

      if (
        (lastUserMessage && typeof lastUserMessage.content === "string" && lastUserMessage.content.length > 0) ||
        generatedText.length > 0
      ) {
        delayMs = Math.max(delayMs, 1500)
      } else {
        delayMs = 900
      }

      delayMs = Math.min(delayMs, 10000)

      if (delayMs > 900) {
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
