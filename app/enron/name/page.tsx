"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, ArrowRight } from "lucide-react"

export default function EnronNamePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Check if user has consented
    const hasConsented = sessionStorage.getItem("enron_consent")
    if (!hasConsented) {
      router.push("/enron/informed-consent")
      return
    }

    // Pre-fill name if already stored
    const storedName = sessionStorage.getItem("userName")
    if (storedName) {
      setName(storedName)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setIsSubmitting(true)
    
    // Store name in session storage
    sessionStorage.setItem("userName", name.trim())
    sessionStorage.setItem("enron_name_timestamp", new Date().toISOString())
    sessionStorage.setItem("enron_direct_entry", "true")
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Redirect to Enron chatroom with auto-join parameter
    router.push("/chat/enron?autoJoin=true")
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <User className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Enron Whaling Project</h1>
            <p className="text-gray-600 mt-2">Please enter your name to begin</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">Participant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    required
                    disabled={isSubmitting}
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    This name will be displayed during your chat session
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">What's Next:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• You'll be connected to the Enron AI Assistant</li>
                    <li>• Chat session will last approximately 30 minutes</li>
                    <li>• You can ask about Kenneth Lay, emails, or request phishing examples</li>
                    <li>• Use the quick select options for easy access to common queries</li>
                  </ul>
                </div>

                <AnimatedButton
                  type="submit"
                  disabled={!name.trim() || isSubmitting}
                  className="w-full py-3"
                >
                  {isSubmitting ? (
                    "Starting Session..."
                  ) : (
                    <>
                      Begin Enron Session
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </AnimatedButton>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-gray-500">
            <p>Ready to explore insider threat models and whaling attack scenarios</p>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 