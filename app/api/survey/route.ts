import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { responses, sessionData } = body

    console.log("API: Saving survey responses to Supabase:", {
      responses,
      sessionData,
      timestamp: new Date().toISOString(),
    })

    // Prepare data for database insertion
    const surveyData = {
      room_id: sessionData.roomId || null,
      user_id: sessionData.userId,
      room_type: sessionData.roomType,
      session_duration: sessionData.sessionDuration,
      
      // Survey responses
      clarity: responses.clarity,
      naturalness: responses.naturalness,
      difficulty: responses.difficulty,
      engagement: responses.engagement,
      
      // AI detection
      suspected_ai: responses.suspectedAI,
      ai_suspicion_reason: responses.aiSuspicionReason || null,
      
      // Overall experience
      overall_experience: responses.overallExperience,
      improvements: responses.improvements || null,
      would_participate_again: responses.wouldParticipateAgain,
      additional_comments: responses.additionalComments || null,
    }

    console.log("API: Inserting survey data:", surveyData)

    // Insert into Supabase
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([surveyData])
      .select()
      .single()

    if (error) {
      console.error("API: Supabase error saving survey:", error)
      return NextResponse.json(
        { error: `Failed to save survey to database: ${error.message}` },
        { status: 500 }
      )
    }

    console.log("API: Survey saved successfully to Supabase:", data)

    // Analyze the responses
    const analysis = {
      suspectedAI: responses.suspectedAI === "yes",
      overallSatisfaction: Number.parseInt(responses.overallExperience) || 0,
      conversationQuality: {
        clarity: Number.parseInt(responses.clarity) || 0,
        naturalness: Number.parseInt(responses.naturalness) || 0,
        engagement: Number.parseInt(responses.engagement) || 0,
      },
      wouldReturnUser: ["definitely", "probably"].includes(responses.wouldParticipateAgain),
    }

    console.log("API: Survey analysis:", analysis)

    return NextResponse.json({ 
      success: true, 
      analysis,
      surveyId: data.id,
      timestamp: data.created_at
    })

  } catch (error) {
    console.error("API: Error saving survey:", error)
    return NextResponse.json(
      { error: "Failed to save survey responses" },
      { status: 500 }
    )
  }
} 