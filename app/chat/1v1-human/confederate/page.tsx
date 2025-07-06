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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

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

  const sessionTitle = "1v1 Human Debate Session - Confederate"
  const sessionDescription = "You are joining as a confederate named Ben to debate with a participant"

  // State management
  const [room, setRoom] = useState<any>(null)
  const [roomId1v1Human, setRoomId1v1Human] = useState<string | null>(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [waitingForRoom, setWaitingForRoom] = useState(false)
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
  const [fetchError, setFetchError] = useState<any>(null)
  const [userNameCache, setUserNameCache] = useState<Record<string, string>>({})
  const [cacheVersion, setCacheVersion] = useState(0)
  const [joinError, setJoinError] = useState<string | null>(null)

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
          setJoinError(data.error)
          setWaitingForRoom(true)
        } else {
          console.log('Confederate joined room:', data.room)
          setRoom(data.room)
          setRoomId1v1Human(data.room.id)
          setSessionStarted(true) // Confederate starts immediately
        }
      })
      .catch((error) => {
        console.error('Error joining as confederate:', error)
        setJoinError('Failed to connect to room')
        setWaitingForRoom(true)
      })
      .finally(() => setLoadingRoom(false))
  }, [])

  // Poll for available rooms if waiting
  useEffect(() => {
    if (waitingForRoom && !room) {
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
            setWaitingForRoom(false)
            setJoinError(null)
            setSessionStarted(true)
            clearInterval(interval)
          }
        } catch (error) {
          console.error('Error polling for rooms:', error)
        }
      }, 3000) // Check every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [waitingForRoom, room])

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

  // Start session timer when confederate joins
  useEffect(() => {
    if (sessionStarted && !sessionEnded) {
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
      
      return () => clearInterval(interval)
    }
  }, [sessionStarted, sessionEnded])

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
    router.push("/")
  }
  const handleExitCancel = () => setExitDialogOpen(false)

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

  // Chat submit handler with moderation layer
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomId1v1Human) return

    const trimmedInput = input.trim()
    setInput("")

    // Get consistent confederate user ID
    const confederateUserId = Object.keys(userNameCache).find(id => 
      userNameCache[id] === confederateName
    ) || `confederate_${Date.now()}`

    // Insert confederate message into Supabase immediately
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

    // Background moderation (same as regular users)
    setTimeout(async () => {
      try {
        const response = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmedInput,
            context: "1v1-human-debate",
            roomId: roomId1v1Human,
          }),
        })

        const moderationResult = await response.json()
        console.log("Confederate moderation result:", moderationResult)

        if (!moderationResult.safe) {
          // Add moderator intervention message
          const moderatorMessage = {
            room_id: roomId1v1Human,
            sender_id: "moderator",
            sender_role: "system",
            content: moderationResult.message || "Your message has been flagged for review. Please keep the discussion respectful and on-topic.",
          }

          const { data: insertedModeratorMessage, error: moderatorError } = await supabase
            .from("messages")
            .insert([moderatorMessage])
            .select()
            .single()

          if (!moderatorError && insertedModeratorMessage) {
            console.log("Confederate moderator message inserted successfully")
          }
        }
      } catch (error) {
        console.error("Confederate error in moderation:", error)
      }
    }, 2000)
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Loading state
  if (loadingRoom) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Connecting as confederate...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  // Waiting for room state
  if (waitingForRoom) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2">Waiting for a Room</h2>
              <p className="text-gray-600 mb-4">
                {joinError || "Looking for a participant who needs a confederate..."}
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className={cn(
            "bg-white shadow-lg transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-80" : "w-16",
            "hidden lg:flex"
          )}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {sidebarOpen && (
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-gray-900">HABIT</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="p-2"
                >
                  {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Session Info */}
            {sidebarOpen && (
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">{sessionTitle}</h3>
                  <p className="text-sm text-gray-600">{sessionDescription}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Confederate
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      {confederateName}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Session Timer */}
            {sidebarOpen && sessionStarted && (
              <div className="p-4 border-b border-gray-200">
                <div className={cn(
                  "p-3 rounded-lg",
                  getTimerBgColor(sessionTimeRemaining)
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm font-medium">Time Remaining</span>
                    </div>
                    <span className={cn(
                      "text-lg font-bold",
                      getTimerColor(sessionTimeRemaining)
                    )}>
                      {formatTime(sessionTimeRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Room Members */}
            {sidebarOpen && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Participants</h4>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <div className="w-full h-full bg-blue-500 text-white text-xs flex items-center justify-center">
                          {getAvatarInitial(member.user_name || "U")}
                        </div>
                      </Avatar>
                      <span className="text-sm text-gray-700">
                        {member.user_name || "Unknown User"}
                        {member.user_name === confederateName && " (You)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exit Button */}
            {sidebarOpen && (
              <div className="mt-auto p-4">
                <Button
                  variant="outline"
                  onClick={handleExitClick}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit Session
                </Button>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white shadow-sm p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMobileSidebar}
                    className="p-2"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold text-gray-900">HABIT</span>
                </div>
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="p-2"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <MessageAnimation key={message.id}>
                  <div className={cn(
                    "flex",
                    message.role === "user" 
                      ? getSenderName(message) === confederateName 
                        ? "justify-end" 
                        : "justify-start"
                      : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg",
                      message.role === "user"
                        ? getSenderName(message) === confederateName
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-900"
                        : message.sender_id === "moderator"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-gray-100 text-gray-900"
                    )}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium opacity-75">
                          {getSenderName(message)}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </MessageAnimation>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            {sessionStarted && !sessionEnded && (
              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <AnimatedButton
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-6"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Send"
                    )}
                  </AnimatedButton>
                </form>
              </div>
            )}

            {/* Session Ended */}
            {sessionEnded && (
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">The session has ended.</p>
                  <Button onClick={() => router.push("/")}>
                    Return to Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleMobileSidebar}>
            <div className="bg-white w-80 h-full shadow-lg" onClick={(e) => e.stopPropagation()}>
              {/* Mobile sidebar content would go here */}
            </div>
          </div>
        )}

        {/* Exit Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={exitDialogOpen}
          onClose={handleExitCancel}
          title="Exit Session"
          description="Are you sure you want to exit this session? This action cannot be undone."
          onConfirm={handleExitConfirm}
        />
      </div>
    </PageTransition>
  )
}

export default function ConfederateChat1v1HumanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ConfederateChat1v1HumanComponent />
    </Suspense>
  )
} 