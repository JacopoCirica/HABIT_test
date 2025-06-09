import { Resend } from "resend"

// Initialize Resend with the provided API key
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

interface SendVerificationEmailParams {
  to: string
  verificationCode: string
}

export async function sendVerificationEmail({ to, verificationCode }: SendVerificationEmailParams) {
  try {
    // Check if Resend is properly initialized
    if (!resend) {
      console.warn("Resend API key not configured, using fallback email display")
      return {
        success: false,
        messageId: "fallback_email_" + Math.random().toString(36).substring(2, 9),
        fallback: true,
        fallbackReason: "Email service not configured",
      }
    }

    const { data, error } = await resend.emails.send({
      from: "HABIT <noreply@habitsimulation.xyz>", // Using your verified domain
      to: [to],
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333; margin-bottom: 10px;">HABIT</h1>
            <p style="color: #666;">Human Agent Behavioral Interaction Toolkit</p>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
            <p style="color: #666; margin-bottom: 20px;">Please use the following code to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f0f0f0; padding: 15px 30px; border-radius: 4px; font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #333;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #666; margin-bottom: 0;">This code will expire in 10 minutes.</p>
          </div>
          
          <div style="color: #999; font-size: 12px; text-align: center;">
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} HABIT. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Error sending email:", error)

      // Check if it's a domain verification error
      const isDomainError =
        error.message?.includes("verify a domain") ||
        error.message?.includes("testing emails") ||
        error.message?.includes("own email address")

      return {
        success: false,
        messageId: "fallback_email_" + Math.random().toString(36).substring(2, 9),
        fallback: true,
        fallbackReason: isDomainError
          ? "Email delivery requires domain verification. Your verification code is displayed below."
          : `Email service error: ${error.message}`,
      }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error("Error in sendVerificationEmail:", error)

    // Check if it's a domain verification error
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const isDomainError =
      errorMessage.includes("verify a domain") ||
      errorMessage.includes("testing emails") ||
      errorMessage.includes("own email address")

    return {
      success: false,
      messageId: "fallback_email_" + Math.random().toString(36).substring(2, 9),
      fallback: true,
      fallbackReason: isDomainError
        ? "Email delivery requires domain verification. Your verification code is displayed below."
        : errorMessage,
    }
  }
}
