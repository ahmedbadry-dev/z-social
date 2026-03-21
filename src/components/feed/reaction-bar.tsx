"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { api } from "../../../convex/_generated/api"
import type { ReactionType } from "@/types"

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😠", label: "Angry" },
] as const

interface ReactionBarProps {
  postId: Id<"posts">
  myReaction: ReactionType | null
  reactionsCount: number
  reactionsSummary: Array<{ type: string; count: number }>
}

function getReactionMeta(type: ReactionType | null) {
  return REACTIONS.find((reaction) => reaction.type === type) ?? REACTIONS[0]
}

export function ReactionBar({
  postId,
  myReaction,
  reactionsCount,
}: ReactionBarProps) {
  const toggleReaction = useMutation(api.posts.toggleReaction)
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [optimisticReaction, setOptimisticReaction] = useState<ReactionType | null | undefined>(undefined)
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [hoveredType, setHoveredType] = useState<ReactionType | null>(null)
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const currentReaction = optimisticReaction !== undefined ? optimisticReaction : myReaction
  const currentCount = optimisticCount ?? reactionsCount
  const reactionMeta = getReactionMeta(currentReaction)
  const activeReaction = REACTIONS.find((reaction) => reaction.type === currentReaction) ?? null

  const clearOpenTimeout = (): void => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }
  }

  const clearCloseTimeout = (): void => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const scheduleOpen = (): void => {
    clearOpenTimeout()
    clearCloseTimeout()
    openTimeoutRef.current = setTimeout(() => {
      setOpen(true)
      setIsVisible(true)
    }, 400)
  }

  const scheduleClose = (): void => {
    clearOpenTimeout()
    clearCloseTimeout()
    setIsVisible(false)
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false)
      setHoveredType(null)
    }, 500)
  }

  const handleTouchStart = (): void => {
    longPressTimer.current = setTimeout(() => {
      setOpen(true)
      setIsVisible(true)
    }, 500)
  }

  const handleTouchEnd = (): void => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchMove = (): void => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearOpenTimeout()
      clearCloseTimeout()
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleTouchOutside = (event: TouchEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsVisible(false)
        setTimeout(() => {
          setOpen(false)
          setHoveredType(null)
        }, 500)
      }
    }

    document.addEventListener("touchstart", handleTouchOutside)
    return () => document.removeEventListener("touchstart", handleTouchOutside)
  }, [open])

  const handleReact = async (type: ReactionType): Promise<void> => {
    const previous = currentReaction
    let nextReaction: ReactionType | null = type
    let nextCount = currentCount

    if (previous === type) {
      nextReaction = null
      nextCount = Math.max(0, currentCount - 1)
    } else if (!previous) {
      nextCount = currentCount + 1
    }

    setOptimisticReaction(nextReaction)
    setOptimisticCount(nextCount)
    setIsUpdating(true)

    try {
      await toggleReaction({ postId, reactionType: type })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update reaction"
      toast.error(message)
    } finally {
      setOptimisticReaction(undefined)
      setOptimisticCount(null)
      setIsUpdating(false)
    }
  }

  const handleButtonClick = async (): Promise<void> => {
    if (currentReaction) {
      await handleReact(currentReaction)
      return
    }
    await handleReact("like")
  }

  return (
    <div
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      ref={wrapperRef}
    >
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: 0,
          width: "100%",
          height: "12px",
          background: "transparent",
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-2 px-2 touch-none"
        disabled={isUpdating}
        onClick={() => void handleButtonClick()}
      >
        {activeReaction ? (
          <span className="flex items-center gap-1.5 text-[#3B55E6]">
            <span className="text-base">{activeReaction.emoji}</span>
            <span>{activeReaction.label}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ThumbsUp className="size-4" />
            <span>Like</span>
          </span>
        )}
      </Button>

      {open && (
        <div
          ref={pickerRef}
          className={`absolute left-0 z-20 flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg ${
            isVisible ? "reaction-picker-in" : "reaction-picker-out"
          }`}
          style={{ bottom: "calc(100% + 8px)" }}
        >
          {REACTIONS.map((reaction) => {
            const isHovered = hoveredType === reaction.type
            return (
              <div key={reaction.type} className="relative flex items-center justify-center">
                {isHovered && (
                  <div className="absolute -top-8 rounded-full bg-neutral-900 px-2 py-1 text-[11px] text-white shadow-sm">
                    {reaction.label}
                  </div>
                )}
                <button
                  type="button"
                  aria-label={reaction.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition-transform duration-150 ease-out hover:translate-y-[-4px] hover:scale-125"
                  onClick={() => {
                    void handleReact(reaction.type)
                    scheduleClose()
                  }}
                  onMouseEnter={() => setHoveredType(reaction.type)}
                  onMouseLeave={() => setHoveredType(null)}
                >
                  {reaction.emoji}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
