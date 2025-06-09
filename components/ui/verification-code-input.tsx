"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface VerificationCodeInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function VerificationCodeInput({ length = 6, value, onChange, disabled = false }: VerificationCodeInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize the array of refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Focus the first empty input or the last input
  useEffect(() => {
    if (!disabled) {
      const firstEmptyIndex = value.split("").findIndex((v, i) => !v)
      const indexToFocus = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex
      inputRefs.current[indexToFocus]?.focus()
    }
  }, [disabled, length, value])

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newChar = e.target.value.slice(-1)
    if (newChar && !/^\d$/.test(newChar)) return // Only allow digits

    const newValue = value.split("")
    newValue[index] = newChar
    onChange(newValue.join(""))

    // Auto-advance to next input
    if (newChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      // If current input is empty and backspace is pressed, focus previous input
      inputRefs.current[index - 1]?.focus()

      // Also clear the previous input
      const newValue = value.split("")
      newValue[index - 1] = ""
      onChange(newValue.join(""))
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()
    if (!pastedData) return

    // Extract only digits from pasted content
    const digits = pastedData.replace(/\D/g, "").slice(0, length)
    if (digits) {
      const newValue = digits.padEnd(value.length, value.slice(digits.length)).slice(0, length)
      onChange(newValue)
    }
  }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          whileTap={{ scale: 0.95 }}
        >
          <Input
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            disabled={disabled}
            className={cn(
              "h-14 w-12 text-center text-xl font-medium transition-all duration-200 sm:h-16 sm:w-14",
              focusedIndex === index && "border-primary ring-2 ring-primary/20",
            )}
          />
        </motion.div>
      ))}
    </div>
  )
}
