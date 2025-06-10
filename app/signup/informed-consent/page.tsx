"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, FileText } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"
import { motion } from "framer-motion"

const consentText = `
**1. Purpose of the Study:**
This research aims to understand how humans interact with AI agents in conversational settings, specifically focusing on opinion formation and debate dynamics.

**2. Procedures:**
If you agree to participate, you will be asked to:
   a. Provide some demographic information and your opinions on selected topics.
   b. Engage in a text-based conversation with another participant (who may be an AI) for approximately 15 minutes.
   c. Complete a short post-session survey about your experience.

**3. Risks and Benefits:**
Risks: There are no anticipated physical risks. Some participants might experience mild discomfort discussing certain topics or interacting with an AI. You can withdraw at any time.
Benefits: You will contribute to scientific knowledge about human-AI interaction. There are no direct benefits to you.

**4. Confidentiality:**
All data collected will be anonymized. Your email address will only be used for verification and will not be linked to your responses in published research. Conversation logs and survey responses will be stored securely. Anonymized data may be shared with other researchers or made publicly available.

**5. Voluntary Participation:**
Your participation is entirely voluntary. You can choose to stop participating at any time without any penalty. If you withdraw, any data collected from you up to that point may still be used in an anonymized form.

**6. Contact Information:**
If you have any questions about this research, you can contact the HABIT research team at habit-research@example.com. (Note: This is a placeholder email for this demo).

**7. Duration:**
The entire session, including surveys and the chat, is expected to take approximately 20-25 minutes.
`

export default function InformedConsentPage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) return

    setIsSubmitting(true)
    // In a real app, you might want to record this consent action.
    // For now, we just navigate.
    sessionStorage.setItem("informedConsentAgreed", "true")
    router.push("/signup/pre-survey") // Navigate to the pre-survey page (old consent page)
    setIsSubmitting(false)
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
              <FadeIn className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="mb-2 text-3xl font-bold">Informed Consent</h1>
                  <p className="text-muted-foreground">
                    Please read the following information carefully before deciding to participate.
                  </p>
                </div>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Research Study Information</CardTitle>
                    <CardDescription>Your participation in this study is voluntary.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-h-80 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm">
                      {consentText.split("\n\n").map((paragraph, i) => (
                        <div key={i} className="mb-3">
                          {paragraph.split("\n").map((line, j) => {
                            if (line.startsWith("**") && line.endsWith("**")) {
                              return (
                                <strong key={j} className="block mb-1">
                                  {line.slice(2, -2)}
                                </strong>
                              )
                            }
                            return (
                              <p key={j} className="my-0.5">
                                {line}
                              </p>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <motion.div
                    className="flex items-start space-x-3 rounded-md border p-4 shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Checkbox
                      id="consent-agreed"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked as boolean)}
                      className="mt-1 transition-all duration-200"
                      aria-labelledby="consent-label"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="consent-agreed" id="consent-label" className="font-medium cursor-pointer">
                        Statement of Consent
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I have read and understood the information above, and I voluntarily agree to participate in this
                        research study.
                      </p>
                    </div>
                  </motion.div>

                  <AnimatedButton type="submit" className="w-full" disabled={!agreed || isSubmitting}>
                    {isSubmitting ? "Processing..." : "Agree & Continue"}
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
