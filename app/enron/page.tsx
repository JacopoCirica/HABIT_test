"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { Loader2 } from "lucide-react"

export default function EnronEntryPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect immediately to informed consent for Enron flow
    router.push("/enron/informed-consent")
  }, [router])

  return (
    <PageTransition>
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Redirecting to Enron Whaling Project...</p>
        </div>
      </div>
    </PageTransition>
  )
} 