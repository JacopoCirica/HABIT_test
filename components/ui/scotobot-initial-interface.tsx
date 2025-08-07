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
    "It is August 2026 and Donald Trump is President.",
    "Current Opinions 2024/25: Lackey v. Stinnie (2025)",
    "Upcoming Opinion; People v. Dain (Yacob)",
    "Which of your colleagues are you most ideologically aligned with?"
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-3xl px-6">
        {/* ScotoBOT Title */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ScotoBOT</h1>
          <p className="text-gray-600">Ask Scotobot Bob constitutional questions</p>
        </div>

        {/* Main Input */}
        <div className="mb-8">
          <form onSubmit={onSubmit} className="relative">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask Scotobot Bob something..."
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
          {exampleQuestions.map((question, index) => {
            const getMessageForQuestion = (questionIndex: number) => {
              switch (questionIndex) {
                case 0: // Trump presidency scenario
                  return "It is August 2026 and Donald Trump is President."
                case 1: // Lackey v. Stinnie
                  return "What will be your opinion on the Lackey v. Stinnie case? Here the background: In 2018, a group of Virginia drivers represented by lead plaintiff Damian Stinnie challenged a Virginia state law that automatically suspended the driver's license of anyone yet to pay fines, forfeitures, or restitution assessed by state or federal courts. Stinnie challenged the law's constitutionality, alleging that it violated the Due Process Clause by failing to provide notice of the suspension and the Equal Protection Clause as applied to those unable to pay their legal obligations. After securing a preliminary injunction from the US District Court for the Western District of Virginia, Stinnie's case became moot after the April 2020 repeal of this state law. Stinnie sought to recoup his attorney's fees under the Civil Rights Attorney's Fees Award Act of 1976 as a \"prevailing party,\" given that his lawsuit prompted the law's repeal. However, relying on the Fourth Circuit's decision in Smyth v. Rivero (2002), this district court denied that its preliminary injunction entitled Stinnie to this award, simply because the external circumstances had changed. In 2023, the Fourth Circuit issued an en banc overturning of its decision in Smyth to award attorney's fees to Stinnie. Gerald Lackey, the Commissioner of the Virginia Department of Motor Vehicles, appealed this decision to the Supreme Court."
                case 2: // People v. Dain
                  return "The court limited review to the following issue: Did the Court of Appeal err in remanding the case with directions to reinstate the strike finding and to resentence defendant as a person who has suffered a prior strike conviction under the Three Strikes Law? (See People v. Williams (1998) 17 Cal.4th 148, 164, fn. 7; see also People v. McGlothin (1998) 67 Cal.App.4th 468, 478; People v. Humphrey (1997) 58 Cal.App.4th 809, 814; but see People v. Mayfield (2020) 50 Cal.App.5th 1096, 1109; People v. Strong (2001) 87 Cal.App.4th 328, 347.) This case presents the following issues: (1) Does the duty of a child welfare agency to inquire of extended family members and others about a child's potential Indian ancestry apply to children who are taken into custody under a protective custody warrant? (2) Does Assembly Bill No. 81 (2023-2024 Reg. Sess.), enacted as Stats. 2024, ch. 656 have any significance in this case?"
                case 3: // Ideological alignment
                  return "Which of your colleagues are you most ideologically aligned with?"
                default:
                  return question
              }
            }

            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start text-sm border-gray-200 hover:border-primary hover:bg-primary/5 whitespace-normal"
                onClick={() => onInputChange(getMessageForQuestion(index))}
                disabled={!sessionStarted || sessionEnded || sessionPaused || isLoading}
              >
                <div className="flex items-start gap-3 w-full">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-gray-700 text-left break-words flex-1 leading-relaxed">{question}</span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
} 