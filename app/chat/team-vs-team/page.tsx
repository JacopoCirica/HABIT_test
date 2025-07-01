"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { getChatTopicFromOpinions, chatTopicDisplayNames } from "@/lib/opinion-analyzer"

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

function ChatTeamVsTeamComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topic = searchParams.get("topic")
  const roomId = searchParams.get("roomId")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ref for tracking moderator message
  const moderatorMessageSentRef = useRef(false)

  const sessionTitle = "Team vs Team Debate Session"
  const sessionDescription = "Red Team vs Blue Team: 4v4 debate with mixed human and AI participants"

  // State management
  const [room, setRoom] = useState<any>(null)
  const [roomIdTeamVsTeam, setRoomIdTeamVsTeam] = useState<string | null>(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [waitingForUsers, setWaitingForUsers] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(20 * 60) // 20 minutes for team battles
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [showSurveyThankYou, setShowSurveyThankYou] = useState(false)
  const [showTraining, setShowTraining] = useState(true)
  const [fetchError, setFetchError] = useState<any>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})
  const [cacheVersion, setCacheVersion] = useState(0)
  const [redTeamExpanded, setRedTeamExpanded] = useState(false)
  const [blueTeamExpanded, setBlueTeamExpanded] = useState(false)
  const [teamAssignments, setTeamAssignments] = useState<{red: any[], blue: any[]} | null>(null)
  const [userTeam, setUserTeam] = useState<'red' | 'blue' | null>(null)

  // Use room's topic or fallback to a default
  const [debateTopic, setDebateTopic] = useState<string | null>(null)

  // Join or create team-vs-team room
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
    
    fetch('/api/rooms/team-vs-team/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_name: userName }),
    })
      .then(async res => {
        console.log('Team-vs-team API response status:', res.status)
        if (!res.ok) {
          const errorText = await res.text()
          console.error('Team-vs-team API error:', res.status, errorText)
          throw new Error(`API error: ${res.status} - ${errorText}`)
        }
        return res.json()
      })
      .then(({ room }) => {
        console.log('Joined team-vs-team room:', room)
        if (!room) {
          console.error('Team-vs-team: No room returned from API')
          setRoom(null)
          return
        }
        setRoom(room)
        setRoomIdTeamVsTeam(room.id)
        setWaitingForUsers(room.status !== 'active')
        // Set the debate topic from the room
        if (room.topic) {
          setDebateTopic(room.topic)
          console.log('Team-vs-team using room topic:', room.topic)
        } else {
          // Fallback to a default topic if none set
          setDebateTopic('healthcare-system-reform')
          console.log('Team-vs-team using fallback topic')
        }
        
        // Load team assignments from server if available
        if (room.team_assignments) {
          try {
            const serverTeamAssignments = JSON.parse(room.team_assignments)
            console.log('Team-vs-team loading server team assignments:', serverTeamAssignments)
            // We'll use these when we have the member data
          } catch (error) {
            console.error('Team-vs-team error parsing server team assignments:', error)
          }
        }
      })
      .catch((error) => {
        console.error('Team-vs-team join error:', error)
        setJoinError(error.message || 'Failed to join team battle')
        setRoom(null)
      })
      .finally(() => setLoadingRoom(false))
  }, [topic])

  // Poll for room status if waiting
  useEffect(() => {
    if (room && room.status !== "active") {
      setWaitingForUsers(true)
      const interval = setInterval(async () => {
        const res = await fetch(`/api/rooms/${room.id}`)
        const updatedRoom = await res.json()
        if (updatedRoom.status === "active") {
          setRoom(updatedRoom)
          setWaitingForUsers(false)
          clearInterval(interval)
          
          console.log('Team-vs-team room became active:', updatedRoom)
          
          // Load team assignments if available
          if (updatedRoom.team_assignments && !teamAssignments) {
            console.log('Team-vs-team found team assignments in updated room')
          }
          
          // Fetch messages again now that room is active (for first user)
          if (roomIdTeamVsTeam) {
            console.log('Team-vs-team refetching messages after room activation')
            const { data: newMessages, error } = await supabase
              .from('messages')
              .select('*')
              .eq('room_id', roomIdTeamVsTeam)
              .order('created_at', { ascending: true })
            
            if (!error && newMessages) {
              const fetchedMessages = newMessages.map((msg) => ({
                id: msg.id,
                role: msg.sender_role,
                content: msg.content,
                sender_id: msg.sender_id,
                created_at: msg.created_at,
              }))
              
              setMessages(fetchedMessages)
              console.log('Team-vs-team refetched messages after activation:', fetchedMessages.length)
            }
          }
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
          console.log('Team-vs-team fetched members:', data)
          setMembers(data)
          
          // Populate the user name cache with fetched members
          if (data && data.length > 0) {
            const nameCache: Record<string, string> = {}
            data.forEach((member: any) => {
              const userName = Array.isArray(member.user_name) ? member.user_name[0] : member.user_name
              nameCache[member.user_id] = userName || 'Unknown User'
            })
            console.log('Team-vs-team final name cache:', nameCache)
            setUserNameCache(prev => {
              const updated = {
                ...prev,
                ...nameCache
              }
              console.log('Team-vs-team cache updated:', updated)
              setCacheVersion(v => v + 1)
              return updated
            })
            
                        // Add moderator message when we have enough users
            if (data && data.length >= 8 && room?.status === 'active' && !moderatorMessageSentRef.current) {
              setTimeout(() => addInitialModeratorMessage(), 500)
            }
            
            // Load team assignments from server if available and we have all members
            if (data && data.length >= 8 && !teamAssignments && room?.team_assignments) {
              try {
                const serverTeamAssignments = JSON.parse(room.team_assignments)
                console.log('Team-vs-team using server team assignments:', serverTeamAssignments)
                
                // Map user IDs to member objects
                const redTeamMembers = serverTeamAssignments.red_team?.map((userId: string) => 
                  data.find((m: any) => m.user_id === userId)
                ).filter(Boolean) || []
                
                const blueTeamMembers = serverTeamAssignments.blue_team?.map((userId: string) => 
                  data.find((m: any) => m.user_id === userId)
                ).filter(Boolean) || []
                
                setTeamAssignments({
                  red: redTeamMembers,
                  blue: blueTeamMembers
                })
                
                // Determine current user's team
                const currentUserId = sessionStorage.getItem("userId")
                if (currentUserId) {
                  if (serverTeamAssignments.red_team?.includes(currentUserId)) {
                    setUserTeam('red')
                    console.log('Team-vs-team: Current user is on Red Team')
                  } else if (serverTeamAssignments.blue_team?.includes(currentUserId)) {
                    setUserTeam('blue')
                    console.log('Team-vs-team: Current user is on Blue Team')
                  }
                }
                
                console.log('Team-vs-team loaded server assignments:', {
                  red: redTeamMembers.map((m: any) => `${m.user_name}${m.user_id === 'llm_red_confederate' ? ' (Confederate)' : ''}`),
                  blue: blueTeamMembers.map((m: any) => `${m.user_name}${m.user_id === 'llm_blue_confederate' ? ' (Confederate)' : ''}`)
                })
              } catch (error) {
                console.error('Team-vs-team error loading server team assignments:', error)
              }
            }
          }
        } catch (error) {
          console.error('Team-vs-team error fetching members:', error)
        }
      }
      
      fetchMembers()
      const interval = setInterval(fetchMembers, 2000)
      return () => clearInterval(interval)
    }
  }, [room])

  // Set up Supabase subscription for messages
  useEffect(() => {
    if (!roomIdTeamVsTeam) return

    console.log('Team-vs-team setting up subscription for roomId:', roomIdTeamVsTeam)

    // Fetch all messages for this room on initial load
    const fetchMessages = async () => {
      console.log('Team-vs-team fetching messages for roomId:', roomIdTeamVsTeam)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomIdTeamVsTeam)
        .order('created_at', { ascending: true })
      if (!error && data) {
        console.log('Team-vs-team fetched messages:', data)
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
        console.error('Team-vs-team error fetching messages:', error)
        setFetchError(error)
      }
    }
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('team-vs-team-room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomIdTeamVsTeam}`,
        },
        (payload) => {
          console.log('Team-vs-team received new message:', payload.new)
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
  }, [roomIdTeamVsTeam])

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTimerColor = (timeRemaining: number) => {
    if (timeRemaining <= 120) return "text-red-600"
    if (timeRemaining <= 600) return "text-amber-600"
    return "text-green-600"
  }

  const getTimerBgColor = (timeRemaining: number) => {
    if (timeRemaining <= 120) return "bg-red-50"
    if (timeRemaining <= 600) return "bg-amber-50"
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
  }

  const handleSessionEnd = () => {
    setSessionEnded(true)
    setShowExitSurvey(true)
  }

  const handleSurveySubmit = async (responses: PostSurveyResponses) => {
    try {
      console.log("Team-vs-team survey responses:", responses)
      setShowExitSurvey(false)
      setShowSurveyThankYou(true)
    } catch (error) {
      console.error("Team-vs-team error submitting survey:", error)
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

  // Add initial moderator message when session starts
  const addInitialModeratorMessage = async () => {
    if (!roomIdTeamVsTeam || !debateTopic || moderatorMessageSentRef.current) {
      console.log('Team-vs-team moderator message blocked:', { roomId: !!roomIdTeamVsTeam, debateTopic: !!debateTopic, alreadySent: moderatorMessageSentRef.current })
      return
    }
    
    // Double-check database for existing moderator messages
    try {
      const { data: existingMessages, error } = await supabase
        .from("messages")
        .select('id')
        .eq('room_id', roomIdTeamVsTeam)
        .eq('sender_id', 'moderator')
        .limit(1)
      
      if (existingMessages && existingMessages.length > 0) {
        console.log('Team-vs-team moderator message already exists in database, skipping')
        moderatorMessageSentRef.current = true
        return
      }
    } catch (error) {
      console.error('Team-vs-team error checking for existing moderator messages:', error)
    }
    
    // Check if moderator message already exists in local messages
    const hasModeratorMessage = messages.some(msg => msg.sender_id === "moderator")
    if (hasModeratorMessage) {
      console.log('Team-vs-team moderator message found in local messages, skipping')
      moderatorMessageSentRef.current = true
      return
    }
    
    // Only add moderator message when we have all participants
    if (members.length < 8) {
      console.log('Team-vs-team not enough members yet:', members.length)
      return
    }
    
    console.log('Team-vs-team adding initial moderator message...')
    moderatorMessageSentRef.current = true
    
    const topicDisplayName = debateTopic ? (chatTopicDisplayNames[debateTopic] || debateTopic) : "Healthcare System Reform"
    const moderatorMessage = {
      room_id: roomIdTeamVsTeam,
      sender_id: "moderator",
      sender_role: "system",
      content: `Welcome to the Team vs Team debate! This is a Red Team vs Blue Team battle on the topic: "${topicDisplayName}". Each team has 4 participants (mix of humans and AI). Work together with your team to present compelling arguments. This session will last 20 minutes. Let the debate begin!`,
    }

    try {
      const { data: insertedMessage, error } = await supabase
        .from("messages")
        .insert([moderatorMessage])
        .select()
        .single()
        
      if (!error && insertedMessage) {
        console.log('Team-vs-team moderator message inserted successfully')
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
        console.error('Team-vs-team error inserting moderator message:', error)
        moderatorMessageSentRef.current = false
      }
    } catch (error) {
      console.error("Team-vs-team error adding moderator message:", error)
      moderatorMessageSentRef.current = false
    }
  }

  // Get sender name with cache
  function getSenderName(message: any) {
    if (message.role === "system") {
      return "Moderator"
    } else if (message.role === "assistant") {
      // Check if it's a team LLM
      if (message.sender_id?.includes('llm_')) {
        // Use the cached name or fallback
        return userNameCache[message.sender_id] || "AI Participant"
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
      
      return "Loading..."
    }
    return "Unknown"
  }

  // Chat submit handler - will implement team LLM responses
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomIdTeamVsTeam) return

    const trimmedInput = input.trim()
    setInput("")

    // Get consistent user ID
    let userId = sessionStorage.getItem("userId")
    if (!userId) {
      userId = `user_${Date.now()}`
      sessionStorage.setItem("userId", userId)
    }

    setIsLoading(true)

    // Insert user message into Supabase
    const userMessage = {
      room_id: roomIdTeamVsTeam,
      sender_id: userId,
      sender_role: "user",
      content: trimmedInput,
    }

    console.log("Team-vs-team inserting user message:", userMessage)

    const { data: insertedMessage, error: userError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select()
      .single()
      
    if (userError) {
      console.error("Team-vs-team failed to send message:", userError)
      setIsLoading(false)
      return
    }
    
    console.log("Team-vs-team message inserted successfully:", insertedMessage)
    
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

    // TODO: Implement team LLM response logic
    setIsLoading(false)
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Loading states
  if (loadingRoom) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Joining team battle...</div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (waitingForUsers) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Assembling teams...</div>
            <div className="text-muted-foreground">Waiting for 4 human participants to join the battle.</div>
            <div className="mt-4 text-sm text-muted-foreground">
              Current participants: {members.length}/4 humans
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!room || !roomIdTeamVsTeam) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            {joinError ? (
              <>
                <div className="mb-4 text-2xl font-bold text-red-600">Error</div>
                <p className="mb-4 text-muted-foreground">{joinError}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2 text-muted-foreground">Setting up team battle...</p>
              </>
            )}
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
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-red-50 text-red-700">
                  Red Team
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                  vs
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                  Blue Team
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
                  {sessionStarted ? formatTime(sessionTimeRemaining) : "20:00"}
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
                  <h2 className="font-semibold">Team Battle</h2>
                  <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <Tabs defaultValue="teams">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="teams">
                      <Users className="mr-2 h-4 w-4" />
                      Teams
                    </TabsTrigger>
                    <TabsTrigger value="info">
                      <Info className="mr-2 h-4 w-4" />
                      Info
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="teams" className="mt-4 space-y-4">
                    {(() => {
                      // Use stable team assignments or fallback to ordered assignment (no random shuffling in fallback)
                      let redTeam, blueTeam
                      
                      if (teamAssignments) {
                        // Use the stable assignments
                        redTeam = teamAssignments.red
                        blueTeam = teamAssignments.blue
                      } else {
                        // Fallback: assign by order (not random) until we have all 8 members
                        redTeam = members.slice(0, 4)
                        blueTeam = members.slice(4, 8)
                      }
                      
                      // Identify confederates for each team
                      const redConfederate = redTeam.find((m: any) => m.user_id === 'llm_red_confederate')
                      const blueConfederate = blueTeam.find((m: any) => m.user_id === 'llm_blue_confederate')
                      
                      return (
                        <>
                          {/* Red Team */}
                          <div className={cn(
                            "border rounded-lg",
                            userTeam === 'red' ? "bg-red-100 border-red-300 shadow-md" : "bg-red-50"
                          )}>
                            <button 
                              onClick={() => setRedTeamExpanded(!redTeamExpanded)}
                              className="w-full p-3 text-left hover:bg-red-100 transition-colors rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-red-700">🔴 Red Team</h3>
                                  {userTeam === 'red' && (
                                    <Badge variant="outline" className="text-xs bg-red-200 text-red-800 border-red-400">
                                      Your Team
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-red-600">{redTeam.length}/4</span>
                                  <motion.div
                                    animate={{ rotate: redTeamExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronLeft className="h-4 w-4 text-red-600" />
                                  </motion.div>
                                </div>
                              </div>
                            </button>
                            {redTeamExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="px-3 pb-3"
                              >
                                <div className="space-y-2">
                                  {redTeam.map((member, index) => {
                                    const memberName = Array.isArray(member.user_name) ? member.user_name[0] : member.user_name
                                    const isConfederate = member.user_id === 'llm_red_confederate'
                                    return (
                                      <div key={member.user_id} className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                                            {getAvatarInitial(memberName || 'U')}
                                          </div>
                                        </Avatar>
                                        <span className="text-sm font-medium">{memberName || 'Unknown'}</span>
                                        {isConfederate && <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">Confederate</Badge>}
                                      </div>
                                    )
                                  })}
                                  {redTeam.length < 4 && (
                                    <div className="text-xs text-muted-foreground">
                                      Waiting for {4 - redTeam.length} more members...
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Blue Team */}
                          <div className={cn(
                            "border rounded-lg",
                            userTeam === 'blue' ? "bg-blue-100 border-blue-300 shadow-md" : "bg-blue-50"
                          )}>
                            <button 
                              onClick={() => setBlueTeamExpanded(!blueTeamExpanded)}
                              className="w-full p-3 text-left hover:bg-blue-100 transition-colors rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-blue-700">🔵 Blue Team</h3>
                                  {userTeam === 'blue' && (
                                    <Badge variant="outline" className="text-xs bg-blue-200 text-blue-800 border-blue-400">
                                      Your Team
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-blue-600">{blueTeam.length}/4</span>
                                  <motion.div
                                    animate={{ rotate: blueTeamExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronLeft className="h-4 w-4 text-blue-600" />
                                  </motion.div>
                                </div>
                              </div>
                            </button>
                            {blueTeamExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="px-3 pb-3"
                              >
                                <div className="space-y-2">
                                  {blueTeam.map((member, index) => {
                                    const memberName = Array.isArray(member.user_name) ? member.user_name[0] : member.user_name
                                    const isConfederate = member.user_id === 'llm_blue_confederate'
                                    return (
                                      <div key={member.user_id} className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                                            {getAvatarInitial(memberName || 'U')}
                                          </div>
                                        </Avatar>
                                        <span className="text-sm font-medium">{memberName || 'Unknown'}</span>
                                        {isConfederate && <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">Confederate</Badge>}
                                      </div>
                                    )
                                  })}
                                  {blueTeam.length < 4 && (
                                    <div className="text-xs text-muted-foreground">
                                      Waiting for {4 - blueTeam.length} more members...
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )
                    })()}
                    
                    
                    {/* Moderator */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                            M
                          </div>
                        </Avatar>
                        <div>
                          <div className="font-medium">Moderator</div>
                          <div className="text-xs text-muted-foreground">Battle Referee</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="info" className="mt-4">
                    <Card>
                      <CardContent className="p-4 text-sm">
                        <h3 className="mb-2 font-semibold">Battle Topic</h3>
                        <p className="mb-4 text-muted-foreground">{debateTopic ? (chatTopicDisplayNames[debateTopic] || debateTopic) : "Healthcare System Reform"}</p>
                        <h3 className="mb-2 font-semibold">Format</h3>
                        <p className="mb-4 text-muted-foreground">Red Team vs Blue Team (4v4)</p>
                        <h3 className="mb-2 font-semibold">Duration</h3>
                        <p className="text-muted-foreground">20 minutes</p>
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
              <div className="mx-auto max-w-4xl space-y-6">
                <Card className="border-primary/20 bg-gradient-to-r from-red-50 via-purple-50 to-blue-50">
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

                    // Determine team-based message alignment and styling
                    let messageAlignment = "justify-start"
                    let messageBgColor = "bg-white"
                    let isRedTeamMessage = false
                    let isBlueTeamMessage = false
                    
                    if (message.role === "system") {
                      messageAlignment = "justify-center"
                    } else {
                      // Check if sender is on red team or blue team
                      const isRedTeamSender = teamAssignments?.red.some((m: any) => m.user_id === message.sender_id)
                      const isBlueTeamSender = teamAssignments?.blue.some((m: any) => m.user_id === message.sender_id)
                      
                      if (isRedTeamSender) {
                        messageAlignment = "justify-end" // Red team messages on right
                        messageBgColor = "bg-red-200 border-red-400 text-red-900"
                        isRedTeamMessage = true
                      } else if (isBlueTeamSender) {
                        messageAlignment = "justify-start" // Blue team messages on left  
                        messageBgColor = "bg-blue-200 border-blue-400 text-blue-900"
                        isBlueTeamMessage = true
                      } else {
                        messageAlignment = "justify-start" // Default for unknown senders
                      }
                    }

                    return (
                      <MessageAnimation
                        key={message.id || index}
                        isUser={isUser}
                        delay={index * 0.05}
                        className={cn("flex gap-3", messageAlignment)}
                      >
                        {/* Avatar - show first for left-aligned, last for right-aligned */}
                        {!isRedTeamMessage && (
                          <Avatar className={cn(
                            "h-9 w-9 mt-1",
                            isBlueTeamMessage ? "ring-2 ring-blue-300" : ""
                          )}>
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                              {message.role === "system" ? "M" : getAvatarInitial(senderName)}
                            </div>
                          </Avatar>
                        )}

                        <div className="flex max-w-[75%] flex-col">
                          <div className={cn(
                            "mb-1 flex items-center gap-2",
                            isRedTeamMessage ? "justify-end" : "justify-start"
                          )}>
                            <span className="text-sm font-medium">{senderName}</span>
                            {isRedTeamMessage && (
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                                Red Team
                              </Badge>
                            )}
                            {isBlueTeamMessage && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                Blue Team
                              </Badge>
                            )}
                          </div>
                          <motion.div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm shadow-sm border",
                              message.role === "system"
                                ? "rounded-tl-sm bg-purple-50 text-purple-700 border-purple-200"
                                : `rounded-tl-sm ${messageBgColor}`,
                            )}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                          >
                            {message.content}
                          </motion.div>
                        </div>

                        {/* Avatar - show last for right-aligned messages */}
                        {isRedTeamMessage && (
                          <Avatar className="h-9 w-9 mt-1 ring-2 ring-red-300">
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
              <div className="mx-auto max-w-4xl">
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

        {/* Exit Confirmation Dialog */}
        {exitDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Exit Session</h3>
              <p className="mb-4">Are you sure you want to exit this team battle?</p>
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

export default function ChatTeamVsTeamPage() {
  return (
    <Suspense fallback={
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-2 text-muted-foreground">Loading team battle...</p>
          </div>
        </div>
      </PageTransition>
    }>
      <ChatTeamVsTeamComponent />
    </Suspense>
  )
} 