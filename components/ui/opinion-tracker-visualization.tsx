"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown, TrendingUp, RefreshCw } from "lucide-react"
import type { OpinionTrackingData } from "@/lib/opinion-tracker"

interface OpinionTrackerVisualizationProps {
  trackingData: OpinionTrackingData
  topicDisplayName: string
}

export function OpinionTrackerVisualization({ trackingData, topicDisplayName }: OpinionTrackerVisualizationProps) {
  const { initialOpinion, currentOpinion, history, hasChanged, changeDirection, changeMagnitude } = trackingData
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw the opinion timeline
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw neutral line (4)
    const neutralY = rect.height / 2
    ctx.beginPath()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = "#d1d5db" // gray-300
    ctx.moveTo(0, neutralY)
    ctx.lineTo(rect.width, neutralY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw opinion line
    if (history.length > 1) {
      const timeRange = history[history.length - 1].timestamp - history[0].timestamp
      const valueRange = 6 // From 1 to 7

      ctx.beginPath()
      ctx.lineWidth = 3
      ctx.strokeStyle = "#3b82f6" // blue-500

      history.forEach((snapshot, index) => {
        const x = index === 0 ? 0 : ((snapshot.timestamp - history[0].timestamp) / timeRange) * rect.width
        // Map 1-7 to canvas height (7 at top, 1 at bottom)
        const y = rect.height - ((snapshot.value - 1) / valueRange) * rect.height

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Draw points
      history.forEach((snapshot, index) => {
        const x = index === 0 ? 0 : ((snapshot.timestamp - history[0].timestamp) / timeRange) * rect.width
        const y = rect.height - ((snapshot.value - 1) / valueRange) * rect.height

        ctx.beginPath()
        ctx.fillStyle = index === 0 || index === history.length - 1 ? "#1e40af" : "#93c5fd"
        ctx.arc(x, y, index === 0 || index === history.length - 1 ? 6 : 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Add labels
    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#6b7280" // gray-500
    ctx.textAlign = "left"
    ctx.fillText("Strongly Agree (7)", 10, 20)
    ctx.textAlign = "left"
    ctx.fillText("Neutral (4)", 10, neutralY - 10)
    ctx.textAlign = "left"
    ctx.fillText("Strongly Disagree (1)", 10, rect.height - 10)
  }, [history])

  // Get change icon
  const getChangeIcon = () => {
    switch (changeDirection) {
      case "stronger":
        return <TrendingUp className="h-5 w-5 text-amber-500" />
      case "weaker":
        return <TrendingDown className="h-5 w-5 text-blue-500" />
      case "reversed":
        return <RefreshCw className="h-5 w-5 text-purple-500" />
      default:
        return null
    }
  }

  // Get change badge
  const getChangeBadge = () => {
    switch (changeDirection) {
      case "stronger":
        return <Badge className="bg-amber-500">Stronger Opinion</Badge>
      case "weaker":
        return <Badge className="bg-blue-500">Moderated Opinion</Badge>
      case "reversed":
        return <Badge className="bg-purple-500">Reversed Opinion</Badge>
      default:
        return <Badge className="bg-green-500">Consistent Opinion</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="border-b bg-muted/50 pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Opinion Tracking: {topicDisplayName}</span>
          {getChangeBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Initial Opinion</span>
              <span className="text-2xl font-bold">{initialOpinion.value}</span>
            </div>

            {hasChanged && (
              <div className="flex items-center text-muted-foreground">
                {getChangeIcon()}
                <ArrowRight className="h-4 w-4 mx-2" />
              </div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">Current Opinion</span>
              <span className="text-2xl font-bold">{currentOpinion.value}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium">Opinion Timeline</h4>
          <div className="relative h-[150px] w-full">
            <canvas ref={canvasRef} className="h-full w-full" />
          </div>
        </div>

        {currentOpinion.reason && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium">User Explanation</h4>
            <div className="rounded-md bg-muted p-3 text-sm">{currentOpinion.reason}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
