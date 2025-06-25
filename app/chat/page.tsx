"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

function ChatRouter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomType = searchParams.get("type") || "1v1"
  const topic = searchParams.get("topic")
  const roomId = searchParams.get("roomId")

  useEffect(() => {
    // Build the URL for the specific chat page
    const baseUrl = roomType === "2v1" ? "/chat/2v1" : "/chat/1v1"
    const params = new URLSearchParams()
    
    if (topic) params.set("topic", topic)
    if (roomId) params.set("roomId", roomId)
    
    const queryString = params.toString()
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl
    
    // Redirect to the appropriate chat page
    router.replace(fullUrl)
  }, [router, roomType, topic, roomId])

  return (
    <PageTransition>
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-muted-foreground">Redirecting to chat room...</p>
        </div>
      </div>
    </PageTransition>
  )
}

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-2 text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </PageTransition>
    }>
      <ChatRouter />
    </Suspense>
  )
} 