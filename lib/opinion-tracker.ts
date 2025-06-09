import type { OpinionTopic } from "./opinion-analyzer"

export interface OpinionSnapshot {
  topic: OpinionTopic
  value: number
  timestamp: number
  reason?: string
}

export interface OpinionTrackingData {
  initialOpinion: OpinionSnapshot
  currentOpinion: OpinionSnapshot
  history: OpinionSnapshot[]
  hasChanged: boolean
  changeDirection: "stronger" | "weaker" | "reversed" | "none"
  changeMagnitude: number
}

// Initialize opinion tracking for a topic
export function initializeOpinionTracking(topic: OpinionTopic, initialValue: number): OpinionTrackingData {
  const initialSnapshot: OpinionSnapshot = {
    topic,
    value: initialValue,
    timestamp: Date.now(),
  }

  return {
    initialOpinion: initialSnapshot,
    currentOpinion: initialSnapshot,
    history: [initialSnapshot],
    hasChanged: false,
    changeDirection: "none",
    changeMagnitude: 0,
  }
}

// Record a new opinion value
export function recordOpinionChange(
  trackingData: OpinionTrackingData,
  newValue: number,
  reason?: string,
): OpinionTrackingData {
  // Create new snapshot
  const newSnapshot: OpinionSnapshot = {
    topic: trackingData.initialOpinion.topic,
    value: newValue,
    timestamp: Date.now(),
    reason,
  }

  // Calculate change metrics
  const initialValue = trackingData.initialOpinion.value
  const hasChanged = newValue !== initialValue
  const changeMagnitude = Math.abs(newValue - initialValue)

  // Determine change direction
  let changeDirection: "stronger" | "weaker" | "reversed" | "none" = "none"

  if (hasChanged) {
    // Check if opinion reversed (crossed the neutral point 4)
    const initialPosition = initialValue < 4 ? "disagree" : initialValue > 4 ? "agree" : "neutral"
    const newPosition = newValue < 4 ? "disagree" : newValue > 4 ? "agree" : "neutral"

    if (initialPosition !== "neutral" && newPosition !== "neutral" && initialPosition !== newPosition) {
      changeDirection = "reversed"
    } else {
      // Check if opinion became stronger or weaker
      const initialDistance = Math.abs(initialValue - 4)
      const newDistance = Math.abs(newValue - 4)

      if (newDistance > initialDistance) {
        changeDirection = "stronger"
      } else if (newDistance < initialDistance) {
        changeDirection = "weaker"
      }
    }
  }

  // Update tracking data
  return {
    ...trackingData,
    currentOpinion: newSnapshot,
    history: [...trackingData.history, newSnapshot],
    hasChanged,
    changeDirection,
    changeMagnitude,
  }
}

// Get a summary of opinion changes
export function getOpinionChangeSummary(trackingData: OpinionTrackingData): string {
  const { initialOpinion, currentOpinion, hasChanged, changeDirection, changeMagnitude } = trackingData

  if (!hasChanged) {
    return "Opinion has remained consistent throughout the conversation."
  }

  let summary = ""

  switch (changeDirection) {
    case "stronger":
      summary = `Opinion has strengthened from ${initialOpinion.value} to ${currentOpinion.value} (${changeMagnitude} points).`
      break
    case "weaker":
      summary = `Opinion has moderated from ${initialOpinion.value} to ${currentOpinion.value} (${changeMagnitude} points).`
      break
    case "reversed":
      summary = `Opinion has reversed from ${initialOpinion.value} to ${currentOpinion.value} (${changeMagnitude} points).`
      break
    default:
      summary = `Opinion has shifted from ${initialOpinion.value} to ${currentOpinion.value}.`
  }

  return summary
}
