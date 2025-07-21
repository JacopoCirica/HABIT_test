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
import { OpinionPoll } from "@/components/ui/opinion-poll"
import { OpinionTrackerVisualization } from "@/components/ui/opinion-tracker-visualization"
import { PostSurvey } from "@/components/ui/post-survey"
import { SurveyThankYou } from "@/components/ui/survey-thank-you"
import { ModeratorControls } from "@/components/ui/moderator-controls"

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

} from "lucide-react"

// Import Supabase and utilities
import { supabase } from "@/lib/supabaseClient"
import { OpinionTrackingData } from "@/lib/opinion-tracker"
import { PostSurveyResponses } from "@/components/ui/post-survey"
import { getChatTopicFromOpinions, chatTopicDisplayNames } from "@/lib/opinion-analyzer"

function Chat1v1Component() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get URL parameters
  const topic = searchParams.get("topic") as string
  const urlRoomId = searchParams.get("roomId") as string

  // State management
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [room, setRoom] = useState<any>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [userName, setUserName] = useState("")
  const [loadingRoom, setLoadingRoom] = useState(false)
  
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
  
  // Loading state for simulating user connection
  const [waitingForUser, setWaitingForUser] = useState(true)
  const [connectionMessage, setConnectionMessage] = useState("Connecting to chat room...")
  
  // Error handling
  const [useSimulatedResponses, setUseSimulatedResponses] = useState(false)
  const [apiErrorCount, setApiErrorCount] = useState(0)
  const MAX_API_ERRORS = 3

  // Opinion tracking
  const [opinionTrackingData, setOpinionTrackingData] = useState<OpinionTrackingData | null>(null)
  const [debateTopic, setDebateTopic] = useState<string | null>(null)

  const sessionTitle = debateTopic ? chatTopicDisplayNames[debateTopic] : "Opinion Discussion"
  const sessionDescription = "Discuss and debate various social and political topics"

  // Room members for 1v1
  const roomMembers = [
    { name: userName, role: "user" },
    { name: room?.confederate_id || "Confederate", role: "confederate" },
    { name: "Moderator", role: "moderator" },
  ]

  // Initialize 1v1 room
  useEffect(() => {
    // Always initialize, with or without topic
    const selectedTopic = topic || getChatTopicFromOpinions() // Use demographics-based topic selection
    setDebateTopic(selectedTopic)
    setLoadingRoom(true)
    
    // Get or create consistent user ID
    let userId = sessionStorage.getItem("userId")
    if (!userId) {
      userId = `user_${Date.now()}`
      sessionStorage.setItem("userId", userId)
    }
    
    const userName = sessionStorage.getItem("userName") || "User"
    
    // Set basic user state
    setUserName(userName)
    
    fetch('/api/rooms/1v1/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_name: userName }),
    })
      .then(res => res.json())
      .then(({ room }) => {
        console.log('Joined 1v1 room:', room)
        setRoom(room)
        setRoomId(room.id)
        setWaitingForUser(false) // 1v1 rooms start active
        
        // Add initial moderator message immediately after room setup
        setTimeout(async () => {
          console.log('Checking for existing moderator message after room join...')
          const { data: existingMessages, error: checkError } = await supabase
            .from("messages")
            .select('id')
            .eq('room_id', room.id)
            .eq('sender_id', 'moderator')
            .limit(1)
          
          if (!checkError && (!existingMessages || existingMessages.length === 0)) {
            console.log('No moderator message found, adding one now...')
            const topicDisplayName = chatTopicDisplayNames[selectedTopic] || selectedTopic
            const moderatorMessage = {
              room_id: room.id,
              sender_id: "moderator",
              sender_role: "system",
              content: `Welcome! I'm the Moderator for this session. The goal of this conversation is for you and an AI participant to debate the topic: "${topicDisplayName}". Please maintain a respectful dialogue. I will intervene if messages are harmful or inappropriate. This session will last 15 minutes. Please feel free to begin when you're ready.`,
            }

            const { data: insertedMessage, error } = await supabase
              .from("messages")
              .insert([moderatorMessage])
              .select()
              .single()
              
            if (error) {
              console.error('Error inserting moderator message on room join:', error)
            } else {
              console.log('Moderator message added on room join:', insertedMessage)
            }
          } else {
            console.log('Moderator message already exists or error checking:', { existingMessages, checkError })
          }
        }, 1500)
      })
      .catch(err => {
        console.error('Error joining 1v1 room:', err)
        setRoom(null)
      })
      .finally(() => setLoadingRoom(false))
  }, [topic])

  // Set up Supabase subscription for messages
  useEffect(() => {
    if (!roomId) return

    console.log('Setting up subscription for 1v1 roomId:', roomId)

    // Fetch all messages for this room on initial load
    const fetchMessages = async () => {
      console.log('Fetching messages for 1v1 roomId:', roomId)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      if (!error && data) {
        console.log('Fetched 1v1 messages count:', data.length, 'messages:', data)
        const fetchedMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.sender_role,
          content: msg.content,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
        }))
        
        console.log('Setting 1v1 messages:', fetchedMessages)
        setMessages(fetchedMessages)
      } else {
        console.error('Error fetching 1v1 messages:', error)
      }
    }
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('1v1-room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Received new 1v1 message via subscription:', payload.new)
          const newMessage = payload.new
          setMessages((prev) => {
            const messageExists = prev.some((msg) => msg.id === newMessage.id)
            console.log('Message exists check:', messageExists, 'Current messages count:', prev.length)
            
            if (messageExists) {
              console.log('Message already exists, skipping')
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
            
            console.log('Updated messages after real-time insert:', updatedMessages.length, updatedMessages)
            return updatedMessages
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  // Add initial moderator message when room becomes active
  useEffect(() => {
    if (room && roomId && debateTopic) {
      const addInitialModeratorMessage = async () => {
        // Check if moderator message already exists
        const { data: existingMessages, error: checkError } = await supabase
          .from("messages")
          .select('id')
          .eq('room_id', roomId)
          .eq('sender_id', 'moderator')
          .limit(1)
        
        if (checkError) {
          console.error('Error checking for existing moderator messages:', checkError)
          return
        }
        
        if (existingMessages && existingMessages.length > 0) {
          console.log('Moderator message already exists, skipping')
          return
        }
        
        console.log('Adding initial moderator message for 1v1 room')
        const topicDisplayName = chatTopicDisplayNames[debateTopic] || debateTopic
        const moderatorMessage = {
          room_id: roomId,
          sender_id: "moderator",
          sender_role: "system",
          content: `Welcome! I'm the Moderator for this session. The goal of this conversation is for you and an AI participant to debate the topic: "${topicDisplayName}". Please maintain a respectful dialogue. I will intervene if messages are harmful or inappropriate. This session will last 15 minutes. Please feel free to begin when you're ready.`,
        }

        try {
          const { data: insertedMessage, error } = await supabase
            .from("messages")
            .insert([moderatorMessage])
            .select()
            .single()
            
          if (error) {
            console.error('Error inserting initial moderator message:', error)
          } else {
            console.log('Initial moderator message added successfully:', insertedMessage)
          }
        } catch (error) {
          console.error("Error adding initial moderator message:", error)
        }
      }
      
      // Add delay to ensure room is fully set up
      setTimeout(addInitialModeratorMessage, 1000)
    }
  }, [room, roomId, debateTopic])

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
      // Note: Opinion tracking functionality needs to be implemented
      // const updatedData = trackOpinion(debateTopic, value, reason)
      // setOpinionTrackingData(updatedData)
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

    // Get consistent user ID
    let userId = sessionStorage.getItem("userId")
    if (!userId) {
      userId = `user_${Date.now()}`
      sessionStorage.setItem("userId", userId)
    }

    // Insert user message into Supabase immediately (always show user's message)
    const userMessage = {
      room_id: roomId,
      sender_id: userId,
      sender_role: "user",
      content: trimmedInput,
    }

    const { data: insertedMessage, error: userError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select()
      .single()
      
    if (userError) {
      console.error("Failed to send 1v1 message:", userError)
      return
    }
    
    console.log("1v1 user message inserted successfully:", insertedMessage)

    // Note: No typing indicator - moderation happens silently in background

    // Moderate the user message after it's displayed
    try {
      console.log("Moderating user message:", trimmedInput)
      const moderationResponse = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          context: "1v1 debate discussion",
          topic: debateTopic ? chatTopicDisplayNames[debateTopic] : "the current topic"
        }),
      })

      if (!moderationResponse.ok) {
        throw new Error("Moderation service unavailable")
      }

      const moderationResult = await moderationResponse.json()
      console.log("Moderation result:", moderationResult)

      if (!moderationResult.isSafe) {
        // Message is unsafe - send moderator warning instead of confederate response
        console.log("Message flagged as unsafe:", moderationResult.reason)
        
        // Wait before showing moderator response
        setTimeout(async () => {
          const moderatorMessage = {
            room_id: roomId,
            sender_id: "moderator",
            sender_role: "system",
            content: `I'd like to keep our discussion focused on ${debateTopic ? chatTopicDisplayNames[debateTopic] : "the topic at hand"}. Let's continue with a respectful conversation about the subject. What are your thoughts on the main points we should be discussing?`,
          }

          try {
            const { data: insertedModeratorMessage, error: moderatorError } = await supabase
              .from("messages")
              .insert([moderatorMessage])
              .select()
              .single()
              
            if (moderatorError) {
              console.error('Error inserting moderator message:', moderatorError)
            }
          } catch (error) {
            console.error("Error adding moderator message:", error)
          }
          
          // No loading state to clear since we don't show typing indicator
        }, 2000) // 2 second delay for moderator response
        
        return // Don't proceed to confederate response
      }

      // Message is safe - proceed with confederate response after delay
      console.log("Message approved, sending to confederate")

      setTimeout(async () => {
        setIsLoading(true) // Show typing indicator only for confederate response
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
          
          // Include the new user message in the API call
          const newMessageForAPI = {
            id: insertedMessage.id,
            role: insertedMessage.sender_role,
            content: insertedMessage.content,
            sender_id: insertedMessage.sender_id,
            created_at: insertedMessage.created_at,
          }
          const messagesForAPI = [...messages, newMessageForAPI]
          
          const requestBody = {
            messages: messagesForAPI,
            userTraits,
            topic: debateTopic ? chatTopicDisplayNames[debateTopic] : "the current topic",
            roomId: roomId,
            debateTopic: debateTopic ? chatTopicDisplayNames[debateTopic] : null,
            userPosition: opinionTrackingData
              ? opinionTrackingData.initialOpinion.value > 4
                ? "agree"
                : opinionTrackingData.initialOpinion.value < 4
                  ? "disagree"
                  : "neutral"
              : null,
            confederateName: room?.confederate_id || null,
          }
          
          console.log("Sending API request with confederate:", room?.confederate_id)
          
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error("API response error:", errorText)
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
          }
          
          const data = await response.json()
          console.log("API response data:", data)
          
          // Insert AI response into Supabase
          const assistantMessage = {
            room_id: roomId,
            sender_id: "confederate",
            sender_role: "assistant",
            content: data.content || "I'm not sure how to respond to that.",
            created_at: new Date().toISOString(),
          }
          
          const { data: insertedConfMessage, error: confError } = await supabase
            .from("messages")
            .insert([assistantMessage])
            .select()
            .single()
            
          if (confError) {
            console.error("Failed to send confederate message:", confError)
          }
          
          setIsLoading(false)
        } catch (error) {
          console.error("Error getting confederate response:", error)
          
          // Fallback to simulated response
          const simulatedResponse = getSimulatedResponse()
          const fallbackMessage = {
            room_id: roomId,
            sender_id: "confederate",
            sender_role: "assistant",
            content: simulatedResponse,
            created_at: new Date().toISOString(),
          }
          
          const { data: insertedFallback, error: fallbackError } = await supabase
            .from("messages")
            .insert([fallbackMessage])
            .select()
            .single()
            
          if (fallbackError) {
            console.error("Failed to send fallback message:", fallbackError)
          }
          
          setIsLoading(false)
        }
      }, 2000) // 2 second delay before confederate response
      
    } catch (error) {
      console.error("Error in moderation:", error)
      
      // If moderation fails, proceed with confederate response after delay
      setTimeout(async () => {
        setIsLoading(true) // Show typing indicator only for confederate response
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
          
          const messagesForAPI = [...messages, userMessage]
          
          const requestBody = {
            messages: messagesForAPI,
            userTraits,
            topic: debateTopic ? chatTopicDisplayNames[debateTopic] : "the current topic",
            roomId: roomId,
            debateTopic: debateTopic ? chatTopicDisplayNames[debateTopic] : null,
            userPosition: opinionTrackingData
              ? opinionTrackingData.initialOpinion.value > 4
                ? "agree"
                : opinionTrackingData.initialOpinion.value < 4
                  ? "disagree"
                  : "neutral"
              : null,
            confederateName: room?.confederate_id || null,
          }
          
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          })
          
                      if (response.ok) {
              const data = await response.json()
              const assistantMessage = {
                room_id: roomId,
                sender_id: "confederate",
                sender_role: "assistant",
                content: data.content || "I'm not sure how to respond to that.",
                created_at: new Date().toISOString(),
              }
              
              const { data: insertedConfMessage, error: confError } = await supabase
                .from("messages")
                .insert([assistantMessage])
                .select()
                .single()
                
              if (confError) {
                console.error("Failed to send confederate message:", confError)
              }
            } else {
              throw new Error("Confederate API failed")
            }
                  } catch (fallbackError) {
            console.error("Fallback error:", fallbackError)
            const simulatedResponse = getSimulatedResponse()
            const fallbackMessage = {
              room_id: roomId,
              sender_id: "confederate",
              sender_role: "assistant",
              content: simulatedResponse,
              created_at: new Date().toISOString(),
            }
            
            const { data: insertedFallback, error: fallbackError2 } = await supabase
              .from("messages")
              .insert([fallbackMessage])
              .select()
              .single()
              
            if (fallbackError2) {
              console.error("Failed to send fallback message:", fallbackError2)
            }
          }
        
        setIsLoading(false)
      }, 2000)
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Show loading state while waiting for another user
  if (waitingForUser) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">{connectionMessage}</h2>
            <p className="text-muted-foreground">
              {connectionMessage.includes("Connecting") 
                ? "Setting up your 1-on-1 debate session..." 
                : "This should only take a moment..."}
            </p>
          </div>
        </div>
      </PageTransition>
    )
  }

  // Loading states
  if (loadingRoom) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Joining 1v1 room...</div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!room || !roomId) {
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

                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isUser = message.role === "user"
                    const senderName = isUser ? userName : (message.sender_id === "moderator" ? "Moderator" : (room?.confederate_id || "Confederate"))

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
                                : message.sender_id === "moderator" && message.isUnsafeResponse
                                  ? "rounded-tl-sm bg-red-100 text-red-800 border border-red-300"
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
                            {getAvatarInitial(room?.confederate_id || "Confederate")}
                          </div>
                        </Avatar>
                        <div className="flex max-w-[75%] flex-col items-start">
                          <div className="mb-1">
                            <span className="text-sm font-medium">{room?.confederate_id || "Confederate"}</span>
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

export default function Chat1v1Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <Chat1v1Component />
    </Suspense>
  )
} 