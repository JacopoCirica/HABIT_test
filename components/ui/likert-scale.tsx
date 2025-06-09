"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface LikertScaleProps {
  question: string
  id: string
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  className?: string
}

export function LikertScale({
  question,
  id,
  value,
  onChange,
  min = 1,
  max = 7,
  minLabel = "Strongly Disagree",
  maxLabel = "Strongly Agree",
  className,
}: LikertScaleProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)

  // Generate array of options from min to max
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className={cn("space-y-3", className)}>
      <Label htmlFor={id} className="block text-sm font-medium">
        {question}
      </Label>

      <RadioGroup id={id} value={value} onValueChange={onChange} className="flex flex-col space-y-3">
        <div className="grid w-full grid-cols-7 gap-1">
          {options.map((option, index) => (
            <div
              key={option}
              className="flex flex-col items-center"
              onMouseEnter={() => setHoveredValue(option)}
              onMouseLeave={() => setHoveredValue(null)}
            >
              <motion.div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                  value === option.toString() && "border-primary bg-primary/10",
                  hoveredValue === option && "border-primary/70 bg-primary/5",
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RadioGroupItem value={option.toString()} id={`${id}-${option}`} className="sr-only" />
                <Label
                  htmlFor={`${id}-${option}`}
                  className={cn(
                    "flex h-full w-full cursor-pointer items-center justify-center rounded-full text-sm font-medium",
                    value === option.toString() && "text-primary",
                  )}
                >
                  {option}
                </Label>
              </motion.div>

              {/* Show labels only for the first and last options */}
              {index === 0 && <span className="mt-2 text-center text-xs text-muted-foreground">{minLabel}</span>}
              {index === options.length - 1 && (
                <span className="mt-2 text-center text-xs text-muted-foreground">{maxLabel}</span>
              )}
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}
