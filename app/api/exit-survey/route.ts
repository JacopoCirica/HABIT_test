import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      satisfaction, 
      feedback, 
      sessionType, 
      userId, 
      roomId,
      sessionDuration 
    } = body

    console.log("API: Saving exit survey responses:", {
      satisfaction,
      feedback,
      sessionType,
      userId,
      roomId,
      sessionDuration,
      timestamp: new Date().toISOString(),
    })

    // Prepare data for dedicated exit_surveys table
    const exitSurveyData = {
      user_id: userId,
      room_id: roomId || null,
      session_type: sessionType,
      satisfaction_rating: parseInt(satisfaction),
      feedback: feedback || null,
      session_duration: sessionDuration || null
    }

    console.log("API: Inserting exit survey data:", exitSurveyData)

    // Insert into dedicated exit_surveys table
    const { data, error } = await supabase
      .from('exit_surveys')
      .insert([exitSurveyData])
      .select()
      .single()

    if (error) {
      console.error("API: Supabase error saving exit survey:", error)
      return NextResponse.json(
        { error: `Failed to save exit survey: ${error.message}` },
        { status: 500 }
      )
    }

    console.log("API: Exit survey saved successfully:", data)

    return NextResponse.json({ 
      success: true, 
      surveyId: data.id,
      timestamp: data.created_at
    })

  } catch (error) {
    console.error("API: Error saving exit survey:", error)
    return NextResponse.json(
      { error: "Failed to save exit survey responses" },
      { status: 500 }
    )
  }
} 