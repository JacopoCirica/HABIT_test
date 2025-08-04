"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send } from "lucide-react"

interface ScotobotInitialInterfaceProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  sessionStarted: boolean
  sessionEnded: boolean
  sessionPaused: boolean
  isLoading: boolean
}

export function ScotobotInitialInterface({
  input,
  onInputChange,
  onSubmit,
  sessionStarted,
  sessionEnded,
  sessionPaused,
  isLoading
}: ScotobotInitialInterfaceProps) {
  const exampleQuestions = [
    "What are the key principles of constitutional interpretation?",
    "How does the Supreme Court approach First Amendment cases?",
    "What is the significance of judicial precedent in constitutional law?",
    "How do you balance individual rights with governmental authority?"
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-3xl px-6">
        {/* ScotoBOT Title */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ScotoBOT</h1>
          <p className="text-gray-600">Ask Justice ROBert constitutional questions</p>
        </div>

        {/* Main Input */}
        <div className="mb-8">
          <form onSubmit={onSubmit} className="relative">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask Justice ROBerts something..."
              className="w-full h-14 pl-4 pr-12 text-base border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={!sessionStarted || sessionEnded || sessionPaused || isLoading}
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-2 h-10 w-10 rounded-lg"
              disabled={!sessionStarted || sessionEnded || sessionPaused || !input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Example Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exampleQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 text-left justify-start text-sm border-gray-200 hover:border-primary hover:bg-primary/5"
              onClick={() => onInputChange(question)}
              disabled={!sessionStarted || sessionEnded || sessionPaused || isLoading}
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="text-gray-700">{question}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
} 