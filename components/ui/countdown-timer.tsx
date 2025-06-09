"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  expiryTime: number // Timestamp in milliseconds when the code expires
  onExpire?: () => void
  className?: string
}

export function CountdownTimer({ expiryTime, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = expiryTime - Date.now()

      if (difference <= 0) {
        setTimeLeft(0)
        onExpire?.()
        return
      }

      setTimeLeft(difference)

      // Set warning state when less than 1 minute remains
      setIsWarning(difference < 60000)
    }

    // Calculate immediately
    calculateTimeLeft()

    // Then update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [expiryTime, onExpire])

  // Format time left as mm:ss
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage (from 100% to 0%)
  const calculateProgress = () => {
    // Assuming code expires in 10 minutes (600000 ms)
    const totalDuration = 10 * 60 * 1000
    const progress = (timeLeft / totalDuration) * 100
    return Math.max(0, Math.min(100, progress))
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-5 w-5">
        <Clock className={cn("h-5 w-5", isWarning ? "text-amber-500" : "text-muted-foreground")} />
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isWarning ? [0.5, 1, 0.5] : 0 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
        >
          <Clock className="h-5 w-5 text-amber-500" />
        </motion.div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", isWarning ? "text-amber-500" : "text-muted-foreground")}>
            {timeLeft > 0 ? `Expires in ${formatTimeLeft()}` : "Code expired"}
          </span>
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full rounded-full", isWarning ? "bg-amber-500" : "bg-primary")}
            initial={{ width: "100%" }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  )
}
