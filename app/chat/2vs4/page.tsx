"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"

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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { PostSurvey, PostSurveyResponses } from "@/components/ui/post-survey"
import { SurveyThankYou } from "@/components/ui/survey-thank-you"
import { OnboardingTraining } from "@/components/ui/onboarding-training"
// Removed savePostSurvey import - using API endpoint instead

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

function Chat2vs4Component() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topic = searchParams.get("topic")
  const roomId = searchParams.get("roomId")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ref for tracking moderator message (more reliable than state)
  const moderatorMessageSentRef = useRef(false)

  // Enhanced chat topic display names
  const chatTopicDisplayNames: Record<string, string> = {
    "vaccination-policy": "Vaccination Policy",
    "climate-change-policy": "Climate Change Policy", 
    "immigration-policy": "Immigration Policy",
    "gun-control-policy": "Gun Control Policy",
    "healthcare-system-reform": "Healthcare System Reform",
    "social-media-regulation": "Social Media Regulation"
  }

  const sessionTitle = "2vs4 Debate Session"
  const sessionDescription = "Discuss and debate various social and political topics with multiple participants"

  // State management
  const [room, setRoom] = useState<any>(null)
  const [roomId2vs4, setRoomId2vs4] = useState<string | null>(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [waitingForUser, setWaitingForUser] = useState(false)
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

  // Random topic selection for 2vs4 rooms from demographics survey topics
  const getRandomTopicFor2vs4 = () => {
    const availableTopics = [
      "vaccination-policy",
      "climate-change-policy", 
      "immigration-policy",
      "gun-control-policy",
      "healthcare-system-reform"
    ]
    const randomIndex = Math.floor(Math.random() * availableTopics.length)
    const selectedTopic = availableTopics[randomIndex]
    console.log("2vs4 Random topic selected:", selectedTopic, "from available topics:", availableTopics)
    return selectedTopic
  }

  const debateTopic = topic || getRandomTopicFor2vs4()

  // Join or create 2vs4 room
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
        [userId!]: userName
      }
      setCacheVersion(v => v + 1)
      return updated
    })
    
    fetch('/api/rooms/2vs4/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_name: userName }),
    })
      .then(res => res.json())
      .then(({ room }) => {
        console.log('Joined 2vs4 room:', room)
        // Transform database properties to client format
        const transformedRoom = {
          ...room,
          confederateName: room.confederate_id,
          llmUser1: room.llm_user_1,
          llmUser2: room.llm_user_2,
          llmUser3: room.llm_user_3
        }
        setRoom(transformedRoom)
        setRoomId2vs4(room.id)
        setWaitingForUser(room.status === 'waiting')
      })
      .catch(() => setRoom(null))
      .finally(() => setLoadingRoom(false))
  }, [topic])

  // Poll for room status if waiting
  useEffect(() => {
    if (room && room.status === "waiting") {
      setWaitingForUser(true)
      const interval = setInterval(async () => {
        const res = await fetch(`/api/rooms/${room.id}`)
        const updatedRoom = await res.json()
        if (updatedRoom.status === "active") {
          // Transform database properties to client format
          const transformedRoom = {
            ...updatedRoom,
            confederateName: updatedRoom.confederate_id,
            llmUser1: updatedRoom.llm_user_1,
            llmUser2: updatedRoom.llm_user_2,
            llmUser3: updatedRoom.llm_user_3
          }
          setRoom(transformedRoom)
          setWaitingForUser(false)
          clearInterval(interval)
          
          // Add moderator message when room becomes active
          console.log('Room became active, but letting member fetch handle moderator message')
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [room])

  // Fetch and poll members
  useEffect(() => {
    if (room && room.id) {
      const fetchMembers = async () => {
        try {
          const res = await fetch(`/api/rooms/${room.id}/members`)
          const data = await res.json()
          console.log('Fetched members:', data)
          setMembers(data)
          
          // Populate the user name cache with fetched members
          if (data && data.length > 0) {
            const nameCache: Record<string, string> = {}
            data.forEach((member: any) => {
              const userName = Array.isArray(member.user_name) ? member.user_name[0] : member.user_name
              nameCache[member.user_id] = userName || 'Unknown User'
            })
            console.log('Final name cache:', nameCache)
            setUserNameCache(prev => {
              const updated = {
                ...prev,
                ...nameCache
              }
              console.log('Cache updated:', updated)
              setCacheVersion(v => v + 1)
              return updated
            })
            
            // Add moderator message when we have both users (only if not sent yet)
            if (data && data.length >= 2 && room?.status === 'active' && !moderatorMessageSentRef.current) {
              setTimeout(() => addInitialModeratorMessage(), 500)
            }
          }
        } catch (error) {
          console.error('Error fetching members:', error)
        }
      }
      
      fetchMembers()
      const interval = setInterval(fetchMembers, 2000)
      return () => clearInterval(interval)
    }
  }, [room])

  // Set up Supabase subscription for messages
  useEffect(() => {
    if (!roomId2vs4) return

    console.log('Setting up subscription for roomId:', roomId2vs4)

    // Fetch all messages for this room on initial load
    const fetchMessages = async () => {
      console.log('Fetching messages for roomId:', roomId2vs4)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId2vs4)
        .order('created_at', { ascending: true })
      if (!error && data) {
        console.log('Fetched messages:', data)
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
        }
      } else {
        console.error('Error fetching messages:', error)
        setFetchError(error)
      }
    }
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId2vs4}`,
        },
        (payload) => {
          console.log('Received new message:', payload.new)
          const newMessage = payload.new
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev
            }
            return [
              ...prev,
              {
                id: newMessage.id,
                role: newMessage.sender_role,
                content: newMessage.content,
                sender_id: newMessage.sender_id,
                created_at: newMessage.created_at,
              },
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId2vs4])

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

    // Add initial moderator message when session starts (only if not sent yet)
    if (!moderatorMessageSentRef.current) {
      console.log('Session started, but letting member fetch handle moderator message')
    }
  }

  const handleSessionEnd = () => {
    setSessionEnded(true)
    setShowExitSurvey(true)
  }

  const handleSurveySubmit = async (responses: PostSurveyResponses) => {
    try {
      // Get session data
      const userId = sessionStorage.getItem("userId") || `user_${Date.now()}`
      const sessionData = {
        roomId: roomId2vs4 || undefined,
        userId: userId,
        roomType: "2vs4",
        sessionDuration: sessionTime
      }

      // Save survey responses via API endpoint
      console.log("2vs4 survey responses:", responses)
      
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          sessionData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save survey')
      }

      const result = await response.json()
      console.log("2vs4 survey saved successfully:", result)
      
      setShowExitSurvey(false)
      setShowSurveyThankYou(true)
    } catch (error) {
      console.error("Error submitting 2vs4 survey:", error)
      // Still proceed to thank you page even if save fails
      setShowExitSurvey(false)
      setShowSurveyThankYou(true)
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

  // Add initial moderator message when session starts
  const addInitialModeratorMessage = async () => {
    if (!roomId2vs4 || !debateTopic || moderatorMessageSentRef.current) {
      console.log('Moderator message blocked:', { roomId: !!roomId2vs4, debateTopic: !!debateTopic, alreadySent: moderatorMessageSentRef.current })
      return
    }
    
    // Double-check database for existing moderator messages
    try {
      const { data: existingMessages, error } = await supabase
        .from("messages")
        .select('id')
        .eq('room_id', roomId2vs4)
        .eq('sender_id', 'moderator')
        .limit(1)
      
      if (existingMessages && existingMessages.length > 0) {
        console.log('Moderator message already exists in database, skipping')
        moderatorMessageSentRef.current = true
        return
      }
    } catch (error) {
      console.error('Error checking for existing moderator messages:', error)
    }
    
    // Check if moderator message already exists in local messages
    const hasModeratorMessage = messages.some(msg => msg.sender_id === "moderator")
    if (hasModeratorMessage) {
      console.log('Moderator message found in local messages, skipping')
      moderatorMessageSentRef.current = true
      return
    }
    
    // Only add moderator message when both users are present
    if (members.length < 2) {
      console.log('Not enough members yet:', members.length)
      return
    }
    
    console.log('Adding initial moderator message...')
    moderatorMessageSentRef.current = true // Set this immediately to prevent duplicates
    
    const topicDisplayName = chatTopicDisplayNames[debateTopic] || debateTopic
    const moderatorMessage = {
      room_id: roomId2vs4,
      sender_id: "moderator",
      sender_role: "system",
      content: `Welcome! I'm the Moderator for this session. The goal of this conversation is for you two participants to debate with our 4 other participants on the topic: "${topicDisplayName}". Please maintain a respectful dialogue. I will intervene if messages are harmful or inappropriate. This session will last 15 minutes. Please feel free to begin when you're ready.`,
    }

    try {
      const { data: insertedMessage, error } = await supabase
        .from("messages")
        .insert([moderatorMessage])
        .select()
        .single()
        
      if (!error && insertedMessage) {
        console.log('Moderator message inserted successfully')
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
      } else {
        console.error('Error inserting moderator message:', error)
        moderatorMessageSentRef.current = false // Reset on error
      }
    } catch (error) {
      console.error("Error adding moderator message:", error)
      moderatorMessageSentRef.current = false // Reset on error
    }
  }

  // Get sender name with cache
  function getSenderName(message: any) {
    if (message.role === "system") {
      return "Moderator"
    } else if (message.role === "assistant") {
      // Check if it's confederate or LLM user
      if (message.sender_id === "confederate") {
        return room?.confederateName || "Confederate"
      } else if (message.sender_id === "llm_user_1") {
        return room?.llmUser1 || "LLM User 1"
      } else if (message.sender_id === "llm_user_2") {
        return room?.llmUser2 || "LLM User 2"
      } else if (message.sender_id === "llm_user_3") {
        return room?.llmUser3 || "LLM User 3"
      }
      return "AI Participant"
    } else if (message.role === "user") {
      // Check cache first
      if (userNameCache[message.sender_id]) {
        return userNameCache[message.sender_id]
      }
      
      // Fallback to current user if it's their message
      const currentUserId = sessionStorage.getItem("userId")
      if (message.sender_id === currentUserId) {
        return sessionStorage.getItem("userName") || "User"
      }
      
      // Try partial match for ID differences
      const cacheKeys = Object.keys(userNameCache)
      const partialMatch = cacheKeys.find(key => {
        const baseId = message.sender_id.split('_')[1]?.substring(0, 10)
        const cacheBaseId = key.split('_')[1]?.substring(0, 10)
        return baseId && cacheBaseId && baseId === cacheBaseId
      })
      
      if (partialMatch) {
        return userNameCache[partialMatch]
      }
      
      // Last resort fallback
      if (cacheKeys.length > 0) {
        const otherUserKey = cacheKeys.find(key => key !== currentUserId)
        if (otherUserKey && message.sender_id !== currentUserId) {
          return userNameCache[otherUserKey]
        }
      }
      
      return "Loading..."
    }
    return "Unknown"
  }

  // Chat submit handler with silent background moderation and LLM responses
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomId2vs4) return

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
      room_id: roomId2vs4,
      sender_id: userId,
      sender_role: "user",
      content: trimmedInput,
    }

    console.log("2vs4 Inserting user message:", userMessage)

    const { data: insertedMessage, error: userError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select()
      .single()
      
    if (userError) {
      console.error("2vs4 Failed to send message:", userError)
      return
    }
    
    console.log("2vs4 Message inserted successfully:", insertedMessage)
    
    // Immediately add to local state
    if (insertedMessage) {
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
        return [...prev, localMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
    }

    // Note: No typing indicator - moderation happens silently in background

    // Moderate the user message after it's displayed
    try {
      console.log("2vs4 moderating user message:", trimmedInput)
      const moderationResponse = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          context: "2vs4 debate discussion",
          topic: debateTopic ? (chatTopicDisplayNames[debateTopic] || debateTopic) : "the current topic"
        }),
      })

      if (!moderationResponse.ok) {
        throw new Error("Moderation service unavailable")
      }

      const moderationResult = await moderationResponse.json()
      console.log("2vs4 moderation result:", moderationResult)

      if (!moderationResult.isSafe) {
        // Message is unsafe - send moderator warning
        console.log("2vs4 message flagged as unsafe:", moderationResult.reason)
        
        // Wait before showing moderator response
        setTimeout(async () => {
          const topicDisplayName = debateTopic ? (chatTopicDisplayNames[debateTopic] || debateTopic) : "the current topic"
          const moderatorMessage = {
            room_id: roomId2vs4,
            sender_id: "moderator",
            sender_role: "system",
            content: `I'd like to keep our discussion focused on ${topicDisplayName}. Let's continue with a respectful conversation about the subject. What are your thoughts on the main points we should be discussing?`,
          }

          try {
            const { data: insertedModeratorMessage, error: moderatorError } = await supabase
              .from("messages")
              .insert([moderatorMessage])
              .select()
              .single()
              
            if (!moderatorError && insertedModeratorMessage) {
              console.log('2vs4 moderator message inserted successfully')
              const localModeratorMessage = {
                id: insertedModeratorMessage.id,
                role: insertedModeratorMessage.sender_role,
                content: insertedModeratorMessage.content,
                sender_id: insertedModeratorMessage.sender_id,
                created_at: insertedModeratorMessage.created_at,
                isUnsafeResponse: true, // Flag for red background
              }
              
              setMessages(prev => {
                if (prev.some(msg => msg.id === localModeratorMessage.id)) {
                  return prev
                }
                return [...prev, localModeratorMessage].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
              })
            } else {
              console.error('2vs4 error inserting moderator message:', moderatorError)
            }
          } catch (error) {
            console.error("2vs4 error adding moderator message:", error)
          }
        }, 2000) // 2 second delay for moderator response

        return // Don't proceed to AI responses
      } else {
        // Message is safe - proceed with normal AI logic
        console.log("2vs4 message approved, proceeding with AI logic")
      }
      
    } catch (error) {
      console.error("2vs4 error in moderation:", error)
      // If moderation fails, proceed with normal AI logic
    }

    // Implement LLM response logic for 2vs4
    try {
      // Show loading indicator when AI responses are being generated
      setIsLoading(true)
      
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
      const messagesForAPI = [...messages, {
        id: insertedMessage.id,
        role: insertedMessage.sender_role,
        content: insertedMessage.content,
        sender_id: insertedMessage.sender_id,
        created_at: insertedMessage.created_at,
      }]
      
      console.log("2vs4 Sending API request with confederates:", {
        main: room?.confederateName,
        llm1: room?.llmUser1,
        llm2: room?.llmUser2,
        llm3: room?.llmUser3,
        messagesCount: messagesForAPI.length,
        debateTopic: debateTopic
      })
      
      // Determine which AI participants should respond based on context
      const aiParticipants = [
        { id: "confederate", name: room?.confederateName },
        { id: "llm_user_1", name: room?.llmUser1 },
        { id: "llm_user_2", name: room?.llmUser2 },
        { id: "llm_user_3", name: room?.llmUser3 }
      ]
      
      // Check if user directly addressed a specific AI participant
      const lowerMessage = trimmedInput.toLowerCase()
      const directlyAddressed = aiParticipants.find(ai => 
        ai.name && (
          lowerMessage.includes(ai.name.toLowerCase()) ||
          lowerMessage.includes(`@${ai.name.toLowerCase()}`) ||
          lowerMessage.includes(`hey ${ai.name.toLowerCase()}`) ||
          lowerMessage.includes(`${ai.name.toLowerCase()},`) ||
          lowerMessage.includes(`${ai.name.toLowerCase()}?`) ||
          lowerMessage.includes(`${ai.name.toLowerCase()}!`)
        )
      )
      
      let selectedResponders = []
      
      if (directlyAddressed) {
        // If someone was directly addressed, only they respond
        selectedResponders = [directlyAddressed]
        console.log(`2vs4 Direct address detected: ${directlyAddressed.name} will respond`)
      } else {
        // Normal flow: randomly select 1-2 AI participants to respond (reduced from 1-3)
        const numResponders = Math.floor(Math.random() * 2) + 1 // 1-2 responders
        const shuffledAI = [...aiParticipants].sort(() => 0.5 - Math.random())
        selectedResponders = shuffledAI.slice(0, numResponders)
             }
       
       console.log(`2vs4 Selected ${selectedResponders.length} AI responders:`, selectedResponders.map(r => r.name))
      
      // Generate responses for each selected AI participant
      for (let i = 0; i < selectedResponders.length; i++) {
        const responder = selectedResponders[i]
        
        // Add delay between responses (2-8 seconds)
        const delay = Math.random() * 6000 + 2000
        
        setTimeout(async () => {
          try {
            console.log(`2vs4 Generating response for ${responder.name} after ${delay}ms delay`)
            
            const requestBody = {
              messages: messagesForAPI,
              userTraits,
              topic: debateTopic ? chatTopicDisplayNames[debateTopic] : "the current topic",
              roomId: roomId2vs4,
              debateTopic: debateTopic ? chatTopicDisplayNames[debateTopic] : null,
              userPosition: "neutral", // For 2vs4, we'll use neutral position
              confederateName: responder.name,
              roomType: "2vs4",
              responderId: responder.id
            }
            
            console.log(`2vs4 API request body for ${responder.name}:`, requestBody)
            
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            })
            
            if (!response.ok) {
              throw new Error(`API request failed: ${response.status}`)
            }
            
            const data = await response.json()
            
            // Insert AI response into Supabase
            const aiMessage = {
              room_id: roomId2vs4,
              sender_id: responder.id,
              sender_role: "assistant",
              content: data.content || "I'm not sure how to respond to that.",
            }
            
            const { data: insertedAIMessage, error: aiError } = await supabase
              .from("messages")
              .insert([aiMessage])
              .select()
              .single()
              
            if (aiError) {
              console.error(`2vs4 Failed to send ${responder.name} message:`, aiError)
            } else {
              console.log(`2vs4 ${responder.name} responded successfully:`, insertedAIMessage)
            }
            
          } catch (error) {
            console.error(`2vs4 Error generating response for ${responder.name}:`, error)
          }
        }, delay)
      }
      
    } catch (error) {
      console.error("Error in 2vs4 chat submit:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Autonomous AI conversation trigger - AI participants interact with each other
  useEffect(() => {
    if (!sessionStarted || sessionEnded || !roomId2vs4 || messages.length === 0) return

    const triggerAIConversation = () => {
      // Only trigger if no recent activity and last message is not from AI
      const lastMessage = messages[messages.length - 1]
      const recentMessages = messages.slice(-3)
      const recentAIMessages = recentMessages.filter(msg => msg.role === "assistant")
      
      // Don't trigger if:
      // - Last message was from AI (to avoid AI spam)
      // - There were AI messages in last 3 messages
      // - Not enough conversation history
      if (lastMessage?.role === "assistant" || recentAIMessages.length > 0 || messages.length < 3) {
        return
      }
      
      // Calculate time since last message
      const lastMessageTime = new Date(lastMessage.created_at).getTime()
      const timeSinceLastMessage = Date.now() - lastMessageTime
      
      // Only trigger if 15+ seconds of silence
      if (timeSinceLastMessage < 15000) return
      
      console.log('2vs4 Triggering autonomous AI conversation due to silence')
      
      // Select 1 AI participant to continue the conversation
      const aiParticipants = [
        { id: "confederate", name: room?.confederateName },
        { id: "llm_user_1", name: room?.llmUser1 },
        { id: "llm_user_2", name: room?.llmUser2 },
        { id: "llm_user_3", name: room?.llmUser3 }
      ]
      
      const randomAI = aiParticipants[Math.floor(Math.random() * aiParticipants.length)]
      
      setTimeout(async () => {
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
            topic: debateTopic ? chatTopicDisplayNames[debateTopic] : "the current topic",
            roomId: roomId2vs4,
            debateTopic: debateTopic ? chatTopicDisplayNames[debateTopic] : null,
            userPosition: "neutral",
            confederateName: randomAI.name,
            roomType: "2vs4",
            responderId: randomAI.id,
            isAutonomousResponse: true // Flag for AI to continue conversation naturally
          }
          
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          })
          
          if (!response.ok) {
            throw new Error(`Autonomous AI response failed: ${response.status}`)
          }
          
          const data = await response.json()
          
          // Insert autonomous AI response
          const aiMessage = {
            room_id: roomId2vs4,
            sender_id: randomAI.id,
            sender_role: "assistant",
            content: data.content || "I'd like to add to this discussion...",
          }
          
          const { data: insertedAIMessage, error: aiError } = await supabase
            .from("messages")
            .insert([aiMessage])
            .select()
            .single()
            
          if (!aiError) {
            console.log(`2vs4 Autonomous response from ${randomAI.name}:`, insertedAIMessage)
          }
          
        } catch (error) {
          console.error("2vs4 Error in autonomous AI conversation:", error)
        }
      }, 2000) // 2 second delay before autonomous response
    }
    
    // Check for conversation triggers every 10 seconds
    const interval = setInterval(triggerAIConversation, 10000)
    return () => clearInterval(interval)
  }, [messages, sessionStarted, sessionEnded, roomId2vs4, room, debateTopic])

  // Loading states
  if (loadingRoom) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Joining room...</div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (waitingForUser) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Waiting for another User to join...</div>
            <div className="text-muted-foreground">Share this page link with a friend to join the session.</div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!room || !roomId2vs4) {
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

  // Show training overlay
  if (showTraining) {
    return (
      <PageTransition>
        <OnboardingTraining onComplete={handleTrainingComplete} />
      </PageTransition>
    )
  }

  // Show exit survey
  if (showExitSurvey) {
    return (
      <PageTransition>
        <PostSurvey 
          isOpen={showExitSurvey}
          sessionDuration={sessionTime}
          onSubmit={handleSurveySubmit} 
          onClose={handleSurveyClose} 
        />
      </PageTransition>
    )
  }

  // Show thank you
  if (showSurveyThankYou) {
    return (
      <PageTransition>
        <SurveyThankYou onClose={handleThankYouClose} />
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
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                  2vs4 Chat
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
                    {[
                      ...members.map(member => ({
                        name: member.user_name,
                        role: "user",
                      })),
                      { name: room?.confederateName || "Confederate", role: "confederate" },
                      { name: room?.llmUser1 || "LLM User 1", role: "llm_user" },
                      { name: room?.llmUser2 || "LLM User 2", role: "llm_user" },
                      { name: room?.llmUser3 || "LLM User 3", role: "llm_user" },
                      { name: "Moderator", role: "moderator" },
                    ].map((member, index) => (
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
                            {member.role === "llm_user" ? "User" : member.role}
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
                    const isAssistant = message.role === "assistant"
                    const senderName = getSenderName(message)

                    // Determine message alignment for 2vs4 rooms
                    let messageAlignment = "justify-start"
                    let isCurrentUser = false
                    
                    const currentUserId = sessionStorage.getItem("userId")
                    isCurrentUser = message.sender_id === currentUserId
                    
                    if (isAssistant) {
                      // All AI messages on the right
                      messageAlignment = "justify-end"
                    } else if (isUser) {
                      // All user messages on the right (same side as AI)
                      messageAlignment = "justify-end"
                    } else {
                      // System/moderator messages on the left
                      messageAlignment = "justify-start"
                    }

                    const showAvatarOnLeft = messageAlignment === "justify-start"

                    return (
                      <MessageAnimation
                        key={message.id || index}
                        isUser={isCurrentUser}
                        delay={index * 0.05}
                        className={cn("flex gap-3", messageAlignment)}
                      >
                        {showAvatarOnLeft && (
                          <Avatar className="h-9 w-9 mt-1">
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                              {message.role === "system" ? "M" : getAvatarInitial(senderName)}
                            </div>
                          </Avatar>
                        )}

                        <div className={cn("flex max-w-[75%] flex-col", messageAlignment === "justify-end" ? "items-end" : "items-start")}>
                          <div className="mb-1">
                            <span className="text-sm font-medium">{senderName}</span>
                          </div>
                          <motion.div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                              messageAlignment === "justify-end"
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : message.role === "system"
                                  ? message.isUnsafeResponse
                                    ? "rounded-tl-sm bg-red-100 text-red-800 border border-red-300"
                                    : "rounded-tl-sm bg-blue-50 text-blue-700 border border-blue-200"
                                  : "rounded-tl-sm bg-white text-foreground",
                            )}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                          >
                            {message.content}
                          </motion.div>
                        </div>

                        {!showAvatarOnLeft && (
                          <Avatar className="h-9 w-9 mt-1">
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                              {getAvatarInitial(senderName)}
                            </div>
                          </Avatar>
                        )}
                      </MessageAnimation>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Chat input */}
            <div className="border-t bg-white p-4">
              <div className="mx-auto max-w-3xl">
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={!sessionStarted || sessionEnded || sessionPaused || isLoading}
                    className="flex-1"
                  />
                  <AnimatedButton
                    type="submit"
                    disabled={!sessionStarted || sessionEnded || sessionPaused || !input.trim() || isLoading}
                  >
                    {isLoading ? "Sending..." : "Send"}
                  </AnimatedButton>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Exit Confirmation Dialog - TODO: Fix props */}
        {exitDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Exit Session</h3>
              <p className="mb-4">Are you sure you want to exit this chat session?</p>
              <div className="flex gap-2">
                <Button onClick={handleExitConfirm} variant="destructive">Exit</Button>
                <Button onClick={handleExitCancel} variant="outline">Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

export default function Chat2vs4Page() {
  return (
    <Suspense fallback={
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-2 text-muted-foreground">Loading 2vs4 chat...</p>
          </div>
        </div>
      </PageTransition>
    }>
      <Chat2vs4Component />
    </Suspense>
  )
} 