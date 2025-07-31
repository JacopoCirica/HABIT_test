"use client"

import { useState, useEffect, useRef, Suspense } from "react"
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
import { PostSurvey } from "@/components/ui/post-survey"
import { SurveyThankYou } from "@/components/ui/survey-thank-you"
import {
  MessageSquare,
  Send,
  Timer,
  Pause,
  Users,
  Info,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react"

// Import Supabase and utilities
import { supabase } from "@/lib/supabaseClient"
import { PostSurveyResponses } from "@/components/ui/post-survey"

function ChatScotobotComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ref for tracking moderator message
  const moderatorMessageSentRef = useRef(false)

  const sessionTitle = "Scotobot Session"
  const sessionDescription = "Discuss and explore various topics with Justice ROBert"

  // State management
  const [room, setRoom] = useState<any>(null)
  const [roomIdScotobot, setRoomIdScotobot] = useState<string | null>(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [waitingForConnection, setWaitingForConnection] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(30 * 60) // 30 minutes
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [showSurveyThankYou, setShowSurveyThankYou] = useState(false)
  const [showTraining, setShowTraining] = useState(true)
  const [fetchError, setFetchError] = useState<any>(null)
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})
  const [cacheVersion, setCacheVersion] = useState(0)

  // Justice ROBert configuration
  const justiceRobertName = "Justice ROBert"
  const justiceRobertId = "justice_robert"

  // Join or create Scotobot room
  useEffect(() => {
    const userName = sessionStorage.getItem("userName") || "User"
    let userId = sessionStorage.getItem("userId")
    if (!userId) {
      userId = `user_${Date.now()}`
      sessionStorage.setItem("userId", userId)
    }

    // Update user name cache
    setUserNameCache(prev => {
      const updated = {
        ...prev,
        [userId!]: userName,
        [justiceRobertId]: justiceRobertName
      }
      setCacheVersion(v => v + 1)
      return updated
    })

    setLoadingRoom(true)
    
    fetch('/api/rooms/scotobot/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        user_name: userName
      }),
    })
      .then(res => res.json())
      .then(({ room }) => {
        console.log('Joined Scotobot room:', room)
        setRoom(room)
        setRoomIdScotobot(room.id)
        setWaitingForConnection(room.status === 'waiting')
      })
      .catch(() => setRoom(null))
      .finally(() => setLoadingRoom(false))
  }, [])

  // Set up Supabase subscription for messages
  useEffect(() => {
    if (!roomIdScotobot) return

    console.log('Setting up Scotobot subscription for roomId:', roomIdScotobot)

    // Fetch all messages for this room on initial load
    const fetchMessages = async () => {
      console.log('Fetching Scotobot messages for roomId:', roomIdScotobot)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomIdScotobot)
        .order('created_at', { ascending: true })
      if (!error && data) {
        console.log('Fetched Scotobot messages:', data)
        const fetchedMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.sender_role,
          content: msg.content,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
        }))
        
        setMessages(fetchedMessages)
        setFetchError(null)
        
        // Check if moderator message already exists
        const hasModeratorMessage = fetchedMessages.some(msg => msg.sender_id === "moderator")
        if (hasModeratorMessage) {
          moderatorMessageSentRef.current = true
        } else if (!moderatorMessageSentRef.current) {
          // If no moderator message exists, create one
          console.log('Scotobot no moderator message found, attempting to add one...')
          setTimeout(() => addInitialModeratorMessage(), 1000)
        }
      } else {
        console.error('Error fetching Scotobot messages:', error)
        setFetchError(error)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`scotobot-room-messages-${roomIdScotobot}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomIdScotobot}`,
        },
        (payload) => {
          console.log('Scotobot received new message:', payload.new)
          console.log('Scotobot current messages count before update:', messages.length)
          const newMessage = payload.new
          
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              console.log('Scotobot message already exists, skipping')
              return prev
            }
            const updatedMessages = [
              ...prev,
              {
                id: newMessage.id,
                role: newMessage.sender_role,
                content: newMessage.content,
                sender_id: newMessage.sender_id,
                created_at: newMessage.created_at,
              },
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            
            console.log('Scotobot messages updated, new count:', updatedMessages.length)
            return updatedMessages
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomIdScotobot])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Session timer
  useEffect(() => {
    if (sessionStarted && !sessionEnded && !sessionPaused && sessionTimeRemaining > 0) {
      const timer = setInterval(() => {
        setSessionTime(prev => prev + 1)
        setSessionTimeRemaining(prev => {
          if (prev <= 1) {
            setSessionEnded(true)
            setShowExitSurvey(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [sessionStarted, sessionEnded, sessionPaused, sessionTimeRemaining])

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

  const handleExitClick = () => setExitDialogOpen(true)
  const handleExitConfirm = () => {
    setShowExitSurvey(true)
    setExitDialogOpen(false)
  }
  const handleExitCancel = () => setExitDialogOpen(false)

  // Add initial moderator message when session starts
  const addInitialModeratorMessage = async () => {
    if (!roomIdScotobot || moderatorMessageSentRef.current) {
      console.log('Scotobot moderator message blocked:', { roomId: !!roomIdScotobot, alreadySent: moderatorMessageSentRef.current })
      return
    }
    
    console.log('Scotobot executing addInitialModeratorMessage...')
    moderatorMessageSentRef.current = true
    
    const moderatorMessage = {
      room_id: roomIdScotobot,
      sender_id: "moderator",
      sender_role: "system",
      content: `Welcome to Scotobot! You're now connected with Justice ROBert, an AI assistant ready to discuss various topics with you. Feel free to ask questions, share thoughts, or explore ideas together. This session will last 30 minutes. How can Justice ROBert assist you today?`,
    }

    try {
      const { data: insertedMessage, error } = await supabase
        .from("messages")
        .insert([moderatorMessage])
        .select()
        .single()
        
      if (!error && insertedMessage) {
        console.log('Scotobot moderator message inserted successfully')
        const localMessage = {
          id: insertedMessage.id,
          role: insertedMessage.sender_role,
          content: insertedMessage.content,
          sender_id: insertedMessage.sender_id,
          created_at: insertedMessage.created_at,
        }
        
        setMessages(prev => {
          if (prev.some(msg => msg.id === localMessage.id)) {
            return prev
          }
          return [localMessage, ...prev]
        })
        
        // After moderator message, Justice ROBert introduces himself
        setTimeout(() => addJusticeRobertGreeting(), 2000)
        
      } else {
        console.error('Scotobot error inserting moderator message:', error)
        moderatorMessageSentRef.current = false
      }
    } catch (error) {
      console.error("Scotobot error adding moderator message:", error)
      moderatorMessageSentRef.current = false
    }
  }

  // Add Justice ROBert's initial greeting
  const addJusticeRobertGreeting = async () => {
    if (!roomIdScotobot) return
    
    console.log('Adding Justice ROBert greeting...')
    
    const greetingMessage = {
      room_id: roomIdScotobot,
      sender_id: justiceRobertId,
      sender_role: "assistant",
      content: "Hello! I'm Justice ROBert, and I'm delighted to meet you. I'm here to engage in thoughtful discussion on any topic you'd like to explore. Whether you're interested in legal matters, philosophy, current events, or anything else that sparks your curiosity, I'm ready to dive in. What would you like to discuss today?",
    }
    
    try {
      const { data: insertedGreeting, error: greetingError } = await supabase
        .from("messages")
        .insert([greetingMessage])
        .select()
        .single()
        
      if (!greetingError) {
        console.log('Justice ROBert greeting inserted successfully')
        setSessionStarted(true) // Start the session after greeting
      } else {
        console.error('Error inserting Justice ROBert greeting:', greetingError)
      }
      
    } catch (error) {
      console.error('Error adding Justice ROBert greeting:', error)
    }
  }

  // Chat submit handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomIdScotobot) return

    const trimmedInput = input.trim()
    setInput("")
    setIsLoading(true)

    // Get consistent user ID
    let userId = sessionStorage.getItem("userId")
    if (!userId) {
      userId = `user_${Date.now()}`
      sessionStorage.setItem("userId", userId)
    }

    // Insert user message into Supabase immediately
    const userMessage = {
      room_id: roomIdScotobot,
      sender_id: userId,
      sender_role: "user",
      content: trimmedInput,
    }

    console.log("Scotobot inserting user message:", userMessage)

    const { data: insertedMessage, error: userError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select()
      .single()
      
    if (userError) {
      console.error("Scotobot failed to send message:", userError)
      setIsLoading(false)
      return
    }
    
    console.log("Scotobot message inserted successfully:", insertedMessage)

    // Generate Justice ROBert's response
    try {
      console.log("Scotobot generating Justice ROBert response")
      
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
        topic: "General Discussion",
        roomId: roomIdScotobot,
        debateTopic: null,
        userPosition: "neutral",
        confederateName: justiceRobertName,
        roomType: "scotobot",
        responderId: justiceRobertId,
      }
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Justice ROBert response failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Add delay before Justice ROBert responds (1-3 seconds)
      const responseDelay = Math.random() * 2000 + 1000
      await new Promise(resolve => setTimeout(resolve, responseDelay))
      
      // Insert Justice ROBert's response
      const justiceRobertMessage = {
        room_id: roomIdScotobot,
        sender_id: justiceRobertId,
        sender_role: "assistant",
        content: data.content || "I appreciate your message. Could you tell me more about that?",
      }
      
      const { data: insertedJRMessage, error: jrError } = await supabase
        .from("messages")
        .insert([justiceRobertMessage])
        .select()
        .single()
        
      if (!jrError) {
        console.log("Scotobot Justice ROBert response inserted successfully")
      } else {
        console.error("Scotobot error inserting Justice ROBert response:", jrError)
      }
      
    } catch (error) {
      console.error("Scotobot error generating Justice ROBert response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Survey submission handler
  const handleSurveySubmit = async (responses: PostSurveyResponses) => {
    console.log("Scotobot submitting survey responses:", responses)
    
    try {
      const sessionData = {
        roomId: roomIdScotobot,
        userId: sessionStorage.getItem("userId"),
        roomType: "scotobot",
        sessionDuration: sessionTime,
      }

      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          sessionData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit survey')
      }

      const result = await response.json()
      console.log("Scotobot survey submitted successfully:", result)
      
      setShowExitSurvey(false)
      setShowSurveyThankYou(true)
      
    } catch (error) {
      console.error("Error submitting Scotobot survey:", error)
    }
  }

  // Get sender name with cache
  function getSenderName(message: any) {
    if (message.role === "system") {
      return "Moderator"
    } else if (message.sender_id === justiceRobertId) {
      return justiceRobertName
    } else if (message.role === "user") {
      if (userNameCache[message.sender_id]) {
        return userNameCache[message.sender_id]
      }
      
      const currentUserId = sessionStorage.getItem("userId")
      if (message.sender_id === currentUserId) {
        return sessionStorage.getItem("userName") || "User"
      }
      
      return "User"
    }
    return "Unknown"
  }

  // Loading states
  if (loadingRoom) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Connecting to Scotobot...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!room) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-red-600">Failed to connect to Scotobot</p>
            <Button onClick={() => router.push('/rooms')} className="mt-4">
              Back to Rooms
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (waitingForConnection) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Preparing your session with Justice ROBert...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (showTraining && !sessionStarted) {
    return (
      <PageTransition>
        <OnboardingTraining
          onComplete={() => setShowTraining(false)}
          sessionType="scotobot"
        />
      </PageTransition>
    )
  }

  if (showSurveyThankYou) {
    return (
      <PageTransition>
        <SurveyThankYou 
          onComplete={() => router.push('/rooms')}
          sessionType="scotobot"
        />
      </PageTransition>
    )
  }

  if (showExitSurvey) {
    return (
      <PageTransition>
        <PostSurvey
          onSubmit={handleSurveySubmit}
          onSkip={() => {
            setShowExitSurvey(false)
            setShowSurveyThankYou(true)
          }}
          sessionType="scotobot"
          participantType="Justice ROBert"
        />
      </PageTransition>
    )
  }

  // Main UI component
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
              </div>
            </div>
            <div className="flex items-center gap-4">
              {sessionStarted && !sessionEnded && (
                <motion.div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1",
                    getTimerBgColor(sessionTimeRemaining)
                  )}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Timer className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                  <span className={cn("text-sm font-medium", getTimerColor(sessionTimeRemaining))}>
                    {formatTime(sessionTimeRemaining)} remaining
                  </span>
                </motion.div>
              )}
              <AnimatedButton onClick={handleExitClick} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Exit Session
              </AnimatedButton>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Mobile sidebar overlay */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
                onClick={toggleMobileSidebar}
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <AnimatePresence>
            {(sidebarOpen || mobileSidebarOpen) && (
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className={cn(
                  "w-80 border-r bg-background",
                  mobileSidebarOpen ? "fixed inset-y-0 z-50 md:relative" : "hidden md:block"
                )}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-semibold">Session Details</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={sidebarOpen ? toggleSidebar : toggleMobileSidebar}
                      className="md:hidden"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>

                  <Tabs defaultValue="members" className="flex-1">
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

                    <TabsContent value="members" className="flex-1 p-4">
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="mb-4 font-semibold">Participants</h3>
                          <div className="space-y-3">
                            {/* Current User */}
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                                  {getAvatarInitial(sessionStorage.getItem("userName") || "User")}
                                </div>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{sessionStorage.getItem("userName") || "User"}</p>
                                <p className="text-xs text-muted-foreground">User</p>
                              </div>
                            </div>
                            
                            {/* Justice ROBert */}
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                                  {getAvatarInitial(justiceRobertName)}
                                </div>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{justiceRobertName}</p>
                                <p className="text-xs text-muted-foreground">AI Assistant</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="info" className="flex-1 p-4">
                      <Card>
                        <CardContent className="p-4 text-sm">
                          <h3 className="mb-2 font-semibold">Session Type</h3>
                          <p className="mb-4 text-muted-foreground">1-on-1 with Justice ROBert</p>
                          <h3 className="mb-2 font-semibold">Session Duration</h3>
                          <p className="text-muted-foreground">30 minutes</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="flex flex-1 flex-col bg-gray-50">
            {/* Toggle button when sidebar is closed */}
            {!sidebarOpen && (
              <div className="hidden md:block absolute top-20 left-4 z-10">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleSidebar}
                  className="bg-white shadow-md hover:bg-gray-50"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            )}
            
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

                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const messageAlignment = message.role === "user" ? "justify-end" : "justify-start"
                    const senderName = getSenderName(message)
                    const isJusticeRobert = message.sender_id === justiceRobertId
                    
                    return (
                      <MessageAnimation key={message.id} delay={index * 0.1}>
                        <div className={cn("flex gap-3", messageAlignment)}>
                          {messageAlignment === "justify-start" && (
                            <Avatar className="h-9 w-9 mt-1">
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                                {getAvatarInitial(senderName)}
                              </div>
                            </Avatar>
                          )}
                          <div className={cn("flex max-w-[75%] flex-col", 
                            messageAlignment === "justify-end" ? "items-end" : "items-start"
                          )}>
                            <div className="mb-1">
                              <span className="text-sm font-medium">{senderName}</span>
                            </div>
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                messageAlignment === "justify-end"
                                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                                  : message.role === "system"
                                    ? "rounded-tl-sm bg-blue-50 text-blue-700 border border-blue-200"
                                    : isJusticeRobert
                                      ? "rounded-tl-sm bg-green-50 text-green-800 border border-green-200"
                                      : "rounded-tl-sm bg-white text-foreground",
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                          </div>
                          {messageAlignment === "justify-end" && (
                            <Avatar className="h-9 w-9 mt-1">
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                                {getAvatarInitial(senderName)}
                              </div>
                            </Avatar>
                          )}
                        </div>
                      </MessageAnimation>
                    )
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Chat input */}
            {sessionStarted && !sessionEnded && !sessionPaused && (
              <div className="border-t bg-white p-4">
                <div className="mx-auto max-w-3xl">
                  <form onSubmit={handleChatSubmit} className="flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <AnimatedButton
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="px-6"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send
                        </>
                      )}
                    </AnimatedButton>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exit confirmation dialog */}
        <ConfirmationDialog
          open={exitDialogOpen}
          onOpenChange={setExitDialogOpen}
          onConfirm={handleExitConfirm}
          onCancel={handleExitCancel}
          title="Exit Session"
          description="Are you sure you want to leave this Scotobot session? You'll be redirected to a brief survey."
          confirmText="Exit Session"
          cancelText="Stay"
        />
      </div>
    </PageTransition>
  )
}

function ScotobotPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ChatScotobotComponent />
    </Suspense>
  )
}

export default ScotobotPage 