"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Star, ThumbsUp, MessageSquare } from "lucide-react"

interface ExitSurveyProps {
  onSubmit: (responses: ExitSurveyResponses) => void
  onSkip: () => void
  sessionType: string
}

export interface ExitSurveyResponses {
  satisfaction: string
  feedback: string
}

export function ExitSurvey({ onSubmit, onSkip, sessionType }: ExitSurveyProps) {
  const [satisfaction, setSatisfaction] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!satisfaction) return

    setIsSubmitting(true)
    onSubmit({
      satisfaction,
      feedback: feedback.trim()
    })
  }

  const satisfactionOptions = [
    { value: "1", label: "Very Poor", emoji: "😞" },
    { value: "2", label: "Poor", emoji: "🙁" },
    { value: "3", label: "Fair", emoji: "😐" },
    { value: "4", label: "Good", emoji: "🙂" },
    { value: "5", label: "Excellent", emoji: "😊" }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Star className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">How was your experience?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Help us improve {sessionType} by sharing your feedback
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Satisfaction Rating */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Overall, how would you rate your experience?
              </Label>
              <RadioGroup
                value={satisfaction}
                onValueChange={setSatisfaction}
                className="grid grid-cols-5 gap-2"
              >
                {satisfactionOptions.map((option) => (
                  <div key={option.value} className="text-center">
                    <RadioGroupItem
                      value={option.value}
                      id={`satisfaction-${option.value}`}
                      className="sr-only peer"
                    />
                    <Label
                      htmlFor={`satisfaction-${option.value}`}
                      className="flex cursor-pointer flex-col items-center space-y-1 rounded-lg border-2 border-muted p-2 transition-all hover:border-primary peer-checked:border-primary peer-checked:bg-primary/5"
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-xs font-medium">{option.value}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Feedback */}
            <div className="space-y-3">
              <Label htmlFor="feedback" className="text-sm font-medium">
                Any additional feedback? (Optional)
              </Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts, suggestions, or any issues you encountered..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {feedback.length}/500 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="flex-1"
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                type="submit"
                disabled={!satisfaction || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
} 