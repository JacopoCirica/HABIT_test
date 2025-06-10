"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare } from "lucide-react"
import { createUser } from "@/lib/actions"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"
import { motion } from "framer-motion"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !agreed) return

    setIsSubmitting(true)
    setError("")

    try {
      const result = await createUser(email)

      // Store email, expiration time, and verification code (if provided) in session storage
      sessionStorage.setItem("signupEmail", email)
      sessionStorage.setItem("codeExpiresAt", result.expiresAt.toString())

      if (result.verificationCode) {
        sessionStorage.setItem("verificationCode", result.verificationCode)

        if (result.fallbackReason) {
          sessionStorage.setItem("fallbackReason", result.fallbackReason)
        }
      }

      router.push("/signup/verify")
    } catch (error) {
      console.error("Error creating user:", error)
      setError(error instanceof Error ? error.message : "Failed to send verification code")
    } finally {
      setIsSubmitting(false)
    }
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
                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-3xl font-bold">Enter Platform</h1>
                  <p className="text-muted-foreground">Create an account to participate in research studies</p>
                </div>

                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send a verification code to this email address
                    </p>
                  </div>

                  <motion.div
                    className="flex items-start space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Checkbox
                      id="terms"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked as boolean)}
                      className="transition-all duration-200"
                    />
                    <Label htmlFor="terms" className="text-sm leading-tight">
                      I agree to participate in the study
                    </Label>
                  </motion.div>

                  {error && (
                    <motion.p
                      className="text-sm text-destructive"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <AnimatedButton type="submit" className="w-full" disabled={!email || !agreed || isSubmitting}>
                    {isSubmitting ? "Sending code..." : "Send verification code"}
                  </AnimatedButton>
                </motion.form>
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
                <Link href="#about">About</Link>
                <Link href="#research">Research</Link>
                <Link href="#privacy">Privacy</Link>
                <Link href="#terms">Terms</Link>
              </div>
              <div className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} HABIT</div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
