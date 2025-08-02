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

    // Prepare data for database insertion
    const surveyData = {
      user_id: userId,
      room_id: roomId || null,
      session_type: sessionType,
      session_duration: sessionDuration || null,
      satisfaction_rating: parseInt(satisfaction),
      feedback: feedback || null,
      survey_type: 'exit_survey',
      created_at: new Date().toISOString()
    }

    console.log("API: Inserting exit survey data:", surveyData)

    // Insert into Supabase - using the existing survey_responses table
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([surveyData])
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