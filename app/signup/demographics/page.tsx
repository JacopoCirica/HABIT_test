"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
// Removed saveDemographics import - using API endpoint instead
import { PageTransition } from "@/components/page-transition"
import { AnimatedButton } from "@/components/ui/animated-button"
import { LikertScale } from "@/components/ui/likert-scale"
import { motion } from "framer-motion"

export default function DemographicsPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for Likert scale questions
  const [vaccination, setVaccination] = useState("")
  const [climateChange, setClimateChange] = useState("")
  const [immigration, setImmigration] = useState("")
  const [gunControl, setGunControl] = useState("")
  const [universalHealthcare, setUniversalHealthcare] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if all questions are answered
    if (!vaccination || !climateChange || !immigration || !gunControl || !universalHealthcare) {
      return
    }

    setIsSubmitting(true)

    try {
      // Collect all opinions
      const opinions = {
        vaccination,
        climateChange,
        immigration,
        gunControl,
        universalHealthcare,
      }

      // Save to session storage for use in the chat
      sessionStorage.setItem("userOpinions", JSON.stringify(opinions))

      // Get all user data from session storage
      const email = sessionStorage.getItem("signupEmail")
      const userId = sessionStorage.getItem("userId")
      const personalInfo = {
        name: sessionStorage.getItem("userName"),
        age: sessionStorage.getItem("userAge"),
        sex: sessionStorage.getItem("userSex"),
        education: sessionStorage.getItem("userEducation"),
        occupation: sessionStorage.getItem("userOccupation")
      }

      console.log("Debug - Session storage data:", {
        email,
        userId,
        personalInfo,
        opinions
      })

      // Validate we have all required data
      if (!email || !userId || !personalInfo.name || !personalInfo.age || 
          !personalInfo.sex || !personalInfo.education || !personalInfo.occupation) {
        console.error("Missing data details:", {
          email: !!email,
          userId: !!userId,
          name: !!personalInfo.name,
          age: !!personalInfo.age,
          sex: !!personalInfo.sex,
          education: !!personalInfo.education,
          occupation: !!personalInfo.occupation
        })
        throw new Error("Missing required user information")
      }

      // Save to backend via API endpoint
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userId,
          personalInfo,
          opinions
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save user data')
      }

      const result = await response.json()
      console.log("User data saved successfully:", result)

      router.push("/rooms")
    } catch (error) {
      console.error("Error saving demographics:", error)
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
              <div className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-3xl font-bold">Demographics</h1>
                  <p className="text-muted-foreground">
                    Please provide your opinions on the following topics to help us better understand the context of
                    your interactions.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Opinion Survey</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <motion.div
                        className="space-y-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <p className="text-sm text-muted-foreground">
                          Please indicate your level of agreement with the following statements on a scale from 1
                          (Strongly Disagree) to 7 (Strongly Agree).
                        </p>

                        <LikertScale
                          question="Vaccines are safe and effective for most people."
                          id="vaccination"
                          value={vaccination}
                          onChange={setVaccination}
                        />

                        <LikertScale
                          question="Climate change is a serious threat that requires immediate action."
                          id="climate-change"
                          value={climateChange}
                          onChange={setClimateChange}
                        />

                        <LikertScale
                          question="Immigration generally benefits the receiving country's economy and culture."
                          id="immigration"
                          value={immigration}
                          onChange={setImmigration}
                        />

                        <LikertScale
                          question="Stricter gun control laws would reduce violence in society."
                          id="gun-control"
                          value={gunControl}
                          onChange={setGunControl}
                        />

                        <LikertScale
                          question="Universal healthcare should be available to all citizens."
                          id="universal-healthcare"
                          value={universalHealthcare}
                          onChange={setUniversalHealthcare}
                        />
                      </motion.div>

                      <AnimatedButton
                        type="submit"
                        className="w-full"
                        disabled={
                          isSubmitting ||
                          !vaccination ||
                          !climateChange ||
                          !immigration ||
                          !gunControl ||
                          !universalHealthcare
                        }
                      >
                        {isSubmitting ? "Submitting..." : "Continue to Session"}
                      </AnimatedButton>
                    </form>
                  </CardContent>
                </Card>
              </div>
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
