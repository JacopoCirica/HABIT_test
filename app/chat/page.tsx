"use client"

import type React from "react"
import { Suspense } from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  MessageSquare,
  Send,
  Users,
  Info,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  BarChart2,
  Timer,
  Pause,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { participants } from "@/lib/chat-service"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"
import { MessageAnimation } from "@/components/ui/message-animation"
import { motion, AnimatePresence } from "framer-motion"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { OnboardingTraining } from "@/components/ui/onboarding-training"
import { OpinionPoll } from "@/components/ui/opinion-poll"
import { OpinionTrackerVisualization } from "@/components/ui/opinion-tracker-visualization"
import { PostSurvey, type PostSurveyResponses } from "@/components/ui/post-survey"
import { SurveyThankYou } from "@/components/ui/survey-thank-you"
import { ModeratorControls } from "@/components/ui/moderator-controls"
import { getTopicToDebate, topicDisplayNames, topicDebateFraming } from "@/lib/opinion-analyzer"
import { initializeOpinionTracking, recordOpinionChange } from "@/lib/opinion-tracker"
import { savePostSurvey } from "@/lib/post-survey-actions"
import {
  createChatRoom,
  saveRoomToStorage,
  loadRoomFromStorage,
  getCurrentRoomId,
  saveMessagesToStorage,
  loadMessagesFromStorage,
  updateRoomActivity,
  cleanupOldRooms,
  type ChatRoom,
  type ChatMessage,
} from "@/lib/chat-rooms"
import type { UserOpinions, OpinionTopic } from "@/lib/opinion-analyzer"
import type { OpinionTrackingData } from "@/lib/opinion-tracker"
import { createClient } from '@supabase/supabase-js'

const CONFEDERATE_NAMES = [
  "Ben",
  "Chuck",
  "Jamie",
  "Alex",
  "Taylor",
]

// Simulated confederate responses based on topics
const SIMULATED_RESPONSES = {
  // General responses that work for any topic
  general: [
    "That's an interesting perspective. I tend to think differently about this issue. What makes you feel that way?",
    "I see your point, though I'm not sure I agree completely. Could you elaborate on your reasoning?",
    "I understand where you're coming from, but have you considered the alternative viewpoint?",
    "That's a good point. I've been thinking about this topic a lot lately and have mixed feelings.",
    "I appreciate your thoughts on this. It's definitely a complex issue with no easy answers.",
    "I've read some research that suggests a different conclusion. What do you think about that?",
    "That's one way to look at it. I tend to think the evidence points in another direction though.",
    "I respect your opinion, but I wonder if we're overlooking some important factors here.",
    "You make a compelling argument. I'm still not convinced, but you've given me something to think about.",
    "I used to think that way too, but my perspective changed after learning more about the issue.",
  ],

  // Topic-specific responses
  technology: [
    "I think technology is advancing too quickly without proper ethical considerations. Do you worry about that?",
    "I believe AI and automation will create more jobs than they eliminate. What's your take on this?",
    "Social media seems to be doing more harm than good for society. Would you agree?",
    "I'm concerned about privacy in the digital age. Do you think we've given up too much?",
    "Technology has improved our lives in countless ways. I think the benefits outweigh the drawbacks.",
  ],

  climate: [
    "I think individual actions matter less than systemic change when it comes to climate issues. What do you think?",
    "Climate change requires immediate action, even if it means economic sacrifices. Would you agree?",
    "I believe technological innovation will solve climate problems without requiring major lifestyle changes.",
    "I'm skeptical about some of the more extreme climate predictions. The science seems less certain than reported.",
    "Climate change is the defining crisis of our time and requires global cooperation to address.",
  ],

  politics: [
    "I think political polarization is making it impossible to solve real problems. Do you see a way forward?",
    "Government regulation is often necessary to protect people from corporate interests. What's your view?",
    "I believe free markets generally lead to better outcomes than government intervention.",
    "The two-party system seems fundamentally broken. Do you think we need political reform?",
    "I think compromise is essential in politics, but it seems like a lost art these days.",
  ],

  education: [
    "Traditional education seems outdated for today's world. Should we completely rethink our approach?",
    "I believe standardized testing does more harm than good. What's your experience with this?",
    "Higher education is becoming too expensive and doesn't guarantee success anymore.",
    "I think schools should focus more on practical skills than theoretical knowledge. Would you agree?",
    "Education is the great equalizer in society, but our system isn't providing equal opportunities.",
  ],

  healthcare: [
    "Healthcare should be a right, not a privilege. Do you think the current system is fair?",
    "I believe market-based healthcare solutions lead to better innovation and quality of care.",
    "Mental health deserves the same attention and resources as physical health. Why do you think there's still a gap?",
    "Prevention should be the focus of healthcare, but our system seems built around treating illness instead.",
    "The cost of healthcare in America seems unsustainable. What do you think needs to change?",
  ],
}

// First message responses based on topics
// const FIRST_MESSAGES = {
//   technology:
//     "I've been thinking about how technology is changing our society lately. I'm concerned we're becoming too dependent on devices and algorithms. What do you think about this issue?",
//   climate:
//     "I read an article about climate change yesterday that made me think we're not doing enough to address the problem. Do you have thoughts on this?",
//   politics:
//     "I was discussing political polarization with a friend and I argued that social media is making it worse. Would you agree with that perspective?",
//   education:
//     "I've been wondering if our education system is preparing students for the future. I think we need major reforms. What's your take on this?",
//   healthcare:
//     "Healthcare costs keep rising, and I believe the system needs fundamental change. Do you think healthcare should be a right for everyone?",
//   general:
//     "I've been thinking about how society is changing lately. There are so many complex issues we're facing. What topics are you most concerned about these days?",
// }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatPage />
    </Suspense>
  );
}

function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const roomType = searchParams.get("type") || "1v1";
  const [userOpinions, setUserOpinions] = useState<UserOpinions>({})
  const [userName, setUserName] = useState("User")
  const [sessionTitle, setSessionTitle] = useState("Opinion Discussion")
  const [sessionDescription, setSessionDescription] = useState(
    "Discuss and debate various social and political topics.",
  )

  // Chat room state
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [roomIdCopied, setRoomIdCopied] = useState(false)

  // Opinion tracking state
  const [debateTopic, setDebateTopic] = useState<OpinionTopic | null>(null)
  const [opinionTrackingData, setOpinionTrackingData] = useState<OpinionTrackingData | null>(null)
  const [showOpinionPoll, setShowOpinionPoll] = useState(false)
  const [lastPollTime, setLastPollTime] = useState(0)
  const [showOpinionTracker, setShowOpinionTracker] = useState(false)

  // Exit survey state
  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [showSurveyThankYou, setShowSurveyThankYou] = useState(false)

  // Session timing state
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(15 * 60) // 15 minutes in seconds
  const [sessionEnded, setSessionEnded] = useState(false)
  const [timeAdjustments, setTimeAdjustments] = useState<
    Array<{ type: "add" | "remove"; minutes: number; timestamp: number }>
  >([])

  // Moderator state
  const [isModerator, setIsModerator] = useState(false)

  // Simulated chat state
  const [messages, setMessages] = useState<
    Array<{ id: string; role: "user" | "assistant" | "system"; content: string }>
  >([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // const [simulationMode, setSimulationMode] = useState(true) // Keep this if you want to force simulation
  const [hasStartedConversation, setHasStartedConversation] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string>("general")
  const [apiErrorCount, setApiErrorCount] = useState(0)
  const [useSimulatedResponses, setUseSimulatedResponses] = useState(false)

  // Poll interval in milliseconds (5 minutes)
  const POLL_INTERVAL = 5 * 60 * 1000
  // Minimum messages before first poll
  const MIN_MESSAGES_BEFORE_POLL = 6
  // Session duration in seconds (15 minutes)
  // const SESSION_DURATION = 15 * 60 // Already used for sessionTimeRemaining
  // Max API errors before switching to simulated responses
  const MAX_API_ERRORS = 2

  // Add a state for waiting
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // Initialize or load chat room
  useEffect(() => {
    cleanupOldRooms()
    const existingRoomId = getCurrentRoomId()
    let room: ChatRoom | null = null
    if (existingRoomId) room = loadRoomFromStorage(existingRoomId)

    const storedName = sessionStorage.getItem("userName")
    const storedOpinionsJSON = sessionStorage.getItem("userOpinions")
    const storedUserId = sessionStorage.getItem("userId") || "anonymous"
    let opinions: UserOpinions = {}
    if (storedOpinionsJSON)
      try {
        opinions = JSON.parse(storedOpinionsJSON)
      } catch (e) {
        console.error("Error parsing stored opinions:", e)
      }

    if (!room || room.userId !== storedUserId || room.userName !== (storedName || "User")) {
      room = createChatRoom(storedUserId, storedName || "User", opinions)
      // Assign confederate name if new room or not set
      if (!room.confederateName) {
        room.confederateName = CONFEDERATE_NAMES[Math.floor(Math.random() * CONFEDERATE_NAMES.length)]
      }
      saveRoomToStorage(room)
    } else {
      // If room loaded, ensure confederateName is set
      if (!room.confederateName) {
        room.confederateName = CONFEDERATE_NAMES[Math.floor(Math.random() * CONFEDERATE_NAMES.length)]
        saveRoomToStorage(room)
      }
    }

    setCurrentRoom(room)
    setRoomId(room.id)
    setUserName(room.userName)
    setUserOpinions(room.userOpinions)
    setSessionStarted(room.sessionStarted)
    setSessionPaused(room.sessionPaused)
    setSessionTime(room.sessionTime)
    setSessionTimeRemaining(room.sessionTimeRemaining)
    setSessionEnded(room.sessionEnded)
    setTimeAdjustments(room.timeAdjustments)
    // Ensure moderatorPresent is also loaded from the room
    setIsModerator(room.moderatorPresent || false)

    // Update roomMembers with the assigned confederate name
    const confederateActualName = room.confederateName || "Confederate" // Fallback
    setRoomMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.role === "confederate"
          ? { ...member, name: confederateActualName }
          : member.role === "user"
            ? { ...member, name: room.userName }
            : member
      ),
    )

    const topicToDebateAnalysis = getTopicToDebate(room.userOpinions)
    if (topicToDebateAnalysis) {
      const topicKey = topicToDebateAnalysis.topic
      setDebateTopic(topicKey)
      room.debateTopic = topicKey // Ensure room object is updated before save
      const topicDisplayName = topicDisplayNames[topicKey]
      const debateQuestion = topicDebateFraming[topicKey]
      setSessionTitle(topicDisplayName)
      setSessionDescription(debateQuestion)
      const tracking = initializeOpinionTracking(topicKey, topicToDebateAnalysis.rawValue)
      setOpinionTrackingData(tracking)

      if (["vaccination", "universalHealthcare"].includes(topicKey)) setSelectedTopic("healthcare")
      else if (topicKey === "climateChange") setSelectedTopic("climate")
      else if (["immigration", "gunControl"].includes(topicKey)) setSelectedTopic("politics")
      else setSelectedTopic("general")
    }

    if (room.id) {
      const existingMessages = loadMessagesFromStorage(room.id)
      if (existingMessages.length > 0) {
        setMessages(
          existingMessages.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
        )
        setHasStartedConversation(true)
      }
    }
    saveRoomToStorage(room) // Save room again after all updates
  }, [])

  // Check for moderator access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const moderatorKey = urlParams.get("moderator")
    const storedModeratorStatus = sessionStorage.getItem("isModerator")
    if (moderatorKey === "admin123" || storedModeratorStatus === "true") {
      setIsModerator(true)
      if (moderatorKey) sessionStorage.setItem("isModerator", "true")
      if (currentRoom) {
        currentRoom.moderatorPresent = true
        saveRoomToStorage(currentRoom)
      }
    }
  }, [currentRoom])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [roomMembers, setRoomMembers] = useState(participants)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [showTraining, setShowTraining] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!sessionStarted || sessionEnded || sessionPaused || !currentRoom) return
    const timer = setInterval(() => {
      setSessionTime((prev) => {
        const newTime = prev + 1
        currentRoom.sessionTime = newTime
        saveRoomToStorage(currentRoom)
        return newTime
      })
      setSessionTimeRemaining((prev) => {
        const newTime = prev - 1
        currentRoom.sessionTimeRemaining = newTime
        saveRoomToStorage(currentRoom)
        if (newTime <= 0) {
          setSessionEnded(true)
          setShowExitSurvey(true)
          currentRoom.sessionEnded = true
          saveRoomToStorage(currentRoom)
          return 0
        }
        return newTime
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [sessionStarted, sessionEnded, sessionPaused, currentRoom])

  useEffect(() => {
    const trainingCompleted = sessionStorage.getItem("trainingCompleted")
    if (!trainingCompleted) {
      const timer = setTimeout(() => setShowTraining(true), 1000)
      return () => clearTimeout(timer)
    } else if (currentRoom && !currentRoom.sessionStarted) {
      setSessionStarted(true)
      currentRoom.sessionStarted = true
      saveRoomToStorage(currentRoom)
    }
  }, [currentRoom])

  useEffect(() => {
    if (sessionStarted && !hasStartedConversation && !sessionPaused && !sessionEnded && roomId && debateTopic) {
      const timer = setTimeout(() => {
        const topicDisplayName = debateTopic ? topicDisplayNames[debateTopic] : "the designated topic"
        const moderatorMessageContent = `Welcome! I'm the Moderator for this session. The goal of this conversation is for you and another participant to debate the topic: "${topicDisplayName}". Please maintain a respectful dialogue. I will intervene if messages are harmful or inappropriate. This session will last 15 minutes. Please feel free to begin when you're ready.`

        const moderatorSystemMessage = {
          id: `system_moderator_${Date.now()}`,
          role: "system" as const,
          content: moderatorMessageContent,
        }

        setMessages([moderatorSystemMessage])

        const chatMessageForStorage: ChatMessage = {
          ...moderatorSystemMessage,
          roomId,
          timestamp: new Date(),
        }
        saveMessagesToStorage(roomId, [chatMessageForStorage])
        updateRoomActivity(roomId)
        setHasStartedConversation(true)
      }, 500) // Keep a small delay, e.g., 500ms
      return () => clearTimeout(timer)
    }
  }, [sessionStarted, hasStartedConversation, sessionPaused, sessionEnded, roomId, debateTopic])

  useEffect(() => {
    if (!debateTopic || !opinionTrackingData || !sessionStarted || sessionEnded || sessionPaused) return
    const now = Date.now()
    if (now - lastPollTime < POLL_INTERVAL) return
    const userMessagesCount = messages.filter((m) => m.role === "user").length
    const assistantMessagesCount = messages.filter((m) => m.role === "assistant").length
    if (
      (opinionTrackingData.history.length === 1 &&
        userMessagesCount >= MIN_MESSAGES_BEFORE_POLL &&
        assistantMessagesCount >= MIN_MESSAGES_BEFORE_POLL) ||
      (opinionTrackingData.history.length > 1 && now - lastPollTime >= POLL_INTERVAL)
    ) {
      setShowOpinionPoll(true)
      setLastPollTime(now)
    }
  }, [messages, debateTopic, opinionTrackingData, lastPollTime, sessionStarted, sessionEnded, sessionPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  const getTimerColor = (timeRemaining: number) => {
    if (sessionPaused) return "text-yellow-600"
    if (timeRemaining <= 60) return "text-red-600"
    if (timeRemaining <= 300) return "text-amber-600"
    return "text-foreground"
  }
  const getTimerBgColor = (timeRemaining: number) => {
    if (sessionPaused) return "bg-yellow-50"
    if (timeRemaining <= 60) return "bg-red-50"
    if (timeRemaining <= 300) return "bg-amber-50"
    return "bg-muted"
  }
  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-green-500"
    if (status === "idle") return "bg-yellow-500"
    return "bg-gray-400"
  }
  const getAvatarInitial = (name: string) => name.charAt(0).toUpperCase()
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen)
  const toggleOpinionTracker = () => setShowOpinionTracker(!showOpinionTracker)
  const copyRoomId = async () => {
    if (roomId)
      try {
        await navigator.clipboard.writeText(roomId)
        setRoomIdCopied(true)
        setTimeout(() => setRoomIdCopied(false), 2000)
      } catch (e) {
        console.error("Failed to copy room ID:", e)
      }
  }
  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const handleExitClick = () => setExitDialogOpen(true)
  const handleExitConfirm = () => {
    setExitDialogOpen(false)
    // Show the post-survey instead of immediately navigating away
    setShowExitSurvey(true)
  }
  const handleExitCancel = () => setExitDialogOpen(false)
  const handleTrainingComplete = () => {
    setShowTraining(false)
    setSessionStarted(true)
    if (currentRoom) {
      currentRoom.sessionStarted = true
      saveRoomToStorage(currentRoom)
    }
  }
  const handleSessionEnd = () => {
    setShowExitSurvey(true)
  }
  const handlePauseResume = () => {
    const newPausedState = !sessionPaused
    setSessionPaused(newPausedState)
    if (currentRoom) {
      currentRoom.sessionPaused = newPausedState
      saveRoomToStorage(currentRoom)
    }
  }
  const handleModeratorEndSession = () => {
    setSessionEnded(true)
    setShowExitSurvey(true)
    if (currentRoom) {
      currentRoom.sessionEnded = true
      saveRoomToStorage(currentRoom)
    }
  }
  const handleAddTime = (minutes: number) => {
    const secondsToAdd = minutes * 60
    setSessionTimeRemaining((prev) => prev + secondsToAdd)
    const adj = { type: "add" as const, minutes, timestamp: Date.now() }
    setTimeAdjustments((prev) => [...prev, adj])
    if (currentRoom) {
      currentRoom.sessionTimeRemaining += secondsToAdd
      currentRoom.timeAdjustments.push(adj)
      saveRoomToStorage(currentRoom)
    }
  }
  const handleRemoveTime = (minutes: number) => {
    const secondsToRemove = minutes * 60
    setSessionTimeRemaining((prev) => Math.max(0, prev - secondsToRemove))
    const adj = { type: "remove" as const, minutes, timestamp: Date.now() }
    setTimeAdjustments((prev) => [...prev, adj])
    if (currentRoom) {
      currentRoom.sessionTimeRemaining = Math.max(0, currentRoom.sessionTimeRemaining - secondsToRemove)
      currentRoom.timeAdjustments.push(adj)
      saveRoomToStorage(currentRoom)
    }
  }
  const handleOpinionUpdate = (value: number, reason: string) => {
    if (!debateTopic || !opinionTrackingData) return
    const updatedTracking = recordOpinionChange(opinionTrackingData, value, reason)
    setOpinionTrackingData(updatedTracking)
    try {
      sessionStorage.setItem(`opinionTracking_${debateTopic}`, JSON.stringify(updatedTracking))
    } catch (e) {
      console.error("Error storing opinion tracking data:", e)
    }
  }
  const handleSurveySubmit = async (responses: PostSurveyResponses) => {
    try {
      const sessionData = {
        duration: sessionTime,
        messageCount: messages.filter((m) => m.role !== "system").length,
        debateTopic,
        opinionChanges: opinionTrackingData,
        userName,
        sessionTitle,
        sessionCompleted: sessionEnded,
        timeRemaining: sessionTimeRemaining,
        wasPaused: timeAdjustments.length > 0 || sessionPaused,
        timeAdjustments,
        moderatorPresent: isModerator,
        roomId,
        simulationMode: useSimulatedResponses, // Changed from true
      }
      await savePostSurvey(responses, sessionData)
      setShowExitSurvey(false)
      setShowSurveyThankYou(true)
    } catch (e) {
      console.error("Error submitting survey:", e)
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
    const topicResponses =
      SIMULATED_RESPONSES[selectedTopic as keyof typeof SIMULATED_RESPONSES] || SIMULATED_RESPONSES.general
    return topicResponses[Math.floor(Math.random() * topicResponses.length)]
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionStarted || sessionEnded || sessionPaused || !input.trim() || !roomId) return

    const userMessage = { id: `user_${Date.now()}`, role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const chatMessageForStorage: ChatMessage = { ...userMessage, roomId, timestamp: new Date() }
    const existingMessages = loadMessagesFromStorage(roomId)
    saveMessagesToStorage(roomId, [...existingMessages, chatMessageForStorage])
    updateRoomActivity(roomId)

    // --- Start timing for LLM response delay ---
    const userMessageTimestamp = Date.now()

    if (useSimulatedResponses) {
      setTimeout(
        () => {
          const simulatedResponse = getSimulatedResponse()
          const assistantMessage = {
            id: `assistant_${Date.now()}`,
            role: "assistant" as const,
            content: simulatedResponse,
          }
          setMessages((prev) => [...prev, assistantMessage])
          setIsLoading(false)
          const assistantChatMessage: ChatMessage = { ...assistantMessage, roomId, timestamp: new Date() }
          const currentMsgs = loadMessagesFromStorage(roomId)
          saveMessagesToStorage(roomId, [...currentMsgs, assistantChatMessage])
          updateRoomActivity(roomId)
        },
        1500 + Math.random() * 1000,
      )
      return
    }

    try {
      const storedName = sessionStorage.getItem("userName") || "User"
      const storedAge = sessionStorage.getItem("userAge") || "Unknown"
      const storedSex = sessionStorage.getItem("userSex") || "Unknown" // From consent form
      const storedEducation = sessionStorage.getItem("userEducation") || "Unknown"
      const storedOccupation = sessionStorage.getItem("userOccupation") || "Unknown"

      const userTraits = {
        gender: storedSex, // API expects 'gender', using 'sex' from consent
        age: storedAge,
        education: storedEducation,
        employment: storedOccupation,
      }

      const requestBody = {
        messages: [...messages, userMessage], // Send all messages including the new one
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

      // console.log("[ChatPage] Sending to /api/chat:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      let responseText = ""
      try {
        responseText = await response.text() // Always get text first
      } catch (textError) {
        console.error("[ChatPage] Error reading response text:", textError)
        throw new Error(`API Error: ${response.status} ${response.statusText}. Failed to read response body.`)
      }

      if (!response.ok) {
        console.error(`[ChatPage] API Error: ${response.status} ${response.statusText}. Response body:`, responseText)
        let errorJson
        try {
          errorJson = JSON.parse(responseText)
        } catch (e) {
          /* ignore if not json */
        }
        throw new Error(
          errorJson?.error || `API request failed: ${response.statusText}. Raw: ${responseText.substring(0, 100)}...`,
        )
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("[ChatPage] Error parsing JSON response. Raw text:", responseText)
        const err = jsonError as Error
        throw new Error(
          `Failed to parse JSON response from API. Raw text started with: ${responseText.substring(0, 100)}... Error: ${err.message}`,
        )
      }

      // --- Calculate realistic delay before showing the LLM response ---
      // 1. Reading time (user message): 350 words/min = 5.83 words/sec
      // 2. Typing time (LLM response): 40 words/min = 0.67 words/sec
      // 3. Reflection: 0.5-2s random
      const getWordCount = (text: string) => (text ? text.trim().split(/\s+/).length : 0)
      const userWords = getWordCount(userMessage.content)
      const llmWords = getWordCount(data.content || "")
      const readingTime = userWords / (350 / 60) // seconds
      const typingTime = llmWords / (40 / 60) // seconds
      const reflectionTime = 0.5 + Math.random() * 1.5 // 0.5 to 2.0 seconds
      const totalDelay = readingTime + typingTime + reflectionTime

      // 4. Time since user sent message
      const now = Date.now()
      const elapsed = (now - userMessageTimestamp) / 1000 // seconds
      const remainingDelay = Math.max(0, totalDelay - elapsed)

      // 5. Wait for the remaining delay (if any)
      await new Promise((resolve) => setTimeout(resolve, remainingDelay * 1000))

      // --- Now show the LLM response ---
      const assistantMessage = {
        id: data.id || `assistant_${Date.now()}`,
        role: "assistant" as const,
        content: data.content || "I'm not sure how to respond to that.",
      }
      setMessages((prev) => [...prev, assistantMessage])

      const assistantChatMessage: ChatMessage = { ...assistantMessage, roomId, timestamp: new Date() }
      const currentMsgs = loadMessagesFromStorage(roomId)
      saveMessagesToStorage(roomId, [...currentMsgs, assistantChatMessage])
      updateRoomActivity(roomId)
    } catch (error) {
      const err = error as Error
      console.error("[ChatPage] Error in handleChatSubmit (fetching AI response):", err.message)
      setApiErrorCount((prevCount) => {
        const newCount = prevCount + 1
        if (newCount >= MAX_API_ERRORS) {
          console.warn(`[ChatPage] Max API errors (${MAX_API_ERRORS}) reached. Switching to simulated responses.`)
          setUseSimulatedResponses(true)
        }
        return newCount
      })

      const simulatedResponse = getSimulatedResponse()
      const fallbackMessage = {
        id: `assistant_fallback_${Date.now()}`,
        role: "assistant" as const,
        content: simulatedResponse,
      }
      setMessages((prev) => [...prev, fallbackMessage])
      const fallbackChatMessage: ChatMessage = { ...fallbackMessage, roomId, timestamp: new Date() }
      const currentMsgs = loadMessagesFromStorage(roomId)
      saveMessagesToStorage(roomId, [...currentMsgs, fallbackChatMessage])
      updateRoomActivity(roomId)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (roomType === "2v1") {
      setLoadingRoom(true);
      const userId = sessionStorage.getItem("userId") || `user_${Date.now()}`;
      const userName = sessionStorage.getItem("userName") || "User";
      fetch('/api/rooms/2v1/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName }),
      })
        .then(res => res.json())
        .then(({ room }) => {
          setRoom(room);
          setWaitingForUser(room.status === 'waiting');
        })
        .catch(() => setRoom(null))
        .finally(() => setLoadingRoom(false));
    }
  }, [roomType]);

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

  // Replace the old waiting UI with:
  if (roomType === "2v1" && loadingRoom) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Joining room...</div>
          </div>
        </div>
      </PageTransition>
    );
  }
  if (roomType === "2v1" && waitingForUser) {
    return (
      <PageTransition>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Waiting for another user to join...</div>
            <div className="text-muted-foreground">Share this page link with a friend to join the session.</div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex h-screen flex-col">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={toggleMobileSidebar}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
                aria-label="Toggle sidebar"
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
                {useSimulatedResponses && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 px-3 py-1 text-xs font-medium">
                    Simulation Mode
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {opinionTrackingData && opinionTrackingData.history.length > 1 && (
                <AnimatedButton variant="outline" size="sm" onClick={toggleOpinionTracker} className="gap-1.5">
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Opinion Tracker</span>
                </AnimatedButton>
              )}

              {isModerator && (
                <ModeratorControls
                  sessionStarted={sessionStarted}
                  sessionPaused={sessionPaused}
                  sessionEnded={sessionEnded}
                  sessionTime={sessionTime}
                  sessionTimeRemaining={sessionTimeRemaining}
                  messageCount={messages.filter((m) => m.role !== "system").length}
                  participantCount={roomMembers.length}
                  onPauseResume={handlePauseResume}
                  onEndSession={handleModeratorEndSession}
                  onAddTime={handleAddTime}
                  onRemoveTime={handleRemoveTime}
                />
              )}

              <motion.div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-300",
                  getTimerBgColor(sessionTimeRemaining),
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                data-highlight="timer"
              >
                {sessionPaused ? (
                  <Pause className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                ) : (
                  <Timer className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                )}
                <span className={cn("text-sm font-medium", getTimerColor(sessionTimeRemaining))}>
                  {sessionStarted ? formatTime(sessionTimeRemaining) : "15:00"}
                </span>
                {sessionPaused && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    Paused
                  </Badge>
                )}
              </motion.div>

              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={handleExitClick}
                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                data-highlight="exit"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Session</span>
              </AnimatedButton>

              <motion.div whileHover={{ rotate: 15 }} transition={{ duration: 0.2 }}>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          {/* Mobile Sidebar */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <motion.div
                className="absolute inset-0 z-20 bg-white md:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b p-4">
                    <h2 className="font-semibold">Session Details</h2>
                    <Button variant="ghost" size="icon" onClick={toggleMobileSidebar} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <Tabs defaultValue="members">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="info">Info</TabsTrigger>
                      </TabsList>
                      <TabsContent value="members" className="mt-4 space-y-4">
                        {roomMembers.map((member, index) => (
                          <motion.div
                            key={member.id}
                            className="flex items-center gap-3 rounded-lg border p-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                          >
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-white">
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                                  {getAvatarInitial(member.name)}
                                </div>
                              </Avatar>
                              <span
                                className={cn(
                                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                                  getStatusColor(member.status),
                                )}
                              ></span>
                            </div>
                            <div className="flex flex-col">
                              <div className="font-medium">{member.name}</div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground capitalize">
                                  {member.role.replace("-", " ")}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </TabsContent>
                      <TabsContent value="info" className="mt-4">
                        <FadeIn delay={0.1}>
                          <Card>
                            <CardContent className="p-4 text-sm">
                              <h3 className="mb-2 font-semibold">Current Topic</h3>
                              <p className="mb-4 text-muted-foreground">{sessionTitle}</p>

                              <h3 className="mb-2 font-semibold">Discussion Question</h3>
                              <p className="mb-4 text-muted-foreground">{sessionDescription}</p>

                              <h3 className="mb-2 font-semibold">Session Goal</h3>
                              <p className="mb-4 text-muted-foreground">
                                Engage in a thoughtful debate about this topic, considering different perspectives and
                                supporting your views with reasoning.
                              </p>

                              <h3 className="mb-2 font-semibold">Session Duration</h3>
                              <p className="text-muted-foreground">
                                This session will last exactly 15 minutes. Use this time to engage in meaningful
                                discussion.
                              </p>

                              {useSimulatedResponses && (
                                <>
                                  <h3 className="mb-2 mt-4 font-semibold text-amber-700">Simulation Notice</h3>
                                  <p className="text-amber-700">
                                    This session is running in simulation mode. The confederate responses are
                                    pre-programmed.
                                  </p>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </FadeIn>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar */}
          <motion.div
            className={cn(
              "hidden border-r bg-white transition-all duration-300 ease-in-out md:block",
              sidebarOpen ? "w-80" : "w-0",
            )}
            animate={{ width: sidebarOpen ? "20rem" : "0rem" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            data-highlight="sidebar"
          >
            <div className="flex h-full flex-col">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Session Details</h2>
                  <motion.button
                    onClick={toggleSidebar}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full p-1 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <Tabs defaultValue="members">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="members">
                      <Users className="mr-2 h-4 w-4" />
                      Members
                    </TabsTrigger>
                    <TabsTrigger value="info" data-highlight="info">
                      <Info className="mr-2 h-4 w-4" />
                      Info
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="members" className="mt-4 space-y-4">
                    {roomMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10 border-2 border-white">
                            <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                              {getAvatarInitial(member.name)}
                            </div>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                              getStatusColor(member.status),
                            )}
                          ></span>
                        </div>
                        <div className="flex flex-col">
                          <div className="font-medium">{member.name}</div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground capitalize">
                              {member.role.replace("-", " ")}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </TabsContent>
                  <TabsContent value="info" className="mt-4">
                    <FadeIn delay={0.1}>
                      <Card>
                        <CardContent className="p-4 text-sm">
                          <h3 className="mb-2 font-semibold">Current Topic</h3>
                          <p className="mb-4 text-muted-foreground">{sessionTitle}</p>

                          <h3 className="mb-2 font-semibold">Discussion Question</h3>
                          <p className="mb-4 text-muted-foreground">{sessionDescription}</p>

                          <h3 className="mb-2 font-semibold">Session Goal</h3>
                          <p className="mb-4 text-muted-foreground">
                            Engage in a thoughtful debate about this topic, considering different perspectives and
                            supporting your views with reasoning.
                          </p>

                          <h3 className="mb-2 font-semibold">Session Duration</h3>
                          <p className="mb-4 text-muted-foreground">
                            This session will last exactly 15 minutes. Use this time to engage in meaningful discussion.
                          </p>

                          {useSimulatedResponses && (
                            <>
                              <h3 className="mb-2 font-semibold text-amber-700">Simulation Notice</h3>
                              <p className="text-amber-700">
                                This session is running in simulation mode. The confederate responses are
                                pre-programmed.
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {opinionTrackingData && opinionTrackingData.history.length > 1 && (
                        <div className="mt-4">
                          <OpinionTrackerVisualization
                            trackingData={opinionTrackingData}
                            topicDisplayName={debateTopic ? topicDisplayNames[debateTopic] : "Topic"}
                          />
                        </div>
                      )}
                    </FadeIn>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>

          {/* Collapsed sidebar toggle */}
          <AnimatePresence>
            {!sidebarOpen && (
              <motion.button
                onClick={toggleSidebar}
                className="absolute left-0 top-4 hidden rounded-r-md border border-l-0 bg-white p-1.5 text-gray-500 shadow-sm hover:bg-gray-50 md:block"
                aria-label="Expand sidebar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                whileHover={{ x: 2 }}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Main chat area */}
          <div className="flex flex-1 flex-col bg-gray-50" data-highlight="chat-area">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mx-auto max-w-3xl space-y-6">
                <FadeIn>
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <h2 className="text-lg font-semibold">{sessionTitle}</h2>
                      <p className="text-sm text-muted-foreground">{sessionDescription}</p>
                      {sessionStarted && !sessionEnded && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          {sessionPaused ? (
                            <Pause className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                          ) : (
                            <Timer className={cn("h-4 w-4", getTimerColor(sessionTimeRemaining))} />
                          )}
                          <span className={cn("text-sm font-medium", getTimerColor(sessionTimeRemaining))}>
                            {formatTime(sessionTimeRemaining)} remaining
                            {sessionPaused && " (Paused)"}
                          </span>
                        </div>
                      )}
                      {!sessionStarted && (
                        <div className="mt-2 text-sm text-muted-foreground">Session will begin after onboarding</div>
                      )}
                      {sessionEnded && <div className="mt-2 text-sm font-medium text-red-600">Session has ended</div>}
                    </CardContent>
                  </Card>
                </FadeIn>

                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isUser = message.role === "user"
                    const isAssistant = message.role === "assistant"
                    const role = isAssistant ? "confederate" : message.role
                    const participant = roomMembers.find((p) => p.role === (isAssistant ? "confederate" : message.role))

                    return (
                      <MessageAnimation
                        key={message.id || index}
                        isUser={isUser}
                        delay={index * 0.05}
                        className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                      >
                        {!isUser && (
                          <div className="relative mt-1 flex-shrink-0">
                            <Avatar className="h-9 w-9 border-2 border-white">
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                                {message.role === "system"
                                  ? "M"
                                  : getAvatarInitial(
                                      isAssistant ? participant?.name || "Confederate" : participant?.name || role,
                                    )}
                              </div>
                            </Avatar>
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                                getStatusColor("active"),
                              )}
                            ></span>
                          </div>
                        )}

                        <div className={cn("flex max-w-[75%] flex-col", isUser ? "items-end" : "items-start")}>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">
                              {message.role === "system"
                                ? "Moderator"
                                : isAssistant
                                  ? participant?.name || "Confederate"
                                  : message.role === "user"
                                    ? userName
                                    : participant?.name || message.role}
                            </span>
                          </div>

                          <motion.div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                              isUser
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : message.role === "system"
                                  ? "rounded-tl-sm bg-blue-50 text-blue-700 border border-blue-200" // Example style for system/moderator messages
                                  : "rounded-tl-sm bg-white text-foreground",
                            )}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {message.content}
                          </motion.div>

                          <span className="mt-1 text-xs text-muted-foreground">{getCurrentTime()}</span>
                        </div>

                        {isUser && (
                          <div className="relative mt-1 flex-shrink-0">
                            <Avatar className="h-9 w-9 border-2 border-white">
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                                {getAvatarInitial(userName)}
                              </div>
                            </Avatar>
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                                getStatusColor("active"),
                              )}
                            ></span>
                          </div>
                        )}
                      </MessageAnimation>
                    )
                  })}
                  {isLoading && sessionStarted && !sessionEnded && !sessionPaused && (
                    <MessageAnimation delay={0.1}>
                      <div className="flex gap-3">
                        <div className="relative mt-1 flex-shrink-0">
                          <Avatar className="h-9 w-9 border-2 border-white">
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                              {roomMembers.find((m) => m.role === "confederate")?.name?.[0] || "C"}
                            </div>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"></span>
                        </div>
                        <div className="flex max-w-[75%] flex-col items-start">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {roomMembers.find((m) => m.role === "confederate")?.name || "Confederate"}
                            </span>
                          </div>
                          <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm shadow-sm">
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
                              >
                                <Loader2 className="h-4 w-4 text-muted-foreground" />
                              </motion.div>
                              <span className="text-muted-foreground">Typing...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </MessageAnimation>
                  )}

                  {useSimulatedResponses &&
                    messages.length > 0 &&
                    sessionStarted &&
                    !sessionEnded &&
                    !sessionPaused && (
                      <FadeIn>
                        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
                          <div className="flex items-start">
                            <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="mb-2 font-medium">Simulation Mode Active</p>
                              <p>
                                This session is running in simulation mode due to AI service unavailability. The
                                confederate is responding with pre-programmed messages.
                              </p>
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            <motion.div
              className="border-t bg-white p-4 shadow-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <form onSubmit={handleChatSubmit} className="mx-auto max-w-3xl">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder={
                      !sessionStarted
                        ? "Session will begin after onboarding..."
                        : sessionPaused
                          ? "Session is paused..."
                          : sessionEnded
                            ? "Session has ended"
                            : "Type your message..."
                    }
                    disabled={isLoading || !sessionStarted || sessionEnded || sessionPaused}
                    className="flex-1 border-muted-foreground/20 bg-gray-50 py-6 text-base shadow-sm focus-visible:ring-primary/50 transition-all duration-200"
                  />
                  <AnimatedButton
                    type="submit"
                    disabled={isLoading || !input.trim() || !sessionStarted || sessionEnded || sessionPaused}
                    className="h-auto gap-2 px-5 py-3 shadow-sm"
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
            </motion.div>
          </div>
        </div>

        <ConfirmationDialog
          isOpen={exitDialogOpen}
          onClose={handleExitCancel}
          onConfirm={handleExitConfirm}
          title="Exit Session"
          description="Are you sure you want to leave this session? We'd appreciate your feedback before you go."
          confirmText="Yes, Exit Session"
          cancelText="No, Stay in Session"
        />

        {showTraining && <OnboardingTraining onComplete={handleTrainingComplete} />}

        {showOpinionPoll && debateTopic && opinionTrackingData && sessionStarted && !sessionEnded && !sessionPaused && (
          <OpinionPoll
            topic={debateTopic}
            topicDisplayName={topicDisplayNames[debateTopic]}
            initialValue={opinionTrackingData.currentOpinion.value}
            onSubmit={handleOpinionUpdate}
            onDismiss={() => setShowOpinionPoll(false)}
          />
        )}

        {showExitSurvey && (
          <PostSurvey
            isOpen={showExitSurvey}
            onClose={handleSurveyClose}
            onSubmit={handleSurveySubmit}
            sessionDuration={sessionTime}
          />
        )}

        {showSurveyThankYou && <SurveyThankYou onClose={handleThankYouClose} />}

        <AnimatePresence>
          {showOpinionTracker && opinionTrackingData && debateTopic && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Opinion Tracking</h2>
                      <Button variant="ghost" size="icon" onClick={toggleOpinionTracker}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <OpinionTrackerVisualization
                      trackingData={opinionTrackingData}
                      topicDisplayName={topicDisplayNames[debateTopic]}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
