"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/page-transition"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { FadeIn } from "@/components/ui/fade-in"
import { MessageAnimation } from "@/components/ui/message-animation"
import { OnboardingTraining } from "@/components/ui/onboarding-training"
import { OpinionPoll } from "@/components/ui/opinion-poll"
import { OpinionTrackerVisualization } from "@/components/ui/opinion-tracker-visualization"
import { PostSurvey } from "@/components/ui/post-survey"
import { SurveyThankYou } from "@/components/ui/survey-thank-you"
import { ModeratorControls } from "@/components/ui/moderator-controls"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import {
  MessageSquare,
  Send,
  Timer,
  Pause,
  Users,
  Info,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
  BarChart2,
} from "lucide-react"

// Import necessary types and utilities
import { ChatMessage, ChatRoom } from "@/lib/chat-rooms"
import { trackOpinion, OpinionTrackingData } from "@/lib/opinion-tracker"
import { PostSurveyResponses } from "@/lib/post-survey-actions"

export default function Chat1v1Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get URL parameters
  const topic = searchParams.get("topic") as string
  const roomId = searchParams.get("roomId") as string

  // State management
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const [userName, setUserName] = useState("")
  
  // Session management
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(15 * 60)
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showTraining, setShowTraining] = useState(true)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [showOpinionPoll, setShowOpinionPoll] = useState(false)
  const [showOpinionTracker, setShowOpinionTracker] = useState(false)
  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [showSurveyThankYou, setShowSurveyThankYou] = useState(false)
  
  // Error handling
  const [useSimulatedResponses, setUseSimulatedResponses] = useState(false)
  const [apiErrorCount, setApiErrorCount] = useState(0)
  const MAX_API_ERRORS = 3

  // Opinion tracking
  const [opinionTrackingData, setOpinionTrackingData] = useState<OpinionTrackingData | null>(null)
  const [debateTopic, setDebateTopic] = useState<string | null>(null)

  // Topic display names
  const topicDisplayNames: Record<string, string> = {
    "social-media-regulation": "Social Media Regulation",
    "climate-change-policy": "Climate Change Policy",
    "universal-basic-income": "Universal Basic Income",
    "artificial-intelligence-ethics": "Artificial Intelligence Ethics",
    "healthcare-system-reform": "Healthcare System Reform",
  }

  const sessionTitle = debateTopic ? topicDisplayNames[debateTopic] : "Opinion Discussion"
  const sessionDescription = "Discuss and debate various social and political topics"

  // Room members for 1v1
  const roomMembers = [
    { name: userName, role: "user" },
    { name: currentRoom?.confederateName || "Confederate", role: "confederate" },
    { name: "Moderator", role: "moderator" },
  ]

  // Initialize 1v1 room
  useEffect(() => {
    if (topic && roomId) {
      // Load from localStorage or create new room
      const storedRooms = JSON.parse(localStorage.getItem("chatRooms") || "[]")
      const room = storedRooms.find((r: ChatRoom) => r.id === roomId)
      
      if (room) {
        setCurrentRoom(room)
        // Load messages from localStorage
        const storedMessages = JSON.parse(localStorage.getItem(`messages_${roomId}`) || "[]")
        setMessages(storedMessages.map((msg: ChatMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          sender_id: msg.sender_id || "user",
          created_at: msg.timestamp?.toISOString() || new Date().toISOString(),
        })))
      }
      
      setDebateTopic(topic)
      setUserName(sessionStorage.getItem("userName") || "User")
    }
  }, [topic, roomId])

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTimerColor = (timeRemaining: number) => {
    if (timeRemaining <= 60) return "text-red-600"
    if (timeRemaining <= 300) return "text-amber-600"
    return "text-green-600"
  }

  const getTimerBgColor = (timeRemaining: number) => {
    if (timeRemaining <= 60) return "bg-red-50"
    if (timeRemaining <= 300) return "bg-amber-50"
    return "bg-green-50"
  }

  const getAvatarInitial = (name: string) => name.charAt(0).toUpperCase()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen)
  const toggleOpinionTracker = () => setShowOpinionTracker(!showOpinionTracker)

  const handleExitClick = () => setExitDialogOpen(true)
  const handleExitConfirm = () => {
    setShowExitSurvey(true)
    setExitDialogOpen(false)
  }
  const handleExitCancel = () => setExitDialogOpen(false)

  const handleTrainingComplete = () => {
    setShowTraining(false)
    setSessionStarted(true)
    
    // Start session timer
    const interval = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setSessionEnded(true)
          return 0
        }
        return prev - 1
      })
      setSessionTime((prev) => prev + 1)
    }, 1000)
  }

  const handleSessionEnd = () => {
    setSessionEnded(true)
    setShowExitSurvey(true)
  }

  const handleOpinionUpdate = (value: number, reason: string) => {
    if (debateTopic) {
      const updatedData = trackOpinion(debateTopic, value, reason)
      setOpinionTrackingData(updatedData)
      setShowOpinionPoll(false)
    }
  }

  const handleSurveySubmit = async (responses: PostSurveyResponses) => {
    try {
      // Save survey responses
      console.log("Survey responses:", responses)
      setShowExitSurvey(false)
      setShowSurveyThankYou(true)
    } catch (error) {
      console.error("Error submitting survey:", error)
    }
  }

  const handleSurveyClose = () => {
    setShowExitSurvey(false)
    router.push("/")
  }

  const handleThankYouClose = () => {
    setShowSurveyThankYou(false)
    router.push("/")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)

  const getSimulatedResponse = () => {
    const responses = [
      "That's an interesting perspective. I see it differently though.",
      "I understand your point, but have you considered the alternative viewpoint?",
      "That's a valid concern. What do you think about the counterargument?",
      "I appreciate your reasoning. Here's another way to look at it...",
      "That's thought-provoking. I'd like to challenge that assumption.",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomId) return

    const trimmedInput = input.trim()
    setInput("")

    // Get or create consistent user ID
    let userId = sessionStorage.getItem("userId")
    if (!userId) {
      userId = `user_${Date.now()}`
      sessionStorage.setItem("userId", userId)
    }

    setIsLoading(true)

    // Add user message to local state
    const userMessage = {
      id: `${userId}_${Date.now()}`,
      role: "user" as const,
      content: trimmedInput,
      sender_id: userId,
      created_at: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, userMessage])
    
    // Save to localStorage
    if (currentRoom) {
      const chatMessageForStorage: ChatMessage = {
        ...userMessage,
        roomId: roomId,
        timestamp: new Date(),
      }
      const existingMessages = JSON.parse(localStorage.getItem(`messages_${roomId}`) || "[]")
      localStorage.setItem(`messages_${roomId}`, JSON.stringify([...existingMessages, chatMessageForStorage]))
    }

    // Handle AI response
    try {
      const storedName = sessionStorage.getItem("userName") || "User"
      const storedAge = sessionStorage.getItem("userAge") || "Unknown"
      const storedSex = sessionStorage.getItem("userSex") || "Unknown"
      const storedEducation = sessionStorage.getItem("userEducation") || "Unknown"
      const storedOccupation = sessionStorage.getItem("userOccupation") || "Unknown"
      
      const userTraits = {
        gender: storedSex,
        age: storedAge,
        education: storedEducation,
        employment: storedOccupation,
      }
      
      const requestBody = {
        messages: messages,
        userTraits,
        topic: debateTopic ? topicDisplayNames[debateTopic] : "the current topic",
        roomId: roomId,
        debateTopic: debateTopic ? topicDisplayNames[debateTopic] : null,
        userPosition: opinionTrackingData
          ? opinionTrackingData.initialOpinion.value > 4
            ? "agree"
            : opinionTrackingData.initialOpinion.value < 4
              ? "disagree"
              : "neutral"
          : null,
        confederateName: currentRoom?.confederateName || null,
      }
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Add AI response
      const assistantMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant" as const,
        content: data.content || "I'm not sure how to respond to that.",
        sender_id: "confederate",
        created_at: new Date().toISOString(),
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Save to localStorage
      if (currentRoom) {
        const chatMessageForStorage: ChatMessage = {
          ...assistantMessage,
          roomId: roomId,
          timestamp: new Date(),
        }
        const existingMessages = JSON.parse(localStorage.getItem(`messages_${roomId}`) || "[]")
        localStorage.setItem(`messages_${roomId}`, JSON.stringify([...existingMessages, chatMessageForStorage]))
      }
      
    } catch (error) {
      console.error("Error in chat submit:", error)
      
      // Fallback to simulated response
      const simulatedResponse = getSimulatedResponse()
      const fallbackMessage = {
        id: `assistant_fallback_${Date.now()}`,
        role: "assistant" as const,
        content: simulatedResponse,
        sender_id: "confederate",
        created_at: new Date().toISOString(),
      }
      
      setMessages(prev => [...prev, fallbackMessage])
      
      if (currentRoom) {
        const chatMessageForStorage: ChatMessage = {
          ...fallbackMessage,
          roomId: roomId,
          timestamp: new Date(),
        }
        const existingMessages = JSON.parse(localStorage.getItem(`messages_${roomId}`) || "[]")
        localStorage.setItem(`messages_${roomId}`, JSON.stringify([...existingMessages, chatMessageForStorage]))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!currentRoom || !roomId) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-2 text-muted-foreground">Setting up your chat room...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={toggleMobileSidebar}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                <span className="text-xl font-bold">HABIT</span>
              </div>
              <Separator orientation="vertical" className="hidden h-6 md:block" />
              <div className="hidden items-center gap-2 md:flex">
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                  {sessionTitle}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                  1v1 Chat
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-300",
                  getTimerBgColor(sessionTimeRemaining),
                )}
              >
                {sessionPaused ? (
                  <Pause className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                ) : (
                  <Timer className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                )}
                <span className={cn("text-sm font-medium", getTimerColor(sessionTimeRemaining))}>
                  {sessionStarted ? formatTime(sessionTimeRemaining) : "15:00"}
                </span>
              </motion.div>

              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={handleExitClick}
                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Session</span>
              </AnimatedButton>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <motion.div
            className={cn(
              "hidden border-r bg-white transition-all duration-300 ease-in-out md:block",
              sidebarOpen ? "w-80" : "w-0",
            )}
            animate={{ width: sidebarOpen ? "20rem" : "0rem" }}
          >
            <div className="flex h-full flex-col">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Session Details</h2>
                  <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <Tabs defaultValue="members">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="members">
                      <Users className="mr-2 h-4 w-4" />
                      Members
                    </TabsTrigger>
                    <TabsTrigger value="info">
                      <Info className="mr-2 h-4 w-4" />
                      Info
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="members" className="mt-4 space-y-4">
                    {roomMembers.map((member, index) => (
                      <motion.div
                        key={member.name}
                        className="flex items-center gap-3 rounded-lg border p-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Avatar className="h-10 w-10">
                          <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                            {getAvatarInitial(member.name)}
                          </div>
                        </Avatar>
                        <div className="flex flex-col">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {member.role}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </TabsContent>
                  <TabsContent value="info" className="mt-4">
                    <Card>
                      <CardContent className="p-4 text-sm">
                        <h3 className="mb-2 font-semibold">Current Topic</h3>
                        <p className="mb-4 text-muted-foreground">{sessionTitle}</p>
                        <h3 className="mb-2 font-semibold">Discussion Question</h3>
                        <p className="mb-4 text-muted-foreground">{sessionDescription}</p>
                        <h3 className="mb-2 font-semibold">Session Duration</h3>
                        <p className="text-muted-foreground">15 minutes</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>

          {/* Main chat area */}
          <div className="flex flex-1 flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mx-auto max-w-3xl space-y-6">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-4 text-center">
                    <h2 className="text-lg font-semibold">{sessionTitle}</h2>
                    <p className="text-sm text-muted-foreground">{sessionDescription}</p>
                    {sessionStarted && !sessionEnded && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <Timer className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                        <span className={cn("text-sm font-medium", getTimerColor(sessionTimeRemaining))}>
                          {formatTime(sessionTimeRemaining)} remaining
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isUser = message.role === "user"
                    const senderName = isUser ? userName : (message.role === "assistant" ? (currentRoom?.confederateName || "Confederate") : "Moderator")

                    return (
                      <MessageAnimation
                        key={message.id || index}
                        isUser={isUser}
                        delay={index * 0.05}
                        className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                      >
                        {!isUser && (
                          <Avatar className="h-9 w-9 mt-1">
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                              {getAvatarInitial(senderName)}
                            </div>
                          </Avatar>
                        )}

                        <div className={cn("flex max-w-[75%] flex-col", isUser ? "items-end" : "items-start")}>
                          <div className="mb-1">
                            <span className="text-sm font-medium">{senderName}</span>
                          </div>
                          <motion.div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                              isUser
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : "rounded-tl-sm bg-white text-foreground",
                            )}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                          >
                            {message.content}
                          </motion.div>
                        </div>

                        {isUser && (
                          <Avatar className="h-9 w-9 mt-1">
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                              {getAvatarInitial(senderName)}
                            </div>
                          </Avatar>
                        )}
                      </MessageAnimation>
                    )
                  })}
                  
                  {isLoading && (
                    <MessageAnimation delay={0.1}>
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9 mt-1">
                          <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                            {getAvatarInitial(currentRoom?.confederateName || "Confederate")}
                          </div>
                        </Avatar>
                        <div className="flex max-w-[75%] flex-col items-start">
                          <div className="mb-1">
                            <span className="text-sm font-medium">{currentRoom?.confederateName || "Confederate"}</span>
                          </div>
                          <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm shadow-sm">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              <span className="text-muted-foreground">Typing...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </MessageAnimation>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Input area */}
            <div className="border-t bg-white p-4">
              <form onSubmit={handleChatSubmit} className="mx-auto max-w-3xl">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder={
                      !sessionStarted
                        ? "Session will begin after onboarding..."
                        : sessionEnded
                          ? "Session has ended"
                          : "Type your message..."
                    }
                    disabled={isLoading || !sessionStarted || sessionEnded}
                    className="flex-1"
                  />
                  <AnimatedButton
                    type="submit"
                    disabled={isLoading || !input.trim() || !sessionStarted || sessionEnded}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Send</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Dialogs and overlays */}
        <ConfirmationDialog
          isOpen={exitDialogOpen}
          onClose={handleExitCancel}
          onConfirm={handleExitConfirm}
          title="Exit Session"
          description="Are you sure you want to leave this session?"
          confirmText="Yes, Exit Session"
          cancelText="Stay in Session"
        />

        {showTraining && <OnboardingTraining onComplete={handleTrainingComplete} />}

        {showExitSurvey && (
          <PostSurvey
            isOpen={showExitSurvey}
            onClose={handleSurveyClose}
            onSubmit={handleSurveySubmit}
            sessionDuration={sessionTime}
          />
        )}

        {showSurveyThankYou && <SurveyThankYou onClose={handleThankYouClose} />}
      </div>
    </PageTransition>
  )
} 