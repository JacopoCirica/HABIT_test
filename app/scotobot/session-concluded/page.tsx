"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, CheckCircle, Clock, Users } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"
import { motion } from "framer-motion"

export default function ScotobotSessionConcludedPage() {
  const router = useRouter()
  const [sessionDuration, setSessionDuration] = useState<string>("")

  useEffect(() => {
    // Calculate session duration if available in sessionStorage
    const sessionStartTime = sessionStorage.getItem("sessionStartTime")
    if (sessionStartTime) {
      const startTime = parseInt(sessionStartTime)
      const endTime = Date.now()
      const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60))
      const durationSeconds = Math.floor(((endTime - startTime) % (1000 * 60)) / 1000)
      setSessionDuration(`${durationMinutes}:${durationSeconds.toString().padStart(2, "0")}`)
    }
  }, [])

  const handleReturnHome = () => {
    // Clear session data
    sessionStorage.removeItem("sessionStartTime")
    sessionStorage.removeItem("scotobotRoomId")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userName")
    router.push("/")
  }

  const handleNewSession = () => {
    // Clear session data
    sessionStorage.removeItem("sessionStartTime")
    sessionStorage.removeItem("scotobotRoomId")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userName")
    router.push("/scotobot")
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

        <main className="flex-1 flex items-center justify-center">
          <section className="py-12 w-full">
            <div className="container mx-auto px-4">
              <FadeIn className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                  <motion.div
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                  >
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </motion.div>
                  <motion.h1
                    className="mb-4 text-4xl font-bold text-gray-900"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    Session Concluded
                  </motion.h1>
                  <motion.p
                    className="text-lg text-muted-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    Thank you for participating in the Scotobot demonstration!
                  </motion.p>
                </div>

                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {/* Session Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Session Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Users className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Participants</p>
                            <p className="text-sm text-gray-600">You & Scotobot Bob</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Duration</p>
                            <p className="text-sm text-gray-600">
                              {sessionDuration || "Session completed"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Thank You Message */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Your participation helps improve AI systems
                        </h3>
                        <p className="text-gray-600">
                          The data from your conversation with Scotobot Bob will be used to analyze 
                          and enhance AI performance, functionality, and user experience in constitutional 
                          and legal discussions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <AnimatedButton
                      onClick={handleNewSession}
                      className="flex-1"
                      variant="outline"
                    >
                      Start New Session
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={handleReturnHome}
                      className="flex-1"
                    >
                      Return to Homepage
                    </AnimatedButton>
                  </div>
                </motion.div>
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