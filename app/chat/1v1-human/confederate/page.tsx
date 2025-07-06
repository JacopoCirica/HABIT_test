"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
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

function ConfederateChat1v1HumanComponent() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ref for tracking moderator message
  const moderatorMessageSentRef = useRef(false)

  const sessionTitle = "1v1 Human Debate Session"
  const sessionDescription = "Discuss and debate with a human confederate on various social and political topics"

  // State management
  const [room, setRoom] = useState<any>(null)
  const [roomId1v1Human, setRoomId1v1Human] = useState<string | null>(null)
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
  const [fetchError, setFetchError] = useState<any>(null)
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})
  const [cacheVersion, setCacheVersion] = useState(0)

  // Use shared topic selection logic
  const debateTopic = getChatTopicFromOpinions()

  // Confederate always uses "Ben" as name
  const confederateName = "Ben"

  // Try to join as confederate
  useEffect(() => {
    const confederateUserId = `confederate_${Date.now()}`
    
    // Update user name cache
    setUserNameCache(prev => {
      const updated = {
        ...prev,
        [confederateUserId]: confederateName
      }
      setCacheVersion(v => v + 1)
      return updated
    })
    
    fetch('/api/rooms/1v1-human/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: confederateUserId, 
        user_name: confederateName,
        is_confederate: true 
      }),
    })
      .then(res => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Failed to join as confederate:', data.error)
          setWaitingForUser(true)
        } else {
          console.log('Confederate joined room:', data.room)
          setRoom(data.room)
          setRoomId1v1Human(data.room.id)
          setWaitingForUser(data.room.status === 'waiting')
        }
      })
      .catch((error) => {
        console.error('Error joining as confederate:', error)
        setWaitingForUser(true)
      })
      .finally(() => setLoadingRoom(false))
  }, [])

  // Poll for room status if waiting
  useEffect(() => {
    if (room && room.status === "waiting") {
      setWaitingForUser(true)
      const interval = setInterval(async () => {
        const res = await fetch(`/api/rooms/${room.id}`)
        const updatedRoom = await res.json()
        if (updatedRoom.status === "active") {
          setRoom(updatedRoom)
          setWaitingForUser(false)
          clearInterval(interval)
          
          console.log('1v1-human room became active')
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [room])

  // Poll for available rooms if waiting without a room
  useEffect(() => {
    if (waitingForUser && !room) {
      const interval = setInterval(async () => {
        const confederateUserId = `confederate_${Date.now()}`
        
        try {
          const response = await fetch('/api/rooms/1v1-human/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              user_id: confederateUserId, 
              user_name: confederateName,
              is_confederate: true 
            }),
          })
          
          const data = await response.json()
          
          if (!data.error) {
            console.log('Confederate successfully joined room:', data.room)
            setRoom(data.room)
            setRoomId1v1Human(data.room.id)
            setWaitingForUser(data.room.status === 'waiting')
            clearInterval(interval)
          }
        } catch (error) {
          console.error('Error polling for rooms:', error)
        }
      }, 3000) // Check every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [waitingForUser, room])

  // Fetch and poll members
  useEffect(() => {
    if (room && room.id) {
      const fetchMembers = async () => {
        try {
          const res = await fetch(`/api/rooms/${room.id}/members`)
          const data = await res.json()
          console.log('Confederate fetched members:', data)
          setMembers(data)
          
          // Populate the user name cache with fetched members
          if (data && data.length > 0) {
            const nameCache: Record<string, string> = {}
            data.forEach((member: any) => {
              const userName = Array.isArray(member.user_name) ? member.user_name[0] : member.user_name
              nameCache[member.user_id] = userName || 'Unknown User'
            })
            console.log('Confederate final name cache:', nameCache)
            setUserNameCache(prev => {
              const updated = {
                ...prev,
                ...nameCache
              }
              console.log('Confederate cache updated:', updated)
              setCacheVersion(v => v + 1)
              return updated
            })
          }
        } catch (error) {
          console.error('Confederate error fetching members:', error)
        }
      }
      
      fetchMembers()
      const interval = setInterval(fetchMembers, 2000)
      return () => clearInterval(interval)
    }
  }, [room])

  // Set up Supabase subscription for messages
  useEffect(() => {
    if (!roomId1v1Human) return

    console.log('Confederate setting up subscription for roomId:', roomId1v1Human)

    // Fetch all messages for this room on initial load
    const fetchMessages = async () => {
      console.log('Confederate fetching messages for roomId:', roomId1v1Human)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId1v1Human)
        .order('created_at', { ascending: true })
      if (!error && data) {
        console.log('Confederate fetched messages:', data)
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
        console.error('Confederate error fetching messages:', error)
        setFetchError(error)
      }
    }
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('confederate-room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId1v1Human}`,
        },
        (payload) => {
          console.log('Confederate received new message:', payload.new)
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
  }, [roomId1v1Human])

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
      console.log("Confederate survey responses:", responses)
      setShowExitSurvey(false)
      setShowSurveyThankYou(true)
    } catch (error) {
      console.error("Confederate error submitting survey:", error)
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

  // Get sender name with cache
  function getSenderName(message: any) {
    if (message.role === "system") {
      return "Moderator"
    } else if (message.role === "user") {
      // Check cache first
      if (userNameCache[message.sender_id]) {
        return userNameCache[message.sender_id]
      }
      
      // Fallback to confederate name if it's their message
      const confederateUserId = Object.keys(userNameCache).find(id => 
        userNameCache[id] === confederateName
      )
      if (message.sender_id === confederateUserId) {
        return confederateName
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
      return "Unknown User"
    }
    return "Unknown"
  }

  // Chat submit handler WITHOUT moderation layer
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomId1v1Human) return

    const trimmedInput = input.trim()
    setInput("")

    // Get consistent confederate user ID
    const confederateUserId = Object.keys(userNameCache).find(id => 
      userNameCache[id] === confederateName
    ) || `confederate_${Date.now()}`

    // Insert confederate message into Supabase immediately (NO MODERATION)
    const confederateMessage = {
      room_id: roomId1v1Human,
      sender_id: confederateUserId,
      sender_role: "user",
      content: trimmedInput,
    }

    console.log("Confederate inserting message:", confederateMessage)

    const { data: insertedMessage, error: userError } = await supabase
      .from("messages")
      .insert([confederateMessage])
      .select()
      .single()
      
    if (userError) {
      console.error("Confederate failed to send message:", userError)
      return
    }
    
    console.log("Confederate message inserted successfully:", insertedMessage)
    
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

    // NO MODERATION - Confederate messages are not moderated
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Start session immediately when confederate joins (no training)
  useEffect(() => {
    if (room && !waitingForUser && !sessionStarted) {
      handleTrainingComplete()
    }
  }, [room, waitingForUser, sessionStarted])

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
            <div className="mb-4 text-2xl font-bold">Waiting for another participant to join...</div>
            <div className="text-muted-foreground">Looking for a participant who needs a confederate.</div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!room || !roomId1v1Human) {
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

  // Main UI component - IDENTICAL to regular participant page
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
                  1v1 Human Chat
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
                      ...members.map((member, memberIndex) => {
                        const confederateUserId = Object.keys(userNameCache).find(id => 
                          userNameCache[id] === confederateName
                        )
                        const isCurrentUser = member.user_id === confederateUserId
                        
                        // Determine role based on order: first user = participant, second user = confederate
                        const isConfederate = members.length >= 2 && memberIndex === 1
                        const memberRole = isConfederate ? "confederate" : "user"
                        
                        return {
                          name: member.user_name,
                          role: memberRole,
                          position: null,
                          isCurrentUser: isCurrentUser
                        }
                      }),
                      { name: "Moderator", role: "moderator", position: null, isCurrentUser: false },
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
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {member.role === "confederate" ? "Confederate" : member.role}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </TabsContent>
                  <TabsContent value="info" className="mt-4">
                    <Card>
                      <CardContent className="p-4 text-sm">
                        <h3 className="mb-2 font-semibold">Current Topic</h3>
                        <p className="mb-4 text-muted-foreground">{chatTopicDisplayNames[debateTopic] || debateTopic}</p>
                        <h3 className="mb-2 font-semibold">Session Type</h3>
                        <p className="mb-4 text-muted-foreground">Human vs Human Confederate</p>
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
                    const senderName = getSenderName(message)

                    // Determine message alignment
                    let messageAlignment = "justify-start"
                    let isCurrentUser = false
                    
                    const confederateUserId = Object.keys(userNameCache).find(id => 
                      userNameCache[id] === confederateName
                    )
                    isCurrentUser = message.sender_id === confederateUserId
                    
                    if (isUser && isCurrentUser) {
                      // Current user (confederate) messages on the right
                      messageAlignment = "justify-end"
                    } else if (isUser && !isCurrentUser) {
                      // Other user (participant) messages on the left
                      messageAlignment = "justify-start"
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

        {/* Exit Confirmation Dialog */}
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

export default function ConfederateChat1v1HumanPage() {
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
      <ConfederateChat1v1HumanComponent />
    </Suspense>
  )
} 