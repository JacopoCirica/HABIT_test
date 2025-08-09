"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, AlertTriangle } from "lucide-react"

export default function EnronInformedConsentPage() {
  const router = useRouter()
  const [hasConsented, setHasConsented] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!hasConsented) return
    
    setIsSubmitting(true)
    
    // Store consent in session storage
    sessionStorage.setItem("enron_consent", "true")
    sessionStorage.setItem("enron_consent_timestamp", new Date().toISOString())
    
    // Redirect to name collection
    router.push("/enron/name")
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto max-w-4xl py-8">
          <div className="text-center mb-8">
            <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Enron Whaling Project</h1>
            <p className="text-lg text-gray-600 mt-2">Informed Consent for Research Participation</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Research Study Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">Study Purpose:</h3>
                <p>
                  This research examines insider threat models and whaling attack scenarios using the Enron AI Assistant. 
                  You will interact with an AI system that has knowledge of Enron Corporation and its executives, 
                  particularly CEO Kenneth Lay.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What You Will Do:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Engage in conversation with the Enron AI Assistant</li>
                  <li>Ask questions about Kenneth Lay's background and career</li>
                  <li>Request information from email archives when relevant</li>
                  <li>Potentially request the creation of phishing emails for research purposes</li>
                  <li>Session will last approximately 30 minutes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Data Collection:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your conversation with the AI assistant will be recorded</li>
                  <li>Basic demographic information may be collected</li>
                  <li>Response patterns and interaction data will be analyzed</li>
                  <li>All data will be anonymized and used for research purposes only</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Risks and Benefits:</h3>
                <p>
                  <strong>Risks:</strong> Minimal risk. You may encounter simulated phishing content designed for educational purposes.
                </p>
                <p className="mt-2">
                  <strong>Benefits:</strong> Contributing to cybersecurity research and learning about social engineering techniques.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Confidentiality:</h3>
                <p>
                  Your participation is confidential. Data will be stored securely and only accessible to authorized researchers. 
                  You may withdraw from the study at any time without penalty.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Important Note:</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      This is a research simulation. Any phishing emails created are for educational purposes only 
                      and should never be used for actual malicious activities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3 mb-6">
                <Checkbox 
                  id="consent" 
                  checked={hasConsented}
                  onCheckedChange={(checked) => setHasConsented(!!checked)}
                />
                <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  I have read and understood the information above. I voluntarily agree to participate in this research study. 
                  I understand that I can withdraw at any time without penalty. I consent to the collection and analysis of my 
                  interaction data for research purposes.
                </label>
              </div>

              <div className="flex justify-center">
                <AnimatedButton
                  onClick={handleSubmit}
                  disabled={!hasConsented || isSubmitting}
                  className="px-8 py-3"
                >
                  {isSubmitting ? "Processing..." : "Agree and Continue"}
                </AnimatedButton>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-gray-500">
            <p>Questions about this research? Contact the research team via the platform.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 