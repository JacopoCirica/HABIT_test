"use server"

import type { PostSurveyResponses } from "@/components/ui/post-survey" // Updated import path

export async function savePostSurvey(responses: PostSurveyResponses, sessionData?: any) {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, you would save this to your database
    console.log("Saving post-survey responses:", {
      responses,
      sessionData,
      timestamp: new Date().toISOString(),
    })

    // You could also analyze the responses here
    const analysis = analyzeResponses(responses)
    console.log("Post-survey analysis:", analysis)

    return { success: true, analysis }
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
