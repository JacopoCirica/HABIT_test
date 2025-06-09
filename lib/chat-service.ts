import type { Message } from "ai"

// Types for our chat service
export type Participant = {
  id: string
  role: "user" | "confederate" | "moderator" | "moderator-assistant"
  name: string
  status: "active" | "idle" | "offline"
  isAI: boolean
}

export type SessionInfo = {
  id: string
  phase: string
  title: string
  description: string
  duration: number // in minutes
  startTime: Date
}

// Mock data for the current session
export const currentSession: SessionInfo = {
  id: "session_12345",
  phase: "topic-discussion",
  title: "Opinion Debate",
  description: "Discuss and debate topics where you have strong opinions.",
  duration: 30,
  startTime: new Date(),
}

// Mock participants data
export const participants: Participant[] = [
  { id: "user_1", role: "user", name: "User", status: "active", isAI: false },
  { id: "confederate_1", role: "confederate", name: "Confederate", status: "active", isAI: true },
  { id: "moderator_1", role: "moderator", name: "Moderator", status: "idle", isAI: false },
]

// Function to get participant by role
export function getParticipantByRole(role: string): Participant | undefined {
  return participants.find((p) => p.role === role)
}

// Function to convert AI SDK messages to our internal format
export function formatMessage(message: Message): {
  id: string
  role: string
  content: string
  timestamp: Date
  sender: Participant
} {
  // Map the AI SDK role to our participant role
  const role = message.role === "assistant" ? "confederate" : message.role
  const sender = getParticipantByRole(role) || participants[0]

  return {
    id: `msg_${Math.random().toString(36).substring(2, 9)}`,
    role: message.role,
    content: message.content,
    timestamp: new Date(),
    sender,
  }
}

// Initial messages for the chat - only include system message, let the AI start the conversation
export const initialMessages: Message[] = [
  {
    id: "system_1",
    role: "system",
    content:
      "You are a confederate in the HABIT research platform. Start the conversation by directly addressing the user's strongest opinion topic.",
  },
]
