"use client"

import { useRef } from "react"
import { motion } from "framer-motion"

interface ConfettiParticle {
  id: number
  x: number
  y: number
  size: number
  color: string
  rotation: number
  delay: number
}

interface ConfettiAnimationProps {
  count?: number
}

export function ConfettiAnimation({ count = 100 }: ConfettiAnimationProps) {
  const colors = ["#FFC700", "#FF0066", "#2563EB", "#10B981", "#8B5CF6"]
  const particles = useRef<ConfettiParticle[]>([])

  // Generate particles only once
  if (particles.current.length === 0) {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 10,
        size: 5 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3,
      })
    }
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.current.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
            rotate: `${particle.rotation}deg`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
            top: ["0%", "100%"],
            rotate: [`${particle.rotation}deg`, `${particle.rotation + 360 * (Math.random() > 0.5 ? 1 : -1)}deg`],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: particle.delay,
            ease: [0.23, 0.44, 0.34, 0.99],
          }}
        />
      ))}
    </div>
  )
}
