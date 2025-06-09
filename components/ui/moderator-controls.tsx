"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Shield, Play, Pause, Square, Clock, Plus, Minus, Users, MessageSquare, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ModeratorControlsProps {
  sessionStarted: boolean
  sessionPaused: boolean
  sessionEnded: boolean
  sessionTime: number
  sessionTimeRemaining: number
  messageCount: number
  participantCount: number
  onPauseResume: () => void
  onEndSession: () => void
  onAddTime: (minutes: number) => void
  onRemoveTime: (minutes: number) => void
}

export function ModeratorControls({
  sessionStarted,
  sessionPaused,
  sessionEnded,
  sessionTime,
  sessionTimeRemaining,
  messageCount,
  participantCount,
  onPauseResume,
  onEndSession,
  onAddTime,
  onRemoveTime,
}: ModeratorControlsProps) {
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showTimeDialog, setShowTimeDialog] = useState(false)
  const [timeAction, setTimeAction] = useState<{ type: "add" | "remove"; minutes: number } | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getSessionStatus = () => {
    if (sessionEnded) return { text: "Ended", color: "bg-red-500" }
    if (!sessionStarted) return { text: "Waiting", color: "bg-gray-500" }
    if (sessionPaused) return { text: "Paused", color: "bg-yellow-500" }
    return { text: "Active", color: "bg-green-500" }
  }

  const handleTimeAdjustment = (type: "add" | "remove", minutes: number) => {
    const remainingMinutes = Math.floor(sessionTimeRemaining / 60)

    if (type === "remove" && remainingMinutes <= minutes) {
      setTimeAction({ type, minutes })
      setShowTimeDialog(true)
      return
    }

    if (type === "add") {
      onAddTime(minutes)
    } else {
      onRemoveTime(minutes)
    }
  }

  const confirmTimeAdjustment = () => {
    if (timeAction) {
      if (timeAction.type === "add") {
        onAddTime(timeAction.minutes)
      } else {
        onRemoveTime(timeAction.minutes)
      }
      setTimeAction(null)
      setShowTimeDialog(false)
    }
  }

  const status = getSessionStatus()

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Moderator</span>
              <div className={cn("h-2 w-2 rounded-full", status.color)}></div>
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Moderator Controls</h3>
                  <Badge variant="outline" className="gap-1">
                    <div className={cn("h-2 w-2 rounded-full", status.color)}></div>
                    {status.text}
                  </Badge>
                </div>

                {/* Session Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formatTime(sessionTime)}</div>
                      <div className="text-xs text-muted-foreground">Elapsed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formatTime(sessionTimeRemaining)}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{messageCount}</div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{participantCount}</div>
                      <div className="text-xs text-muted-foreground">Participants</div>
                    </div>
                  </div>
                </div>

                {/* Primary Controls */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={onPauseResume}
                      disabled={!sessionStarted || sessionEnded}
                      variant={sessionPaused ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                    >
                      {sessionPaused ? (
                        <>
                          <Play className="h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowEndDialog(true)}
                      disabled={!sessionStarted || sessionEnded}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      End
                    </Button>
                  </div>
                </div>

                {/* Time Adjustments */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Time Adjustments</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!sessionStarted || sessionEnded}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Time
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleTimeAdjustment("add", 1)}>Add 1 minute</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTimeAdjustment("add", 5)}>
                          Add 5 minutes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!sessionStarted || sessionEnded || sessionTimeRemaining <= 60}
                          className="gap-2"
                        >
                          <Minus className="h-4 w-4" />
                          Remove Time
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleTimeAdjustment("remove", 1)}
                          disabled={sessionTimeRemaining <= 60}
                        >
                          Remove 1 minute
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTimeAdjustment("remove", 5)}
                          disabled={sessionTimeRemaining <= 300}
                        >
                          Remove 5 minutes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Warning */}
                <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Research Note:</strong> All moderator actions are logged for research integrity. Time
                      adjustments may affect data analysis.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* End Session Confirmation */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this session? This action cannot be undone and will immediately terminate the
              conversation for all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onEndSession} className="bg-red-600 hover:bg-red-700">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Adjustment Warning */}
      <AlertDialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Time Adjustment Warning</AlertDialogTitle>
            <AlertDialogDescription>
              {timeAction?.type === "remove" && (
                <>
                  Removing {timeAction.minutes} minute{timeAction.minutes > 1 ? "s" : ""} will leave very little time
                  remaining. This may end the session prematurely. Are you sure you want to continue?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTimeAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTimeAdjustment} className="bg-amber-600 hover:bg-amber-700">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
