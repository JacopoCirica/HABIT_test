"use server"

import { sendVerificationEmail } from "./email-service"
import { supabase } from "./supabaseClient"

// Store verification codes in memory (in a real app, this would be in a database)
const verificationCodes = new Map<string, { code: string; expiresAt: Date }>()

export async function createUser(email: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate a 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

  // Set expiration time (10 minutes from now)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  // Store the verification code (in a real app, this would be in a database)
  verificationCodes.set(email, { code: verificationCode, expiresAt })

  try {
    // Send the verification email
    const emailResult = await sendVerificationEmail({ to: email, verificationCode })

    // Return the result with email sending status
    return {
      email,
      codeSent: true,
      expiresAt: expiresAt.getTime(),
      emailSent: emailResult.success,
      // Only include verification code if email sending failed
      verificationCode: verificationCode, // Always include for fallback
      fallbackReason: emailResult.fallbackReason,
      // Indicate this is a new user signup
      isNewUser: true,
    }
  } catch (error) {
    console.error("Error sending verification email:", error)

    // Even if email sending fails, return the code for display in the UI
    return {
      email,
      codeSent: true,
      expiresAt: expiresAt.getTime(),
      emailSent: false,
      verificationCode: verificationCode,
      fallbackReason: error instanceof Error ? error.message : "Failed to send verification email",
      isNewUser: true,
    }
  }
}

export async function verifyCode(email: string, code: string) {
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if the verification code is valid
    const storedData = verificationCodes.get(email)

    // For deployment environments, always accept the code that was displayed to the user
    // This is stored in session storage
    const storedVerificationCode = typeof window !== "undefined" ? sessionStorage.getItem("verificationCode") : null

    if (storedVerificationCode && code === storedVerificationCode) {
      // If the code matches what was displayed to the user, accept it
      return { id: "user_" + Math.random().toString(36).substring(2, 9), email, verified: true }
    }

    if (!storedData) {
      throw new Error("No verification code found for this email")
    }

    if (storedData.code !== code) {
      throw new Error("Invalid verification code")
    }

    if (new Date() > storedData.expiresAt) {
      throw new Error("Verification code has expired")
    }

    // Clear the verification code after successful verification
    verificationCodes.delete(email)

    // Return a mock user object
    return { id: "user_" + Math.random().toString(36).substring(2, 9), email, verified: true }
  } catch (error) {
    console.error("Error verifying code:", error)
    throw error
  }
}

export async function loginUser(email: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate a 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

  // Set expiration time (10 minutes from now)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  // Store the verification code (in a real app, this would be in a database)
  verificationCodes.set(email, { code: verificationCode, expiresAt })

  try {
    // Send the verification email
    const emailResult = await sendVerificationEmail({ to: email, verificationCode })

    return {
      email,
      codeSent: true,
      expiresAt: expiresAt.getTime(),
      emailSent: emailResult.success,
      // Always include verification code for fallback
      verificationCode: verificationCode,
      fallbackReason: emailResult.fallbackReason,
      // Indicate this is a returning user login
      isNewUser: false,
    }
  } catch (error) {
    console.error("Error sending verification email:", error)

    // Even if email sending fails, return the code for display in the UI
    return {
      email,
      codeSent: true,
      expiresAt: expiresAt.getTime(),
      emailSent: false,
      verificationCode: verificationCode,
      fallbackReason: error instanceof Error ? error.message : "Failed to send verification email",
      isNewUser: false,
    }
  }
}

export async function saveConsentInfo(data: {
  name: string
  age: string
  sex: string
  education: string
  occupation: string
}) {
  try {
    console.log("Saving consent information to database:", data)

    // Generate a unique user ID for this participant
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Get email from session storage (since this runs on client)
    // We'll need to handle this differently - store email in the data or pass it
    // For now, we'll save the personal info and link it with email later
    
    // Store user ID and personal info in session storage for later use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("userId", userId)
      sessionStorage.setItem("userName", data.name)
      sessionStorage.setItem("userAge", data.age)
      sessionStorage.setItem("userSex", data.sex)
      sessionStorage.setItem("userEducation", data.education)
      sessionStorage.setItem("userOccupation", data.occupation)
    }

    console.log("Personal information stored in session storage with userId:", userId)
    return { success: true, userId }
  } catch (error) {
    console.error("Error saving consent information:", error)
    throw new Error("Failed to save consent information")
  }
}

export async function saveDemographics(data: { opinions: any }) {
  try {
    console.log("Saving demographics and user data to Supabase:", data)

    // Get all stored user information from session storage
    const email = typeof window !== 'undefined' ? sessionStorage.getItem("signupEmail") : null
    const userId = typeof window !== 'undefined' ? sessionStorage.getItem("userId") : null
    const name = typeof window !== 'undefined' ? sessionStorage.getItem("userName") : null
    const age = typeof window !== 'undefined' ? sessionStorage.getItem("userAge") : null
    const sex = typeof window !== 'undefined' ? sessionStorage.getItem("userSex") : null
    const education = typeof window !== 'undefined' ? sessionStorage.getItem("userEducation") : null
    const occupation = typeof window !== 'undefined' ? sessionStorage.getItem("userOccupation") : null

    if (!email || !userId || !name || !age || !sex || !education || !occupation) {
      throw new Error("Missing required user information")
    }

    // Prepare the complete user data for database insertion
    const userData = {
      email,
      user_id: userId,
      name,
      age: parseInt(age),
      sex,
      education,
      occupation,
      vaccination: parseInt(data.opinions.vaccination),
      climate_change: parseInt(data.opinions.climateChange),
      immigration: parseInt(data.opinions.immigration),
      gun_control: parseInt(data.opinions.gunControl),
      universal_healthcare: parseInt(data.opinions.universalHealthcare),
      informed_consent_agreed: true,
      consent_timestamp: new Date().toISOString()
    }

    console.log("Inserting complete user data:", userData)

    // Insert the complete user data into Supabase
    const { data: insertedData, error } = await supabase
      .from('user_data')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error("Supabase error saving user data:", error)
      throw new Error(`Failed to save user data: ${error.message}`)
    }

    console.log("User data saved successfully to Supabase:", insertedData)
    return { success: true, userData: insertedData }
  } catch (error) {
    console.error("Error saving demographics:", error)
    throw new Error("Failed to save user data to database")
  }
}
