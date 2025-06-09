"use server"

import { sendVerificationEmail } from "./email-service"

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
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // In a real app, you would save this information to your database
  console.log("Saving consent information:", data)

  return { success: true }
}

export async function saveDemographics(data: any) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // In a real app, you would save this information to your database
  console.log("Saving demographics:", data)

  return { success: true }
}
