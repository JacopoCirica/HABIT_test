"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Mail, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

interface FallbackCodeDisplayProps {
  verificationCode: string
  email: string
  fallbackReason?: string
}

export function FallbackCodeDisplay({ verificationCode, email, fallbackReason }: FallbackCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">Verification Code</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            {fallbackReason || "Email delivery is temporarily unavailable. Please use the code below to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-amber-700 mb-2">Your verification code for {email}:</p>
            <div className="flex items-center justify-center gap-2">
              <div className="bg-white border-2 border-amber-300 rounded-lg px-6 py-3 font-mono text-2xl font-bold tracking-widest text-amber-900">
                {verificationCode}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">Why am I seeing this?</p>
                <p>
                  To send emails to any address, our email service requires domain verification. For now, you can use
                  the verification code displayed above to continue with your registration.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-600 text-center">This code will expire in 10 minutes.</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
