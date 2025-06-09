"use client"

import { motion } from "framer-motion"
import { Mail, Copy, Check } from "lucide-react"
import { useState } from "react"

interface DemoEmailProps {
  email: string
  verificationCode: string
}

export function DemoEmail({ email, verificationCode }: DemoEmailProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="mb-8 rounded-lg border bg-card p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4" />
          <span>Demo Email</span>
        </div>
        <div className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Demo Mode</div>
      </div>

      <div className="space-y-3 rounded-md bg-muted p-3">
        <div className="text-sm">
          <span className="font-medium">To:</span> {email}
        </div>
        <div className="text-sm">
          <span className="font-medium">Subject:</span> Your Verification Code
        </div>
        <div className="rounded-md bg-background p-3 text-sm">
          <p className="mb-4">Hello,</p>
          <p className="mb-4">Your verification code for HABIT is:</p>
          <div className="mb-4 flex items-center justify-center">
            <div className="relative">
              <div className="flex items-center gap-1 rounded-md bg-primary/10 px-4 py-2 font-mono text-xl font-bold tracking-widest text-primary">
                {verificationCode}
                <button
                  onClick={handleCopyCode}
                  className="ml-2 rounded-full p-1 hover:bg-primary/20"
                  aria-label="Copy verification code"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="mb-4">Enter this code on the verification page to continue.</p>
          <p>Best regards,</p>
          <p>The HABIT Team</p>
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground">
        <p>
          <span className="font-medium">Note:</span> In a real application, this email would be sent to your inbox.
        </p>
      </div>
    </motion.div>
  )
}
