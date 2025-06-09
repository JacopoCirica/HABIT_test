import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY

    // Return status information
    return NextResponse.json({
      emailServiceConfigured: !!resendApiKey,
      environment: {
        isVercelDeployment: process.env.VERCEL === "1",
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("Error checking email service status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
