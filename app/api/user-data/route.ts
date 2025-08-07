import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      email, 
      userId, 
      personalInfo, 
      opinions 
    } = body

    console.log("API: Saving user data to Supabase:", {
      email,
      userId,
      personalInfo,
      opinions
    })

    // Validate required data
    if (!userId || !personalInfo) {
      return NextResponse.json(
        { error: "Missing required user data" },
        { status: 400 }
      )
    }

    // Prepare the complete user data for database insertion
    const userData = {
      email: email || null,
      user_id: userId,
      name: personalInfo.name,
      age: personalInfo.age === "not-specified" ? null : parseInt(personalInfo.age),
      sex: personalInfo.sex,
      education: personalInfo.education,
      occupation: personalInfo.occupation,
      vaccination: opinions?.vaccination ? parseInt(opinions.vaccination) : 0,
      climate_change: opinions?.climateChange ? parseInt(opinions.climateChange) : 0,
      immigration: opinions?.immigration ? parseInt(opinions.immigration) : 0,
      gun_control: opinions?.gunControl ? parseInt(opinions.gunControl) : 0,
      universal_healthcare: opinions?.universalHealthcare ? parseInt(opinions.universalHealthcare) : 0,
      informed_consent_agreed: true
      // Remove explicit timestamp - let database handle defaults
    }

    console.log("API: Inserting user data:", userData)

    // Insert the complete user data into Supabase
    const { data: insertedData, error } = await supabase
      .from('user_data')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error("API: Supabase error saving user data:", error)
      console.error("API: Full error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: `Failed to save user data: ${error.message}`, details: error.details },
        { status: 500 }
      )
    }

    console.log("API: User data saved successfully:", insertedData)
    return NextResponse.json({ 
      success: true, 
      userData: insertedData 
    })

  } catch (error) {
    console.error("API: Error saving user data:", error)
    return NextResponse.json(
      { error: "Failed to save user data" },
      { status: 500 }
    )
  }
} 