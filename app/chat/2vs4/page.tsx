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
    "climate-change": "Climate Change Policy", 
    "immigration-policy": "Immigration Policy",
    "gun-control": "Gun Control Policy",
    "universal-healthcare": "Universal Healthcare Policy",
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

  // Get dynamic topic from demographics survey
  const getChatTopicFromOpinions = () => {
    try {
      const demographicsData = JSON.parse(sessionStorage.getItem("demographicsData") || "{}")
      const opinions = demographicsData.opinions || {}
      
      if (Object.keys(opinions).length === 0) {
        console.log("No opinions found, using default topic")
        return "social-media-regulation"
      }

      // Find most extreme position (furthest from neutral 4)
      let mostExtreme = null
      let maxDistance = 0
      
      Object.entries(opinions).forEach(([topic, value]: [string, any]) => {
        const distance = Math.abs(value - 4)
        if (distance > maxDistance || (distance === maxDistance && value < 4)) {
          maxDistance = distance
          mostExtreme = topic
        }
      })

      // Map opinion topics to chat topics
      const topicMapping: Record<string, string> = {
        vaccination: "vaccination-policy",
        climateChange: "climate-change",
        immigration: "immigration-policy", 
        gunControl: "gun-control",
        universalHealthcare: "universal-healthcare"
      }

      const mappedTopic = mostExtreme ? topicMapping[mostExtreme] : null
      const finalTopic = mappedTopic || "social-media-regulation"
      
      console.log("Selected chat topic:", finalTopic, "from opinion:", mostExtreme, "value:", opinions[mostExtreme || ""])
      return finalTopic
    } catch (error) {
      console.error("Error getting topic from opinions:", error)
      return "social-media-regulation"
    }
  }

  const debateTopic = topic || getChatTopicFromOpinions()

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
      content: `Welcome! I'm the Moderator for this session. The goal of this conversation is for you two participants to debate with our 4 AI participants (1 confederate + 3 LLM users) on the topic: "${topicDisplayName}". Please maintain a respectful dialogue. I will intervene if messages are harmful or inappropriate. This session will last 15 minutes. Please feel free to begin when you're ready.`,
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

  // Rest of the component logic will be similar to 2v1 but adapted for 2vs4...
  // For now, let me create a basic structure

  return (
    <PageTransition>
      <div className="flex h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">2vs4 Chat Room</h1>
            <p className="text-muted-foreground">2vs4 implementation in progress...</p>
            <p className="text-sm mt-2">Room ID: {roomId2vs4}</p>
            <p className="text-sm">Topic: {debateTopic}</p>
            {room && (
              <div className="mt-4">
                <p>Confederate: {room.confederateName}</p>
                <p>LLM Users: {room.llmUser1}, {room.llmUser2}, {room.llmUser3}</p>
              </div>
            )}
          </div>
        </div>
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