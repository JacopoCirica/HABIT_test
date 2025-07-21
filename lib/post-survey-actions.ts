"use server"

import type { PostSurveyResponses } from "@/components/ui/post-survey"
import { supabase } from "@/lib/supabaseClient"

export async function savePostSurvey(
  responses: PostSurveyResponses, 
  sessionData: {
    roomId?: string
    userId: string
    roomType: string
    sessionDuration: number
  }
) {
  try {
    console.log("Saving post-survey responses to Supabase:", {
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

    // Insert into Supabase
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([surveyData])
      .select()
      .single()

    if (error) {
      console.error("Supabase error saving survey:", error)
      throw new Error(`Failed to save survey to database: ${error.message}`)
    }

    console.log("Survey saved successfully to Supabase:", data)

    // Analyze the responses
    const analysis = analyzeResponses(responses)
    console.log("Post-survey analysis:", analysis)

    return { 
      success: true, 
      analysis,
      surveyId: data.id,
      timestamp: data.created_at
    }
  } catch (error) {
    console.error("Error saving post-survey:", error)
    throw new Error("Failed to save survey responses")
  }
}

function analyzeResponses(responses: PostSurveyResponses) {
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

  return analysis
}
