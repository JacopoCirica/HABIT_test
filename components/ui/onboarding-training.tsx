"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedButton } from "@/components/ui/animated-button"
import {
  MessageSquare,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckCircle2,
  Send,
  Sparkles,
} from "lucide-react"

interface OnboardingTrainingProps {
  onComplete: () => void
}

export function OnboardingTraining({ onComplete }: OnboardingTrainingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const steps = [
    {
      title: "Welcome to Your Research Session",
      description:
        "You're about to participate in an important research dialogue. This quick guide will help you get familiar with the interface.",
      icon: <Sparkles className="h-12 w-12 text-primary" />,
      illustration: (
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <MessageSquare className="h-12 w-12 text-primary" />
        </div>
      ),
    },
    {
      title: "Meet Your Fellow Participants",
      description: "The sidebar shows everyone in this session.",
      icon: <Users className="h-12 w-12 text-primary" />,
      highlight: "sidebar",
      illustration: (
        <div className="mx-auto mb-4 flex max-w-xs flex-wrap justify-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {String.fromCharCode(64 + i)}
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: "Message Input Area",
      description:
        "This is where you'll type your messages during the session. Click in this area, type your message, and press the Send button or hit Enter to send it.",
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      highlight: "chat-area",
      illustration: (
        <div className="mx-auto mb-4 w-full max-w-sm rounded-lg border bg-card p-2 shadow-sm">
          <div className="mb-2 rounded-md bg-primary/10 p-2 text-sm">
            <span className="font-medium">Confederate:</span> Hello! Looking forward to our discussion today.
          </div>
          <div className="mt-4 rounded-md border-2 border-primary/50 bg-muted p-2 text-sm shadow-inner">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Type your message here...</span>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}>
                <Send className="h-4 w-4" />
              </motion.div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Session Controls",
      description:
        "Keep track of your session time and use the exit button if you need to leave early. The session typically lasts 15 minutes.",
      icon: <Clock className="h-12 w-12 text-primary" />,
      highlight: "timer",
      illustration: (
        <div className="mx-auto mb-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">00:00</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-red-600">
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Exit</span>
          </div>
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description:
        "You're now ready to participate in the research dialogue. Your contributions are valuable and will help advance our understanding.",
      icon: <CheckCircle2 className="h-12 w-12 text-primary" />,
      illustration: (
        <div className="mx-auto mb-4">
          <motion.div
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-500 bg-green-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </motion.div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    // Store in session storage that the user has completed the training
    sessionStorage.setItem("trainingCompleted", "true")
    // Call the onComplete callback
    setTimeout(() => {
      onComplete()
    }, 500) // Wait for exit animation to complete
  }

  const handleSkip = () => {
    setIsVisible(false)
    // Store in session storage that the user has completed the training
    sessionStorage.setItem("trainingCompleted", "true")
    // Call the onComplete callback
    setTimeout(() => {
      onComplete()
    }, 500) // Wait for exit animation to complete
  }

  // Function to highlight an element without affecting z-index
  const highlightElement = (elementSelector: string | null) => {
    // First, remove any existing highlights
    const previousHighlight = document.querySelector(".onboarding-highlight-overlay")
    if (previousHighlight) {
      previousHighlight.remove()
    }

    // If no selector, just return
    if (!elementSelector) return

    // Find the element to highlight
    const element = document.querySelector(`[data-highlight="${elementSelector}"]`)
    if (!element) return

    // Get the element's position and dimensions
    const rect = element.getBoundingClientRect()

    // Create a highlight overlay
    const highlight = document.createElement("div")
    highlight.className = "onboarding-highlight-overlay"
    highlight.style.position = "fixed"
    highlight.style.top = `${rect.top - 8}px`
    highlight.style.left = `${rect.left - 8}px`
    highlight.style.width = `${rect.width + 16}px`
    highlight.style.height = `${rect.height + 16}px`
    highlight.style.border = "4px solid rgba(59, 130, 246, 0.5)"
    highlight.style.borderRadius = "8px"
    highlight.style.boxShadow = "0 0 0 4000px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.3)"
    highlight.style.zIndex = "50"
    highlight.style.pointerEvents = "none"

    // Add animation
    highlight.style.animation = "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"

    // Add to the document
    document.body.appendChild(highlight)
  }

  // Highlight the current element
  useEffect(() => {
    const currentHighlight = steps[currentStep]?.highlight
    highlightElement(currentHighlight)

    return () => {
      // Clean up on unmount
      const highlight = document.querySelector(".onboarding-highlight-overlay")
      if (highlight) {
        highlight.remove()
      }
    }
  }, [currentStep])

  // Clean up all highlights when component unmounts
  useEffect(() => {
    return () => {
      const highlight = document.querySelector(".onboarding-highlight-overlay")
      if (highlight) {
        highlight.remove()
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-full max-w-lg px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Card className="relative z-[101] overflow-hidden shadow-lg">
                  <CardHeader className="bg-muted/50 pb-4">
                    <CardTitle className="text-center text-xl">{steps[currentStep].title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {steps[currentStep].illustration}

                    <p className="text-center text-muted-foreground">{steps[currentStep].description}</p>

                    <div className="mt-6 flex justify-center">
                      <div className="flex space-x-1">
                        {steps.map((_, index) => (
                          <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              index === currentStep ? "w-6 bg-primary" : "w-2 bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t bg-muted/30 p-4">
                    <div>
                      {currentStep > 0 ? (
                        <Button variant="outline" size="sm" onClick={handlePrevious}>
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={handleSkip}>
                          Skip
                        </Button>
                      )}
                    </div>
                    <AnimatedButton size="sm" onClick={handleNext}>
                      {currentStep < steps.length - 1 ? (
                        <>
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        "Start Session"
                      )}
                    </AnimatedButton>
                  </CardFooter>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
