"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface MessageAnimationProps {
  children: ReactNode
  isUser?: boolean
  delay?: number
  className?: string
}

export function MessageAnimation({ children, isUser = false, delay = 0, className = "" }: MessageAnimationProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: isUser ? 20 : -20,
        y: 10,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      transition={{
        duration: 0.3,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
