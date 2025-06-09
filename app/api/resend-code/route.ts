import { NextResponse } from "next/server"
import { createUser } from "@/lib/actions"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Reuse the createUser function to generate, store, and send a new verification code
    const result = await createUser(email)

    // Always include the verification code for client-side verification
    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt,
      emailSent: result.emailSent,
      verificationCode: result.verificationCode,
      fallbackReason: result.fallbackReason,
    })
  } catch (error) {
    console.error("Error resending verification code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend verification code" },
      { status: 500 },
    )
  }
}
