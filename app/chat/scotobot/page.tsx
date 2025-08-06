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
import { ExitSurvey, ExitSurveyResponses } from "@/components/ui/exit-survey"
import { ScotobotInitialInterface } from "@/components/ui/scotobot-initial-interface"
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
  const sessionDescription = "Discuss and explore various topics with Scotobot Bob"

  // State management
  const [room, setRoom] = useState<any>(null)
  const [roomIdScotobot, setRoomIdScotobot] = useState<string | null>(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [waitingForConnection, setWaitingForConnection] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
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
  const [showTraining, setShowTraining] = useState(false)
  const [fetchError, setFetchError] = useState<any>(null)
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})
  const [showInitialInterface, setShowInitialInterface] = useState(true)
  const [cacheVersion, setCacheVersion] = useState(0)

  // Scotobot Bob configuration
  const scotobotBobName = "Scotobot Bob"
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
        [justiceRobertId]: scotobotBobName
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
      .then(async res => {
        const data = await res.json()
        console.log('Scotobot API response:', data)
        
        if (!res.ok) {
          console.error('Scotobot API error:', data)
          throw new Error(data.error || 'Failed to join room')
        }
        
        return data
      })
      .then(({ room }) => {
        console.log('Joined Scotobot room:', room)
        setRoom(room)
        setRoomIdScotobot(room.id)
        setWaitingForConnection(room.status === 'waiting')
      })
      .catch((error) => {
        console.error('Error joining Scotobot room:', error)
        setRoom(null)
      })
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
        
        // No moderator message needed for Scotobot
        console.log('Scotobot messages loaded successfully')
        
        // Start session immediately without any initial messages
        console.log('Starting Scotobot session without initial messages')
        setSessionStarted(true)
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

  const handleExitClick = () => {
    console.log('Scotobot: Exit button clicked - showing exit survey')
    setShowExitSurvey(true)
  }
  const handleExitConfirm = () => {
    console.log('Scotobot: Exit confirmed, attempting to redirect...')
    setExitDialogOpen(false)
    
    // Add a small delay to ensure dialog closes first
    setTimeout(() => {
      console.log('Scotobot: Executing redirect after delay...')
      try {
        router.push('/')
        console.log('Router.push executed successfully')
      } catch (error) {
        console.error('Router.push failed, using window.location:', error)
        window.location.href = '/'
      }
    }, 100)
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
      content: `Welcome to Scotobot! You're now connected with Scotobot Bob, an AI assistant ready to discuss various topics with you. Feel free to ask questions, share thoughts, or explore ideas together. This session will last 30 minutes. How can Scotobot Bob assist you today?`,
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
        
        // No additional messages needed after moderator message
        
      } else {
        console.error('Scotobot error inserting moderator message:', error)
        moderatorMessageSentRef.current = false
      }
    } catch (error) {
      console.error("Scotobot error adding moderator message:", error)
      moderatorMessageSentRef.current = false
    }
  }



  // Chat submit handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomIdScotobot) return

    // Switch from initial interface to regular chat interface after first message
    if (showInitialInterface) {
      setShowInitialInterface(false)
    }

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

    // Add user message to local state immediately
    if (insertedMessage) {
      const newUserMessage = {
        id: insertedMessage.id,
        role: insertedMessage.sender_role,
        content: insertedMessage.content,
        sender_id: insertedMessage.sender_id,
        created_at: insertedMessage.created_at,
      }
      
      setMessages(prev => {
        if (prev.some(msg => msg.id === newUserMessage.id)) {
          console.log('Scotobot user message already exists in state')
          return prev
        }
        const updatedMessages = [...prev, newUserMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        console.log('Scotobot user message added to local state, new count:', updatedMessages.length)
        return updatedMessages
      })
    }

    // Generate Scotobot Bob's response
    try {
      console.log("Scotobot generating Scotobot Bob response")
      
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
      
      // Include the user's message in the context for accurate response
      const updatedMessages = [...messages, {
        id: insertedMessage.id,
        role: "user",
        content: trimmedInput,
        sender_id: userId,
        sender_role: "user"
      }]
      
      const requestBody = {
        messages: updatedMessages,
        userTraits,
        topic: "General Discussion",
        roomId: roomIdScotobot,
        debateTopic: null,
        userPosition: "neutral",
        confederateName: scotobotBobName,
        roomType: "scotobot",
        responderId: justiceRobertId,
      }
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Scotobot Bob response failed: ${response.status}`)
      }

      // Show reasoning phase
      setLoadingMessage("Chief Justice Roberts is analyzing your question...")
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Show typing phase
      setLoadingMessage("Formulating constitutional response...")
      
      const data = await response.json()
      
      // Calculate typing delay based on response length
      const responseLength = data.content?.length || 100
      const baseDelay = 1200
      const typingDelay = baseDelay + (responseLength * 8) // 8ms per character
      const maxDelay = 6000 // Maximum 6 seconds
      const finalDelay = Math.min(typingDelay, maxDelay)
      
      await new Promise(resolve => setTimeout(resolve, finalDelay))
      
      // Clear loading message
      setLoadingMessage("")
      
      // Insert Scotobot Bob's response with better fallback
      const justiceRobertMessage = {
        room_id: roomIdScotobot,
        sender_id: justiceRobertId,
        sender_role: "assistant",
        content: data.content || "That's an excellent constitutional question. Let me provide you with a thoughtful analysis of the legal principles involved.",
      }
      
      const { data: insertedJRMessage, error: jrError } = await supabase
        .from("messages")
        .insert([justiceRobertMessage])
        .select()
        .single()
        
      if (!jrError && insertedJRMessage) {
        console.log("Scotobot Bob response inserted successfully:", insertedJRMessage)
        
        // Add AI response to local state immediately
        const newAIMessage = {
          id: insertedJRMessage.id,
          role: insertedJRMessage.sender_role,
          content: insertedJRMessage.content,
          sender_id: insertedJRMessage.sender_id,
          created_at: insertedJRMessage.created_at,
        }
        
        setMessages(prev => {
          if (prev.some(msg => msg.id === newAIMessage.id)) {
            console.log('Scotobot AI message already exists in state')
            return prev
          }
          const updatedMessages = [...prev, newAIMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          console.log('Scotobot AI message added to local state, new count:', updatedMessages.length)
          return updatedMessages
        })
      } else {
        console.error("Scotobot error inserting Scotobot Bob response:", jrError)
      }
      
    } catch (error) {
      console.error("Scotobot error generating Scotobot Bob response:", error)
      setLoadingMessage("")
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
      return scotobotBobName
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
            <p className="mt-2 text-muted-foreground">Preparing your session with Scotobot Bob...</p>
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

  // Exit survey handlers
  const handleExitSurveySubmit = async (responses: ExitSurveyResponses) => {
    try {
      const userId = sessionStorage.getItem("userId")
      const sessionData = {
        satisfaction: responses.satisfaction,
        feedback: responses.feedback,
        sessionType: "Scotobot",
        userId: userId,
        roomId: roomIdScotobot,
        sessionDuration: sessionTime
      }

      const response = await fetch('/api/exit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })

      if (response.ok) {
        console.log('Exit survey submitted successfully')
      } else {
        console.error('Failed to submit exit survey')
      }
    } catch (error) {
      console.error('Error submitting exit survey:', error)
    }
    
    // Redirect to homepage after submission
    router.push('/')
  }

  const handleExitSurveySkip = () => {
    console.log('Exit survey skipped')
    router.push('/')
  }

  if (showExitSurvey) {
    return (
      <PageTransition>
        <ExitSurvey
          onSubmit={handleExitSurveySubmit}
          onSkip={handleExitSurveySkip}
          sessionType="Scotobot"
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
                            
                            {/* Scotobot Bob */}
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                                  {getAvatarInitial(scotobotBobName)}
                                </div>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{scotobotBobName}</p>
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
                          <p className="mb-4 text-muted-foreground">1-on-1 with Scotobot Bob</p>
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
              {showInitialInterface ? (
                <ScotobotInitialInterface
                  input={input}
                  onInputChange={setInput}
                  onSubmit={handleChatSubmit}
                  sessionStarted={sessionStarted}
                  sessionEnded={sessionEnded}
                  sessionPaused={sessionPaused}
                  isLoading={isLoading}
                />
              ) : (
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
                                    : message.sender_id === "justice_robert"
                                    ? "rounded-tl-sm bg-green-50 text-green-800"
                                    : "rounded-tl-sm bg-gray-100 text-gray-800"
                                )}
                              >
                                <div 
                                  dangerouslySetInnerHTML={{
                                    __html: message.content
                                      .replace(/#/g, '') // Remove # symbols
                                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **text** to bold
                                      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // *text* to italics
                                  }}
                                />
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

                    {/* Loading indicator for Scotobot Bob */}
                    {loadingMessage && (
                      <div className="flex justify-start">
                        <div className="flex gap-3">
                          <Avatar className="h-9 w-9 mt-1">
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                              J
                            </div>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <div className="mb-1">
                              <span className="text-sm font-medium">Scotobot Bob</span>
                            </div>
                            <div className="rounded-2xl rounded-tl-sm bg-green-50 text-green-800 px-4 py-2.5 text-sm shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                <span className="italic">{loadingMessage}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            {sessionStarted && !sessionEnded && !sessionPaused && !showInitialInterface && (
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
          description="Are you sure you want to leave this Scotobot session? You'll be redirected to the homepage."
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