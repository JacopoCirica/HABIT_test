"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, FileText } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"
import { motion } from "framer-motion"

const consentText = `
Thank you for participating in this AI demonstration during the talk. By engaging with the AI system, you acknowledge and consent to the following:

All interactions, including your inputs and the AI's responses, will be recorded.
These recordings will be used exclusively to analyze and improve the AI system's performance, functionality, and user experience.

Your participation is voluntary, and you may discontinue at any time by disconnecting.
`

export default function ScotobotPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    // In a real app, you might want to record this consent action.
    // For now, we just navigate.
    sessionStorage.setItem("informedConsentAgreed", "true")
    router.push("/scotobot/signup/pre-survey_defcon") // Navigate to the Scotobot DEFCON pre-survey page
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
                    <CardTitle>Demo Data Use Information</CardTitle>
                    <CardDescription>Your participation is voluntary.</CardDescription>
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
                  <AnimatedButton type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Continue"}
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