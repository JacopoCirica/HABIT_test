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
import { FadeIn } from "@/components/ui/fade-in"
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
  Shield,
  Mail,
} from "lucide-react"

// Import Supabase and utilities
import { supabase } from "@/lib/supabaseClient"

function ChatEnronComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sessionTitle = "Enron Whaling Project"
  const enronAiId = "enron_ai"
  const enronAiName = "Enron AI Assistant"

  // Room and connection states
  const [room, setRoom] = useState<any>(null)
  const [roomIdEnron, setRoomIdEnron] = useState<string>("")
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [waitingForConnection, setWaitingForConnection] = useState(false)

  // Session states
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(30 * 60) // 30 minutes

  // UI states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [fetchError, setFetchError] = useState<any>(null)

  // Message states
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // User name cache
  const [userNameCache, setUserNameCache] = useState<{[key: string]: string}>({})
  const [cacheVersion, setCacheVersion] = useState(0)

  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen)

  const handleExitClick = () => {
    console.log('Enron: Exit button clicked')
    console.log('Enron: Attempting direct redirect...')
    
    // Direct redirect to homepage
    try {
      router.push('/')
      console.log('Enron: Router.push executed')
    } catch (error) {
      console.error('Enron: Router.push failed, using window.location:', error)
      window.location.href = '/'
    }
  }

  // Initialize room connection
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
        [enronAiId]: enronAiName
      }
      setCacheVersion(v => v + 1)
      return updated
    })

    setLoadingRoom(true)
    
    fetch('/api/rooms/enron/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        user_name: userName
      }),
    })
      .then(async res => {
        const data = await res.json()
        console.log('Enron API response:', data)
        
        if (!res.ok) {
          console.error('Enron API error:', data)
          throw new Error(data.error || 'Failed to join room')
        }
        
        return data
      })
      .then(({ room }) => {
        console.log('Joined Enron room:', room)
        setRoom(room)
        setRoomIdEnron(room.id)
        setWaitingForConnection(room.status === 'waiting')
      })
      .catch((error) => {
        console.error('Error joining Enron room:', error)
        setRoom(null)
      })
      .finally(() => setLoadingRoom(false))
  }, [])

  // Set up Supabase subscription for messages
  useEffect(() => {
    if (!roomIdEnron) return

    console.log('Setting up Enron subscription for roomId:', roomIdEnron)

    // Fetch all messages for this room on initial load
    const fetchMessages = async () => {
      console.log('Fetching Enron messages for roomId:', roomIdEnron)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomIdEnron)
        .order('created_at', { ascending: true })

      if (!error && data) {
        console.log('Fetched Enron messages:', data)
        const fetchedMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.sender_role,
          content: msg.content,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
        }))
        
        setMessages(fetchedMessages)
        setFetchError(null)
        
        // Start session immediately with Enron AI greeting if no messages exist
        const hasEnronAiMessage = fetchedMessages.some(msg => msg.sender_id === enronAiId)
        if (!hasEnronAiMessage) {
          console.log('No Enron AI message found, adding greeting...')
          setTimeout(() => addEnronAiGreeting(), 1000)
        } else {
          console.log('Enron AI message already exists, starting session...')
          setSessionStarted(true)
        }
      } else {
        console.error('Error fetching Enron messages:', error)
        setFetchError(error)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`enron-room-messages-${roomIdEnron}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomIdEnron}`,
        },
        (payload) => {
          console.log('Enron received new message:', payload.new)
          const newMessage = payload.new
          
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              console.log('Enron message already exists, skipping')
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
            
            console.log('Enron messages updated, new count:', updatedMessages.length)
            return updatedMessages
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomIdEnron])

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
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [sessionStarted, sessionEnded, sessionPaused, sessionTimeRemaining])

  // Add Enron AI's initial greeting
  const addEnronAiGreeting = async () => {
    if (!roomIdEnron) return
    
    console.log('Adding Enron AI greeting...')
    
    const greetingMessage = {
      room_id: roomIdEnron,
      sender_id: enronAiId,
      sender_role: "assistant",
      content: "Greetings! I'm the Enron AI Assistant, built from analyzing thousands of Enron executive emails. I can help demonstrate how insider knowledge could be weaponized to create highly targeted whaling attacks. I understand corporate communication patterns, executive relationships, and can craft convincing phishing emails that leverage internal company dynamics. What type of whaling attack scenario would you like to explore today?",
    }
    
    try {
      const { data: insertedGreeting, error: greetingError } = await supabase
        .from("messages")
        .insert([greetingMessage])
        .select()
        .single()
        
      if (!greetingError) {
        console.log('Enron AI greeting inserted successfully')
        setSessionStarted(true) // Start the session after greeting
      } else {
        console.error('Error inserting Enron AI greeting:', greetingError)
      }
      
    } catch (error) {
      console.error('Error adding Enron AI greeting:', error)
    }
  }

  // Chat submit handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomIdEnron) return

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
      room_id: roomIdEnron,
      sender_id: userId,
      sender_role: "user",
      content: trimmedInput,
    }

    console.log("Enron inserting user message:", userMessage)

    const { data: insertedMessage, error: userError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select()
      .single()
      
    if (userError) {
      console.error("Enron failed to send message:", userError)
      setIsLoading(false)
      return
    }
    
    console.log("Enron message inserted successfully:", insertedMessage)

    // Generate Enron AI's response
    try {
      console.log("Enron generating AI response")
      
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
        topic: "Whaling Attack Demonstration",
        roomId: roomIdEnron,
        debateTopic: null,
        userPosition: "researcher",
        confederateName: enronAiName,
        sessionType: "enron_whaling",
        isEnronAssistant: true,
      }
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        console.error("Enron AI response failed:", response.status, response.statusText)
        return
      }

      const data = await response.json()
      console.log("Enron AI response received:", data)
      
      // Add delay before Enron AI responds (1-3 seconds)
      const responseDelay = Math.random() * 2000 + 1000
      await new Promise(resolve => setTimeout(resolve, responseDelay))
      
      // Insert Enron AI's response into Supabase
      const enronAiMessage = {
        room_id: roomIdEnron,
        sender_id: enronAiId,
        sender_role: "assistant",
        content: data.content || "I appreciate your question. Let me analyze that from a cybersecurity perspective...",
      }
      
      const { data: insertedAIMessage, error: aiError } = await supabase
        .from("messages")
        .insert([enronAiMessage])
        .select()
        .single()
        
      if (!aiError) {
        console.log("Enron AI response inserted successfully:", insertedAIMessage)
      } else {
        console.error("Error inserting Enron AI response:", aiError)
      }
      
    } catch (error) {
      console.error("Enron error generating AI response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = (timeRemaining: number) => {
    if (timeRemaining > 300) return "text-green-600" // > 5 minutes
    if (timeRemaining > 60) return "text-yellow-600"  // > 1 minute
    return "text-red-600" // <= 1 minute
  }

  function getSenderName(message: any) {
    if (message.sender_id === "moderator") {
      return "Moderator"
    }
    if (message.sender_id === enronAiId) {
      return enronAiName
    }
    if (userNameCache[message.sender_id]) {
      return userNameCache[message.sender_id]
    }
    return "User"
  }

  // Loading states
  if (loadingRoom) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Connecting to Enron Whaling Project...</p>
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
            <p className="mt-2 text-red-600">Failed to connect to Enron Whaling Project</p>
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
            <p className="mt-2 text-muted-foreground">Preparing your Enron Whaling Project session...</p>
          </div>
        </div>
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
              
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-lg font-semibold">HABIT</span>
              </div>
              
              <Badge variant="secondary" className="hidden md:inline-flex">
                {sessionTitle}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {sessionStarted && !sessionEnded && (
                <motion.div 
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Timer className="h-4 w-4 text-gray-600" />
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
          {/* Sidebar */}
          <motion.aside
            className={cn(
              "w-80 border-r bg-gray-50",
              "md:flex md:flex-col",
              mobileSidebarOpen ? "flex flex-col" : "hidden"
            )}
            initial={false}
            animate={{ 
              x: mobileSidebarOpen ? 0 : -320,
              opacity: mobileSidebarOpen ? 1 : 0 
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-full flex-col">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Session Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMobileSidebar}
                    className="md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="participants" className="flex-1">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="participants">
                    <Users className="mr-2 h-4 w-4" />
                    Participants
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    <Info className="mr-2 h-4 w-4" />
                    Info
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="participants" className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-gray-700">Participants</h3>
                      <div className="space-y-3">
                        {Object.entries(userNameCache).map(([userId, userName]) => (
                          <div key={userId} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-medium">
                                {userName.charAt(0).toUpperCase()}
                              </div>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{userName}</div>
                              <div className="text-xs text-gray-500">
                                {userId === enronAiId ? "AI Assistant" : "User"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="info" className="flex-1 p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Project Focus</div>
                      <div className="text-sm text-gray-600">Whaling Attack Demonstration</div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Session Type</div>
                      <div className="text-sm text-gray-600">Enron Whaling Project</div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Session Duration</div>
                      <div className="text-sm text-gray-600">30 minutes</div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Purpose</div>
                      <div className="text-sm text-gray-600">
                        Demonstrate how insider threat models can create targeted phishing attacks
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.aside>

          {/* Main content area */}
          <div className="flex flex-1 flex-col">
            {/* Chat header */}
            <div className="border-b bg-white p-4">
              <div className="mx-auto max-w-3xl">
                <h1 className="text-xl font-semibold text-gray-900">{sessionTitle}</h1>
                <p className="text-sm text-gray-600">
                  Explore insider threat models and whaling attack scenarios with the Enron AI Assistant
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="mx-auto max-w-3xl space-y-4 p-4">
                  {messages.length === 0 && !fetchError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Mail className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">Waiting for conversation to begin...</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message, index) => {
                        const senderName = getSenderName(message)
                        const isEnronAi = message.sender_id === enronAiId
                        const isUser = !isEnronAi && message.sender_id !== "moderator"

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              "flex gap-3",
                              isUser ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isUser && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <div className={cn(
                                  "flex h-full w-full items-center justify-center text-xs font-medium",
                                  isEnronAi ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                )}>
                                  {isEnronAi ? "E" : senderName.charAt(0).toUpperCase()}
                                </div>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              "max-w-[70%] space-y-1",
                              isUser && "text-right"
                            )}>
                              <div className="flex items-center gap-2">
                                {!isUser && (
                                  <span className="text-xs font-medium text-gray-600">
                                    {senderName}
                                  </span>
                                )}
                                {isEnronAi && (
                                  <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                                    Enron AI
                                  </Badge>
                                )}
                              </div>
                              
                              <Card className={cn(
                                "p-3",
                                isUser 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : isEnronAi
                                    ? "bg-red-50 text-red-900 border-red-200"
                                    : "bg-gray-100 text-gray-900 border-gray-200"
                              )}>
                                <CardContent className="p-0">
                                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                </CardContent>
                              </Card>
                            </div>

                            {isUser && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-xs font-medium text-blue-800">
                                  {senderName.charAt(0).toUpperCase()}
                                </div>
                              </Avatar>
                            )}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  )}

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
      </div>
    </PageTransition>
  )
}

export default function ChatEnronPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ChatEnronComponent />
    </Suspense>
  )
} 