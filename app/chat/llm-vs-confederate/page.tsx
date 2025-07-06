"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { chatTopicDisplayNames } from "@/lib/opinion-analyzer"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PageTransition } from "@/components/page-transition"
import { MessageAnimation } from "@/components/ui/message-animation"
import { PostSurvey, PostSurveyResponses } from "@/components/ui/post-survey"
import { SurveyThankYou } from "@/components/ui/survey-thank-you"

// Icons
import {
  MessageSquare,
  Users,
  Info,
  Timer,
  Pause,
  LogOut,
  Menu,
  ChevronLeft,
  Loader2,
} from "lucide-react"

function LLMvsConfederateComponent() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const moderatorMessageSentRef = useRef(false)

  const sessionTitle = "LLM vs Confederate Debate"
  const sessionDescription = "Debate against an AI opponent with a random position on a random topic"

  // State management
  const [room, setRoom] = useState<any>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(15 * 60)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [showSurveyThankYou, setShowSurveyThankYou] = useState(false)
  const [showTraining, setShowTraining] = useState(true)
  const [fetchError, setFetchError] = useState<any>(null)
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})
  const [cacheVersion, setCacheVersion] = useState(0)
  const [debateTopic, setDebateTopic] = useState<string | null>(null)

  // Function to get LLM's position from member data
  const getLLMPositionFromMemberData = (member: any) => {
    try {
      if (member && member.position_data) {
        return member.position_data
      }
      return null
    } catch (error) {
      console.error("Error getting LLM position from member data:", error)
      return null
    }
  }

  // Join LLM vs Confederate room
  useEffect(() => {
    const confederateName = "Ben" // Default confederate name
    let userId = `confederate_${Date.now()}`
    
    setLoadingRoom(true)
    
    fetch('/api/rooms/llm-vs-confederate/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        user_name: confederateName,
        is_confederate: true
      }),
    })
      .then(res => res.json())
      .then(({ room, error }) => {
        if (error) {
          console.error('Error joining LLM vs Confederate room:', error)
          setFetchError(error)
          return
        }
        
        console.log('Joined LLM vs Confederate room:', room)
        setRoom(room)
        setRoomId(room.id)
        setDebateTopic(room.topic)
        
        // Update user name cache
        setUserNameCache(prev => ({
          ...prev,
          [userId]: confederateName,
          [`llm_${room.llmName?.toLowerCase()}`]: room.llmName
        }))
        setCacheVersion(v => v + 1)
      })
      .catch((error) => {
        console.error('Network error joining room:', error)
        setFetchError(error)
        setRoom(null)
      })
      .finally(() => setLoadingRoom(false))
  }, [])

  // Fetch members when room is available
  useEffect(() => {
    if (room?.id) {
      const fetchMembers = async () => {
        try {
          const response = await fetch(`/api/rooms/${room.id}/members`)
          if (response.ok) {
            const membersData = await response.json()
            setMembers(membersData || [])
            
            // Update user name cache with member names
            const nameUpdates: Record<string, string> = {}
            membersData?.forEach((member: any) => {
              nameUpdates[member.user_id] = member.user_name
            })
            setUserNameCache(prev => ({ ...prev, ...nameUpdates }))
            setCacheVersion(v => v + 1)
          }
        } catch (error) {
          console.error("Error fetching members:", error)
        }
      }
      
      fetchMembers()
    }
  }, [room?.id])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return

    console.log("Setting up LLM vs Confederate subscriptions for room:", roomId)

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("New message received:", payload.new)
          const newMessage = payload.new
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    // Subscribe to member changes
    const membersSubscription = supabase
      .channel(`members:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public", 
          table: "room_users",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refetch members when changes occur
          fetch(`/api/rooms/${roomId}/members`)
            .then(res => res.json())
            .then(data => {
              setMembers(data || [])
              const nameUpdates: Record<string, string> = {}
              data?.forEach((member: any) => {
                nameUpdates[member.user_id] = member.user_name
              })
              setUserNameCache(prev => ({ ...prev, ...nameUpdates }))
              setCacheVersion(v => v + 1)
            })
            .catch(console.error)
        }
      )
      .subscribe()

    return () => {
      console.log("Cleaning up LLM vs Confederate subscriptions")
      supabase.removeChannel(messagesSubscription)
      supabase.removeChannel(membersSubscription)
    }
  }, [roomId])

  // Add initial moderator message
  useEffect(() => {
    if (room && !moderatorMessageSentRef.current && debateTopic) {
      const addInitialModeratorMessage = async () => {
        moderatorMessageSentRef.current = true
        
        const topicDisplayName = chatTopicDisplayNames[debateTopic] || debateTopic
        const llmPosition = room.llmPosition === "agree" ? "supports" : "opposes"
        
        const moderatorMessage = {
          room_id: roomId,
          sender_id: "moderator",
          sender_role: "system",
          content: `Welcome to the LLM vs Confederate debate! You are debating against "${room.llmName}" on the topic: "${topicDisplayName}". The AI ${llmPosition} this topic. Present your arguments and engage in a thoughtful debate. This session will last 15 minutes. You may begin when ready.`,
        }

        try {
          const { data: insertedMessage, error } = await supabase
            .from("messages")
            .insert([moderatorMessage])
            .select()
            .single()
            
          if (error) {
            console.error('Error inserting moderator message:', error)
            moderatorMessageSentRef.current = false
          }
        } catch (error) {
          console.error("Error adding moderator message:", error)
          moderatorMessageSentRef.current = false
        }
      }

      addInitialModeratorMessage()
    }
  }, [room, roomId, debateTopic])

  // Session timer
  useEffect(() => {
    if (!sessionStarted || sessionPaused || sessionEnded) return

    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1)
      setSessionTimeRemaining(prev => {
        if (prev <= 1) {
          setSessionEnded(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionStarted, sessionPaused, sessionEnded])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Start session when first user message is sent
  const startSession = () => {
    if (!sessionStarted) {
      setSessionStarted(true)
      console.log("LLM vs Confederate session started")
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get sender name with cache
  function getSenderName(message: any) {
    if (message.role === "system" || message.sender_id === "moderator") {
      return "Moderator"
    } else if (message.role === "assistant" || message.sender_id?.includes('llm_')) {
      return userNameCache[message.sender_id] || room?.llmName || "AI"
    } else if (message.role === "user") {
      return userNameCache[message.sender_id] || "Confederate"
    }
    return "Unknown"
  }

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !roomId) return

    startSession()
    setInput("")

    const userMessage = {
      room_id: roomId,
      sender_id: `confederate_${Date.now()}`,
      sender_role: "user",
      content: input.trim(),
    }

    try {
      // Insert confederate message
      const { data: insertedMessage, error: insertError } = await supabase
        .from("messages")
        .insert([userMessage])
        .select()
        .single()

      if (insertError) {
        console.error("Error inserting confederate message:", insertError)
        return
      }

      // Trigger AI response
      setTimeout(async () => {
        setIsLoading(true)
        try {
          const messagesForAPI = [...messages, insertedMessage]
          
          const requestBody = {
            messages: messagesForAPI,
            userTraits: {},
            topic: chatTopicDisplayNames[debateTopic] || debateTopic,
            roomId: roomId,
            debateTopic: chatTopicDisplayNames[debateTopic] || debateTopic,
            userPosition: room.llmPosition === "agree" ? "disagree" : "agree", // Confederate takes opposite position
            confederateName: room.llmName,
            conversationContext: {
              isDebateActive: true,
              uniqueUserCount: 2,
              recentMessageCount: messagesForAPI.length,
              shouldModerate: false
            }
          }

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          })

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`)
          }

          const data = await response.json()

          // Insert AI response
          const assistantMessage = {
            room_id: roomId,
            sender_id: `llm_${room.llmName?.toLowerCase()}`,
            sender_role: "assistant",
            content: data.content || "I'm not sure how to respond to that.",
          }

          await supabase.from("messages").insert([assistantMessage])

        } catch (error) {
          console.error("Error getting AI response:", error)
        } finally {
          setIsLoading(false)
        }
      }, 1000 + Math.random() * 2000) // 1-3 second delay

    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // Handle exit
  const handleExit = () => {
    setExitDialogOpen(true)
  }

  const confirmExit = () => {
    setExitDialogOpen(false)
    setShowExitSurvey(true)
  }

  const handleSurveyComplete = (responses: PostSurveyResponses) => {
    console.log("LLM vs Confederate survey responses:", responses)
    setShowExitSurvey(false)
    setShowSurveyThankYou(true)
  }

  const handleSurveyThankYouComplete = () => {
    router.push("/")
  }

  if (loadingRoom) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-2 text-muted-foreground">Setting up your LLM vs Confederate debate room...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (fetchError || !room) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-bold">Unable to Create Room</h2>
            <p className="mt-2 text-muted-foreground">
              {fetchError?.error || "There was an error setting up your debate room."}
            </p>
            <Button onClick={() => router.push("/")} className="mt-4">
              Return Home
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (showSurveyThankYou) {
    return (
      <PageTransition>
        <SurveyThankYou onComplete={handleSurveyThankYouComplete} />
      </PageTransition>
    )
  }

  if (showExitSurvey) {
    return (
      <PageTransition>
        <PostSurvey onComplete={handleSurveyComplete} />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <motion.div
          className={cn(
            "flex flex-col border-r bg-muted/30 transition-all duration-300",
            sidebarOpen ? "w-80" : "w-0",
            "hidden lg:flex"
          )}
          initial={false}
          animate={{ width: sidebarOpen ? 320 : 0 }}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold">LLM vs Confederate</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {/* Session Info */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-2 font-semibold">Session Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={sessionEnded ? "destructive" : sessionStarted ? "default" : "secondary"}>
                        {sessionEnded ? "Ended" : sessionStarted ? "Active" : "Waiting"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{formatTime(sessionTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className={sessionTimeRemaining < 60 ? "text-red-500" : ""}>
                        {formatTime(sessionTimeRemaining)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              <div className="space-y-4">
                <Tabs defaultValue="members">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="members">
                      <Users className="mr-2 h-4 w-4" />
                      Participants
                    </TabsTrigger>
                    <TabsTrigger value="info">
                      <Info className="mr-2 h-4 w-4" />
                      Info
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="members" className="mt-4 space-y-4">
                    {members.map((member) => {
                      const isLLM = member.user_id?.includes('llm_')
                      const position = isLLM ? getLLMPositionFromMemberData(member) : null
                      
                      return (
                        <div key={member.user_id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                                {member.user_name?.[0]?.toUpperCase() || "?"}
                              </div>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.user_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {isLLM ? "AI Participant" : "Confederate"}
                              </p>
                            </div>
                          </div>
                          {position && (
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", position.color, position.bgColor)}
                            >
                              {position.stance === "for" ? "For" : position.stance === "against" ? "Against" : "Neutral"}
                              {position.intensity !== "0.0" && ` (${(parseFloat(position.intensity) * 100).toFixed(0)}%)`}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </TabsContent>
                  <TabsContent value="info" className="mt-4">
                    <Card>
                      <CardContent className="p-4 text-sm">
                        <h3 className="mb-2 font-semibold">Current Topic</h3>
                        <p className="mb-4 text-muted-foreground">{chatTopicDisplayNames[debateTopic] || debateTopic}</p>
                        <h3 className="mb-2 font-semibold">AI Position</h3>
                        <p className="mb-4 text-muted-foreground">
                          {room.llmName} {room.llmPosition === "agree" ? "supports" : "opposes"} this topic
                        </p>
                        <h3 className="mb-2 font-semibold">Session Duration</h3>
                        <p className="text-muted-foreground">15 minutes</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:flex"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="font-semibold">{sessionTitle}</h1>
                <p className="text-sm text-muted-foreground">{sessionDescription}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sessionStarted && !sessionEnded && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4" />
                  <span className={sessionTimeRemaining < 60 ? "text-red-500" : ""}>
                    {formatTime(sessionTimeRemaining)}
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleExit}>
                <LogOut className="mr-2 h-4 w-4" />
                Exit
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4">
            <div className="mx-auto max-w-4xl space-y-4">
              {messages.map((message, index) => {
                const isUser = message.role === "user" || message.sender_role === "user"
                const isSystem = message.role === "system" || message.sender_role === "system"
                const senderName = getSenderName(message)

                return (
                  <MessageAnimation key={message.id || index} delay={index * 0.1}>
                    <div
                      className={cn(
                        "flex gap-3",
                        isUser && "flex-row-reverse",
                        isSystem && "justify-center"
                      )}
                    >
                      {!isSystem && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                            {senderName[0]?.toUpperCase() || "?"}
                          </div>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          isUser && "bg-primary text-primary-foreground",
                          !isUser && !isSystem && "bg-muted",
                          isSystem && "bg-muted/50 text-center text-sm text-muted-foreground"
                        )}
                      >
                        {!isSystem && (
                          <p className="mb-1 text-xs font-medium opacity-70">{senderName}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </MessageAnimation>
                )
              })}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                      {room.llmName?.[0]?.toUpperCase() || "A"}
                    </div>
                  </Avatar>
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                    <p className="mb-1 text-xs font-medium opacity-70">{room.llmName}</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          {!sessionEnded && (
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <AnimatedButton type="submit" disabled={!input.trim() || isLoading}>
                    Send
                  </AnimatedButton>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Exit Dialog */}
      {exitDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">End Session?</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Are you sure you want to end this debate session? You'll be asked to complete a brief exit survey.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setExitDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={confirmExit} className="flex-1">
                  End Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageTransition>
  )
}

export default function LLMvsConfederatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <LLMvsConfederateComponent />
    </Suspense>
  )
} 