"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, ArrowRight, Mail } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function EnronNamePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Check if user has consented
    const hasConsented = sessionStorage.getItem("enron_consent")
    if (!hasConsented) {
      router.push("/enron/informed-consent")
      return
    }

    // Pre-fill name and email if already stored
    const storedName = sessionStorage.getItem("userName")
    const storedEmail = sessionStorage.getItem("userEmail")
    if (storedName) {
      setName(storedName)
    }
    if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setIsSubmitting(true)
    
    try {
      // Generate unique user ID
      let userId = sessionStorage.getItem("userId")
      if (!userId) {
        userId = `enron_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem("userId", userId)
      }
      
      // Store data in session storage
      sessionStorage.setItem("userName", name.trim())
      if (email.trim()) {
        sessionStorage.setItem("userEmail", email.trim())
      }
      sessionStorage.setItem("enron_name_timestamp", new Date().toISOString())
      sessionStorage.setItem("enron_direct_entry", "true")
      
      // Save to Supabase user_data table
      const userData = {
        user_id: userId,
        name: name.trim(),
        email: email.trim() || null,
        session_type: "enron_whaling",
        entry_method: "direct_enron_flow", 
        consent_given: true,
        consent_timestamp: sessionStorage.getItem("enron_consent_timestamp")
      }
      
      console.log("🔍 [ENRON NAME] Attempting to save user data to Supabase...")
      console.log("🔍 [ENRON NAME] User data payload:", JSON.stringify(userData, null, 2))
      console.log("🔍 [ENRON NAME] Supabase client available:", !!supabase)
      
      try {
        // First try a simple insert
        const { data: insertData, error: insertError } = await supabase
          .from("user_data")
          .insert(userData)
          .select()
        
        if (insertError) {
          console.error("❌ [ENRON NAME] Insert error:", insertError)
          console.error("❌ [ENRON NAME] Error details:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          })
          
          // Try upsert if insert fails
          console.log("🔄 [ENRON NAME] Trying upsert instead...")
          const { data: upsertData, error: upsertError } = await supabase
            .from("user_data")
            .upsert(userData, {
              onConflict: "user_id"
            })
            .select()
          
                     if (upsertError) {
             console.error("❌ [ENRON NAME] Upsert error:", upsertError)
             console.error("❌ [ENRON NAME] Upsert error details:", {
               message: upsertError.message,
               details: upsertError.details,
               hint: upsertError.hint,
               code: upsertError.code
             })
             
             // Try with just basic columns as last resort
             console.log("🔄 [ENRON NAME] Trying minimal data insert...")
             const minimalData: { user_id: string; name: string; email?: string } = {
               user_id: userId,
               name: name.trim()
             }
             
             if (email.trim()) {
               minimalData.email = email.trim()
             }
             
             const { data: minimalData_result, error: minimalError } = await supabase
               .from("user_data")
               .insert(minimalData)
               .select()
             
             if (minimalError) {
               console.error("❌ [ENRON NAME] Minimal insert also failed:", minimalError)
             } else {
               console.log("✅ [ENRON NAME] Successfully inserted minimal user data:", minimalData_result)
             }
           } else {
             console.log("✅ [ENRON NAME] Successfully upserted user data:", upsertData)
           }
         } else {
           console.log("✅ [ENRON NAME] Successfully inserted user data:", insertData)
         }
       } catch (dbError) {
         console.error("❌ [ENRON NAME] Database operation failed:", dbError)
         console.error("❌ [ENRON NAME] Error type:", typeof dbError)
         console.error("❌ [ENRON NAME] Error stack:", dbError instanceof Error ? dbError.stack : "No stack trace")
       }
      
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to Enron chatroom with auto-join parameter
      router.push("/chat/enron?autoJoin=true")
      
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      setIsSubmitting(false)
      // Still redirect on error to not block user flow
      router.push("/chat/enron?autoJoin=true")
    }
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Your Name *
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

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Used for research follow-up and participation tracking (optional)
                    </p>
                  </div>
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