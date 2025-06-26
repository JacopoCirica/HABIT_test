// Define the opinion topics from the demographics survey
export type OpinionTopic = "vaccination" | "climateChange" | "immigration" | "gunControl" | "universalHealthcare"

export interface UserOpinions {
  [key: string]: string // The values are strings because they come from form inputs
}

export interface TopicAnalysis {
  topic: OpinionTopic
  displayName: string
  score: number // How extreme (0-3)
  oppositionScore: number // How opposed (0-3 where 3 is most opposed)
  agreementScore: number // How much in agreement (0-3 where 3 is most in agreement)
  rawValue: number // The original 1-7 value
  isExtreme: boolean
  position: "agree" | "disagree" | "neutral"
  description: string
}

// Map internal topic keys to human-readable names
export const topicDisplayNames: Record<OpinionTopic, string> = {
  vaccination: "Vaccination Safety and Efficacy",
  climateChange: "Climate Change as a Serious Threat",
  immigration: "Immigration Benefits to Society",
  gunControl: "Gun Control and Violence Reduction",
  universalHealthcare: "Universal Healthcare Access",
}

// Map opinion topics to chat topic keys
export const opinionToChatTopicMap: Record<OpinionTopic, string> = {
  vaccination: "vaccination-policy",
  climateChange: "climate-change-policy", 
  immigration: "immigration-policy",
  gunControl: "gun-control-policy",
  universalHealthcare: "healthcare-system-reform",
}

// Map chat topic keys to display names for chat interface
export const chatTopicDisplayNames: Record<string, string> = {
  "vaccination-policy": "Vaccination Policy",
  "climate-change-policy": "Climate Change Policy",
  "immigration-policy": "Immigration Policy", 
  "gun-control-policy": "Gun Control Policy",
  "healthcare-system-reform": "Healthcare System Reform",
  // Keep existing fallback topics
  "social-media-regulation": "Social Media Regulation",
  "universal-basic-income": "Universal Basic Income",
  "artificial-intelligence-ethics": "Artificial Intelligence Ethics",
}

// Map topics to their corresponding statements from the survey
const topicStatements: Record<OpinionTopic, string> = {
  vaccination: "Vaccines are safe and effective for most people.",
  climateChange: "Climate change is a serious threat that requires immediate action.",
  immigration: "Immigration generally benefits the receiving country's economy and culture.",
  gunControl: "Stricter gun control laws would reduce violence in society.",
  universalHealthcare: "Universal healthcare should be available to all citizens.",
}

// Map topics to debate framing
export const topicDebateFraming: Record<OpinionTopic, string> = {
  vaccination: "Should vaccination be mandatory for public school attendance?",
  climateChange: "Should governments prioritize immediate climate action over economic growth?",
  immigration: "Should immigration policies be more open or more restrictive?",
  gunControl: "Should there be stricter regulations on gun ownership?",
  universalHealthcare: "Should healthcare be provided as a universal right by the government?",
}

/**
 * Analyzes user opinions to find topics with extreme positions
 */
export function analyzeUserOpinions(opinions: UserOpinions): TopicAnalysis[] {
  const results: TopicAnalysis[] = []

  // Process each opinion topic
  ;(Object.keys(opinions) as OpinionTopic[]).forEach((topic) => {
    // Convert opinion value to number (1-7 scale)
    const value = Number.parseInt(opinions[topic], 10)

    if (isNaN(value)) return

    // Calculate how extreme the position is (distance from neutral position 4)
    // This gives us a score from 0-3, where 3 is most extreme
    const extremeScore = Math.abs(value - 4)

    // Calculate opposition score (how close to 1)
    // 1 -> 3, 2 -> 2, 3 -> 1, 4 -> 0, 5-7 -> 0
    const oppositionScore = value < 4 ? 4 - value : 0

    // Calculate agreement score (how close to 7)
    // 7 -> 3, 6 -> 2, 5 -> 1, 4 -> 0, 1-3 -> 0
    const agreementScore = value > 4 ? value - 4 : 0

    // Determine if the user agrees or disagrees with the statement
    let position: "agree" | "disagree" | "neutral" = "neutral"
    if (value > 4) position = "agree"
    if (value < 4) position = "disagree"

    // Create a description of the user's position
    let description = ""
    if (value >= 6) {
      description = `strongly agrees that ${topicStatements[topic]}`
    } else if (value === 5) {
      description = `somewhat agrees that ${topicStatements[topic]}`
    } else if (value === 4) {
      description = `is neutral on whether ${topicStatements[topic]}`
    } else if (value === 3) {
      description = `somewhat disagrees that ${topicStatements[topic]}`
    } else if (value <= 2) {
      description = `strongly disagrees that ${topicStatements[topic]}`
    }

    results.push({
      topic,
      displayName: topicDisplayNames[topic],
      score: extremeScore,
      oppositionScore,
      agreementScore,
      rawValue: value,
      isExtreme: extremeScore >= 2, // Consider scores of 2-3 as extreme
      position,
      description,
    })
  })

  return results
}

/**
 * Gets topics where the user has extreme positions
 */
export function getExtremeTopics(opinions: UserOpinions): TopicAnalysis[] {
  const analyzed = analyzeUserOpinions(opinions)
  return analyzed.filter((topic) => topic.isExtreme)
}

/**
 * Gets the topic to debate based on the specified criteria:
 * 1. Choose the topic where the user has the most extreme position (values closest to 1 or 7)
 * 2. If there are multiple topics with equally extreme positions, choose the one where the user is most opposed
 * 3. If still tied, randomly choose one of the topics with the strongest positions
 */
export function getTopicToDebate(opinions: UserOpinions): TopicAnalysis | null {
  const analyzed = analyzeUserOpinions(opinions)
  if (analyzed.length === 0) return null

  // Sort by extremeness (most extreme first)
  const sortedByExtremeness = [...analyzed].sort((a, b) => {
    // First prioritize by how extreme the opinion is (distance from 4)
    const extremeDiff = b.score - a.score
    if (extremeDiff !== 0) return extremeDiff

    // If equally extreme, prioritize the most extreme values (1 or 7)
    const aDistanceFromExtreme = Math.min(Math.abs(a.rawValue - 1), Math.abs(a.rawValue - 7))
    const bDistanceFromExtreme = Math.min(Math.abs(b.rawValue - 1), Math.abs(b.rawValue - 7))
    return aDistanceFromExtreme - bDistanceFromExtreme
  })

  // Get the highest extremeness score
  const highestScore = sortedByExtremeness[0].score

  // Filter to only include topics with the highest extremeness score
  const mostExtreme = sortedByExtremeness.filter((topic) => topic.score === highestScore)

  if (mostExtreme.length === 1) {
    // If there's only one most extreme topic, return it
    return mostExtreme[0]
  } else {
    // If there are multiple topics with the same extremeness, prefer opposition
    const withOpposition = [...mostExtreme].sort((a, b) => b.oppositionScore - a.oppositionScore)

    if (withOpposition[0].oppositionScore > 0) {
      // If there's at least one topic where the user is opposed, return the most opposed
      return withOpposition[0]
    } else {
      // Otherwise, randomly choose one of the most extreme topics
      return mostExtreme[Math.floor(Math.random() * mostExtreme.length)]
    }
  }
}

/**
 * Gets the chat topic key based on user's most extreme opinion from demographics
 */
export function getChatTopicFromOpinions(): string {
  try {
    // Get user opinions from session storage
    const opinionsStr = sessionStorage.getItem("userOpinions")
    if (!opinionsStr) {
      console.log("No user opinions found, using default topic")
      return "social-media-regulation" // Fallback to default
    }

    const opinions: UserOpinions = JSON.parse(opinionsStr)
    const selectedTopic = getTopicToDebate(opinions)
    
    if (!selectedTopic) {
      console.log("No extreme topic found, using default topic")
      return "social-media-regulation" // Fallback to default
    }

    const chatTopicKey = opinionToChatTopicMap[selectedTopic.topic]
    console.log(`Selected debate topic: ${selectedTopic.topic} (${selectedTopic.displayName}) -> ${chatTopicKey}`)
    console.log(`User position: ${selectedTopic.position} (${selectedTopic.rawValue}/7)`)
    
    return chatTopicKey
  } catch (error) {
    console.error("Error getting chat topic from opinions:", error)
    return "social-media-regulation" // Fallback to default
  }
}
