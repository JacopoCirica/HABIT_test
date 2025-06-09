"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface StaggeredListProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggeredList({ children, staggerDelay = 0.1, className = "" }: StaggeredListProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  )
}

interface StaggeredItemProps {
  children: ReactNode
  className?: string
}

export function StaggeredItem({ children, className = "" }: StaggeredItemProps) {
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}
