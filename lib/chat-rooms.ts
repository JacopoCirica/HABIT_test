// Chat room management utilities
export interface ChatRoom {
  id: string
  userId: string
  userName: string
  createdAt: Date
  lastActivity: Date
  sessionStarted: boolean
  sessionEnded: boolean
  sessionPaused: boolean
  sessionTime: number
  sessionTimeRemaining: number
  debateTopic: string | null
  userOpinions: Record<string, any>
  timeAdjustments: Array<{ type: "add" | "remove"; minutes: number; timestamp: number }>
  moderatorPresent: boolean
}

export interface ChatMessage {
  id: string
  roomId: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Generate a unique room ID
export function generateRoomId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `room_${timestamp}_${randomStr}`
}

// Create a new chat room
export function createChatRoom(userId: string, userName: string, userOpinions: Record<string, any>): ChatRoom {
  return {
    id: generateRoomId(),
    userId,
    userName,
    createdAt: new Date(),
    lastActivity: new Date(),
    sessionStarted: false,
    sessionEnded: false,
    sessionPaused: false,
    sessionTime: 0,
    sessionTimeRemaining: 15 * 60, // 15 minutes
    debateTopic: null,
    userOpinions,
    timeAdjustments: [],
    moderatorPresent: false,
  }
}

// Save room to localStorage
export function saveRoomToStorage(room: ChatRoom): void {
  try {
    localStorage.setItem(`chatRoom_${room.id}`, JSON.stringify(room))
    localStorage.setItem("currentRoomId", room.id)
  } catch (error) {
    console.error("Error saving room to storage:", error)
  }
}

// Load room from localStorage
export function loadRoomFromStorage(roomId: string): ChatRoom | null {
  try {
    const roomData = localStorage.getItem(`chatRoom_${roomId}`)
    if (!roomData) return null

    const room = JSON.parse(roomData)
    // Convert date strings back to Date objects
    room.createdAt = new Date(room.createdAt)
    room.lastActivity = new Date(room.lastActivity)

    return room
  } catch (error) {
    console.error("Error loading room from storage:", error)
    return null
  }
}

// Get current room ID
export function getCurrentRoomId(): string | null {
  try {
    return localStorage.getItem("currentRoomId")
  } catch (error) {
    console.error("Error getting current room ID:", error)
    return null
  }
}

// Save messages to localStorage
export function saveMessagesToStorage(roomId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages))
  } catch (error) {
    console.error("Error saving messages to storage:", error)
  }
}

// Load messages from localStorage
export function loadMessagesFromStorage(roomId: string): ChatMessage[] {
  try {
    const messagesData = localStorage.getItem(`messages_${roomId}`)
    if (!messagesData) return []

    const messages = JSON.parse(messagesData)
    // Convert timestamp strings back to Date objects
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))
  } catch (error) {
    console.error("Error loading messages from storage:", error)
    return []
  }
}

// Update room activity
export function updateRoomActivity(roomId: string): void {
  const room = loadRoomFromStorage(roomId)
  if (room) {
    room.lastActivity = new Date()
    saveRoomToStorage(room)
  }
}

// Clean up old rooms (optional - for storage management)
export function cleanupOldRooms(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
  try {
    const now = Date.now()
    const keys = Object.keys(localStorage)

    keys.forEach((key) => {
      if (key.startsWith("chatRoom_")) {
        const roomData = localStorage.getItem(key)
        if (roomData) {
          const room = JSON.parse(roomData)
          const roomAge = now - new Date(room.lastActivity).getTime()

          if (roomAge > maxAge) {
            const roomId = room.id
            localStorage.removeItem(key)
            localStorage.removeItem(`messages_${roomId}`)
          }
        }
      }
    })
  } catch (error) {
    console.error("Error cleaning up old rooms:", error)
  }
}
