"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { MessageSquare, ArrowLeft, Mail } from "lucide-react"
import { verifyCode } from "@/lib/actions"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"
import { motion, AnimatePresence } from "framer-motion"
import { VerificationCodeInput } from "@/components/ui/verification-code-input"
import { SuccessAnimation } from "@/components/ui/success-animation"
import { ConfettiAnimation } from "@/components/ui/confetti-animation"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { FallbackCodeDisplay } from "@/components/ui/fallback-code-display"

export default function VerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [expiryTime, setExpiryTime] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)
  const [fallbackCode, setFallbackCode] = useState<string | null>(null)
  const [emailSendFailed, setEmailSendFailed] = useState(false)

  useEffect(() => {
    // Get email, expiration time, and verification code from session storage
    const storedEmail = sessionStorage.getItem("signupEmail")
    const storedExpiryTime = sessionStorage.getItem("codeExpiresAt")
    const storedVerificationCode = sessionStorage.getItem("verificationCode")
    const storedEmailSuccess = sessionStorage.getItem("emailSendSuccess")

    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // If no email is found, redirect to signup
      router.push("/signup")
      return
    }

    if (storedExpiryTime) {
      setExpiryTime(Number.parseInt(storedExpiryTime, 10))
    } else {
      // If no expiry time is set, set a default (10 minutes from now)
      const defaultExpiry = Date.now() + 10 * 60 * 1000
      setExpiryTime(defaultExpiry)
      sessionStorage.setItem("codeExpiresAt", defaultExpiry.toString())
    }

    // Always store the verification code for fallback
    if (storedVerificationCode) {
      setFallbackCode(storedVerificationCode)
      // Only show it if email sending failed
      if (storedEmailSuccess === "false") {
        setEmailSendFailed(true)
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !code || code.length !== 6) return

    setIsSubmitting(true)
    setError("")

    try {
      // For deployment environments, always try client-side verification first
      const storedVerificationCode = sessionStorage.getItem("verificationCode")

      if (storedVerificationCode && code === storedVerificationCode) {
        // Success! Proceed to the next step
        setIsVerified(true)
        setTimeout(() => {
          router.push("/signup/informed-consent")
        }, 2000)
        return
      }

      // If client-side verification fails or no stored code, try server verification
      try {
        await verifyCode(email, code)
        setIsVerified(true)
        setTimeout(() => {
          router.push("/signup/informed-consent")
        }, 2000)
      } catch (serverError) {
        // If server verification fails but we have a stored code, give it one more try
        if (storedVerificationCode) {
          // Try a more lenient comparison (e.g., trimming whitespace)
          if (code.trim() === storedVerificationCode.trim()) {
            setIsVerified(true)
            setTimeout(() => {
              router.push("/signup/informed-consent")
            }, 2000)
            return
          }
        }

        // If all verification attempts fail, show the error
        throw serverError
      }
    } catch (error) {
      console.error("Error verifying code:", error)
      setError(error instanceof Error ? error.message : "Failed to verify code. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) return

    setIsSubmitting(true)
    setResendSuccess(false)
    setError("")
    setIsExpired(false)
    setEmailSendFailed(false)

    try {
      const response = await fetch("/api/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      if (result.success) {
        setResendSuccess(true)
        // Update expiry time
        setExpiryTime(result.expiresAt)
        sessionStorage.setItem("codeExpiresAt", result.expiresAt.toString())

        // Always store the verification code for fallback
        if (result.verificationCode) {
          setFallbackCode(result.verificationCode)
          sessionStorage.setItem("verificationCode", result.verificationCode)

          // Only show it if email sending failed
          if (!result.emailSent) {
            setEmailSendFailed(true)
            sessionStorage.setItem("emailSendSuccess", "false")
          } else {
            sessionStorage.setItem("emailSendSuccess", "true")
          }
        }

        // Hide success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (error) {
      console.error("Error resending code:", error)
      setError("Failed to resend verification code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCodeExpired = () => {
    setIsExpired(true)
    setError("Verification code has expired. Please request a new one.")
  }

  const handleAnimationComplete = () => {
    router.push("/signup/informed-consent")
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span className="text-xl font-bold">HABIT</span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <section className="py-12">
            <div className="container mx-auto px-4">
              <FadeIn className="mx-auto max-w-md">
                <AnimatePresence mode="wait">
                  {isVerified ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <SuccessAnimation onComplete={handleAnimationComplete} />
                      <ConfettiAnimation />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="verification-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="mb-2">
                        <Link
                          href="/signup"
                          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="mr-1 h-4 w-4" />
                          Back to signup
                        </Link>
                      </div>

                      <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="mb-2 text-3xl font-bold">Verify Your Email</h1>
                        <p className="text-muted-foreground">
                          We've sent a 6-digit verification code to <span className="font-medium">{email}</span>
                        </p>
                      </div>

                      {/* Display fallback code if email sending failed */}
                      {emailSendFailed && fallbackCode && <FallbackCodeDisplay verificationCode={fallbackCode} />}

                      {/* Countdown Timer */}
                      {expiryTime > 0 && (
                        <div className="mb-6 flex justify-center">
                          <CountdownTimer expiryTime={expiryTime} onExpire={handleCodeExpired} />
                        </div>
                      )}

                      {resendSuccess && !emailSendFailed && (
                        <motion.div
                          className="mb-6 rounded-md bg-green-50 p-3 text-center text-sm text-green-600"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          A new verification code has been sent to your email.
                        </motion.div>
                      )}

                      <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        <div className="space-y-4">
                          <Label htmlFor="code" className="block text-center">
                            Verification Code
                          </Label>
                          <VerificationCodeInput value={code} onChange={setCode} disabled={isSubmitting || isExpired} />
                          {error && (
                            <motion.p
                              className="text-center text-sm text-destructive"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {error}
                            </motion.p>
                          )}
                        </div>

                        <AnimatedButton
                          type="submit"
                          className="w-full"
                          disabled={code.length !== 6 || isSubmitting || isExpired}
                        >
                          {isSubmitting ? "Verifying..." : "Verify Code"}
                        </AnimatedButton>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isSubmitting}
                            className="text-sm text-primary hover:underline"
                          >
                            {isExpired ? "Request new code" : "Didn't receive a code? Resend"}
                          </button>
                        </div>
                      </motion.form>

                      <motion.div
                        className="mt-6 text-center text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                      >
                        Please check your spam folder if you don't see the email in your inbox.
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </FadeIn>
            </div>
          </section>
        </main>

        <footer className="border-t py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="text-lg font-bold">HABIT</span>
              </div>
              <div className="flex gap-8 text-sm text-muted-foreground">
                <Link href="/about">About</Link>
                <Link href="/research">Research</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
              </div>
              <div className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} HABIT</div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
