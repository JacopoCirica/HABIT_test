"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LikertScale } from "@/components/ui/likert-scale"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, MessageSquare } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"

interface PostSurveyProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (responses: PostSurveyResponses) => void
  sessionDuration: number // in seconds
}

export interface PostSurveyResponses {
  clarity: string
  naturalness: string
  difficulty: string
  engagement: string
  suspectedAI: string
  aiSuspicionReason?: string
  overallExperience: string
  improvements: string
  wouldParticipateAgain: string
  additionalComments: string
}

export function PostSurvey({ isOpen, onClose, onSubmit, sessionDuration }: PostSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Partial<PostSurveyResponses>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const updateResponse = (key: keyof PostSurveyResponses, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(responses as PostSurveyResponses)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return responses.clarity && responses.naturalness && responses.difficulty && responses.engagement
      case 1:
        return responses.suspectedAI && (responses.suspectedAI === "no" || responses.aiSuspicionReason)
      case 2:
        return responses.overallExperience && responses.wouldParticipateAgain
      default:
        return true
    }
  }

  const steps = [
    {
      title: "Interaction Quality",
      content: (
        <div className="space-y-6">
          <LikertScale
            question="How clear and understandable were the responses during the conversation?"
            id="clarity"
            value={responses.clarity || ""}
            onChange={(value) => updateResponse("clarity", value)}
            minLabel="Very Unclear"
            maxLabel="Very Clear"
          />

          <LikertScale
            question="How natural did the conversation feel?"
            id="naturalness"
            value={responses.naturalness || ""}
            onChange={(value) => updateResponse("naturalness", value)}
            minLabel="Very Artificial"
            maxLabel="Very Natural"
          />

          <LikertScale
            question="How difficult was it to express your viewpoints during the discussion?"
            id="difficulty"
            value={responses.difficulty || ""}
            onChange={(value) => updateResponse("difficulty", value)}
            minLabel="Very Difficult"
            maxLabel="Very Easy"
          />

          <LikertScale
            question="How engaging was the conversation?"
            id="engagement"
            value={responses.engagement || ""}
            onChange={(value) => updateResponse("engagement", value)}
            minLabel="Not Engaging"
            maxLabel="Very Engaging"
          />
        </div>
      ),
    },
    {
      title: "AI Detection",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Did you suspect that any of the other participants were AI-powered?
            </Label>
            <RadioGroup
              value={responses.suspectedAI || ""}
              onValueChange={(value) => updateResponse("suspectedAI", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="suspected-yes" />
                <Label htmlFor="suspected-yes">Yes, I suspected AI involvement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="suspected-no" />
                <Label htmlFor="suspected-no">No, I thought all participants were human</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsure" id="suspected-unsure" />
                <Label htmlFor="suspected-unsure">I was unsure</Label>
              </div>
            </RadioGroup>
          </div>

          {responses.suspectedAI && responses.suspectedAI !== "no" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="ai-suspicion-reason">What made you suspect AI involvement?</Label>
              <Textarea
                id="ai-suspicion-reason"
                placeholder="Please describe what made you suspicious (e.g., response patterns, timing, content style)..."
                value={responses.aiSuspicionReason || ""}
                onChange={(e) => updateResponse("aiSuspicionReason", e.target.value)}
                className="min-h-[100px]"
              />
            </motion.div>
          )}
        </div>
      ),
    },
    {
      title: "Overall Experience",
      content: (
        <div className="space-y-6">
          <LikertScale
            question="How would you rate your overall experience in this session?"
            id="overall-experience"
            value={responses.overallExperience || ""}
            onChange={(value) => updateResponse("overallExperience", value)}
            minLabel="Very Poor"
            maxLabel="Excellent"
          />

          <div className="space-y-3">
            <Label className="text-base font-medium">Would you participate in similar research sessions again?</Label>
            <RadioGroup
              value={responses.wouldParticipateAgain || ""}
              onValueChange={(value) => updateResponse("wouldParticipateAgain", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="definitely" id="participate-definitely" />
                <Label htmlFor="participate-definitely">Definitely yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="probably" id="participate-probably" />
                <Label htmlFor="participate-probably">Probably yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maybe" id="participate-maybe" />
                <Label htmlFor="participate-maybe">Maybe</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="probably-not" id="participate-probably-not" />
                <Label htmlFor="participate-probably-not">Probably not</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="definitely-not" id="participate-definitely-not" />
                <Label htmlFor="participate-definitely-not">Definitely not</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="improvements">What could be improved about this research platform or session format?</Label>
            <Textarea
              id="improvements"
              placeholder="Please share any suggestions for improvements..."
              value={responses.improvements || ""}
              onChange={(e) => updateResponse("improvements", e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-comments">Any additional comments or feedback?</Label>
            <Textarea
              id="additional-comments"
              placeholder="Please share any other thoughts about your experience..."
              value={responses.additionalComments || ""}
              onChange={(e) => updateResponse("additionalComments", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      ),
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <Card className="shadow-lg">
              <CardHeader className="relative border-b bg-muted/50 pb-4">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 pr-12">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Post-survey</CardTitle>
                    <p className="text-sm text-muted-foreground">Session duration: {formatDuration(sessionDuration)}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
                    <span className="text-sm text-muted-foreground">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                  </div>
                  <div className="flex space-x-1 mb-6">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                          index <= currentStep ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {steps[currentStep].content}
                  </motion.div>
                </AnimatePresence>
              </CardContent>

              <CardFooter className="flex justify-between border-t bg-muted/30 p-4">
                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                  Previous
                </Button>

                <div className="flex gap-2">
                  {currentStep < steps.length - 1 ? (
                    <AnimatedButton onClick={handleNext} disabled={!isStepComplete(currentStep)}>
                      Next
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton onClick={handleSubmit} disabled={!isStepComplete(currentStep) || isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Post-survey"}
                    </AnimatedButton>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
