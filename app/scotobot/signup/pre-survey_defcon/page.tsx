"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { saveConsentInfo } from "@/lib/actions"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function ScotobotConsentPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setIsSubmitting(true)
    try {
      // Generate a unique user ID for this participant
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      // Get email from session storage (from signup)
      const email = sessionStorage.getItem("signupEmail")
      
      // Store user information in session storage
      sessionStorage.setItem("userId", userId)
      sessionStorage.setItem("userName", name)
      
      console.log("Personal information stored in session storage with userId:", userId)
      
      // Save to backend via API endpoint to store email and basic info
      const personalInfo = {
        name: name,
        age: "not-specified",
        sex: "not-specified",
        education: "not-specified", 
        occupation: "not-specified"
      }

      try {
        const response = await fetch('/api/user-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            userId,
            personalInfo,
            opinions: {} // Empty opinions since we're not collecting them
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save user data')
        }

        const result = await response.json()
        console.log("User data (including email) saved successfully:", result)
      } catch (apiError) {
        console.error("API call failed:", apiError)
        
        // Fallback to server action
        try {
          await saveConsentInfo({ name, age: "not-specified", sex: "not-specified", education: "not-specified", occupation: "not-specified" })
        } catch (error) {
          console.log("Server action also failed:", error)
        }
      }
      
      router.push("/chat/scotobot") // Navigate directly to Scotobot chat
    } catch (error) {
      console.error("Error saving consent info:", error)
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
                  <h1 className="mb-2 text-3xl font-bold">Name for the session</h1>
                  <p className="text-muted-foreground">
                    Please provide your name to participate in the study
                  </p>
                </div>

                <Card className="mb-6">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Your data will be used for research purposes only and will be kept confidential.
                    </p>
                  </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-sm"
                    />
                    <p className="text-xs text-muted-foreground">This name will be displayed in the chat session</p>
                  </div>

                  <AnimatedButton
                    type="submit"
                    className="w-full"
                    disabled={!name || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "I'm ready to begin"}
                  </AnimatedButton>
                </form>
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