"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LikertScale } from "@/components/ui/likert-scale"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { topicDebateFraming } from "@/lib/opinion-analyzer"
import type { OpinionTopic } from "@/lib/opinion-analyzer"

interface OpinionPollProps {
  topic: OpinionTopic
  topicDisplayName: string
  initialValue: number
  onSubmit: (value: number, reason: string) => void
  onDismiss: () => void
}

export function OpinionPoll({ topic, topicDisplayName, initialValue, onSubmit, onDismiss }: OpinionPollProps) {
  const [value, setValue] = useState(initialValue.toString())
  const [reason, setReason] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!value) return

    onSubmit(Number(value), reason)
    setSubmitted(true)

    // Auto-dismiss after showing thank you message
    setTimeout(() => {
      onDismiss()
    }, 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <Card className="shadow-lg">
            <CardHeader className="relative border-b bg-muted/50 pb-4">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="pr-6">Opinion Check</CardTitle>
            </CardHeader>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="thank-you" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 text-4xl">🙏</div>
                    <h3 className="mb-2 text-xl font-semibold">Thank You!</h3>
                    <p className="text-muted-foreground">Your response has been recorded.</p>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div key="poll-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CardContent className="pt-6">
                    <p className="mb-6 text-center text-muted-foreground">
                      Based on the conversation so far, please indicate your current position on this topic:
                    </p>

                    <div className="mb-6">
                      <h3 className="mb-4 text-center text-lg font-medium">{topicDisplayName}</h3>
                      <p className="mb-6 text-center">{topicDebateFraming[topic]}</p>

                      <LikertScale
                        question={topicDebateFraming[topic]}
                        id="current-opinion"
                        value={value}
                        onChange={setValue}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="reason" className="text-sm font-medium">
                        Has your opinion changed? If so, why? (Optional)
                      </label>
                      <Textarea
                        id="reason"
                        placeholder="Share your thoughts..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-end border-t bg-muted/30 p-4">
                    <AnimatedButton onClick={handleSubmit} disabled={!value}>
                      Submit
                    </AnimatedButton>
                  </CardFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
