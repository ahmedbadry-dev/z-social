"use client"

import { type ChangeEvent, type ReactElement } from "react"

interface VideoTrimControlsProps {
  videoSrc: string
  duration: number
  trimStart: number
  trimEnd: number
  onTrimChange: (start: number, end: number) => void
}

const MIN_CLIP_LENGTH_SECONDS = 3

const formatClock = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const remaining = totalSeconds % 60
  return `${minutes}:${remaining.toString().padStart(2, "0")}`
}

const formatDuration = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const remaining = totalSeconds % 60
  return `${minutes}m ${remaining}s`
}

export function VideoTrimControls({
  videoSrc,
  duration,
  trimStart,
  trimEnd,
  onTrimChange,
}: VideoTrimControlsProps): ReactElement {
  if (!videoSrc) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        No video selected.
      </div>
    )
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground animate-pulse">
        Loading video metadata...
      </div>
    )
  }

  if (trimStart < 0 || trimEnd <= 0 || trimStart >= trimEnd) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-destructive">
        Trim controls unavailable.
      </div>
    )
  }

  const safeStart = Math.max(0, Math.min(trimStart, duration))
  const safeEnd = Math.max(0, Math.min(trimEnd, duration))
  const clipLength = Math.max(0, safeEnd - safeStart)
  const rangeLabel = `${formatClock(safeStart)} -> ${formatClock(safeEnd)} (${formatDuration(
    clipLength
  )})`

  const handleStartChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = Number(event.target.value)
    const maxStart = Math.max(0, trimEnd - MIN_CLIP_LENGTH_SECONDS)
    const nextStart = Math.min(Math.max(0, value), maxStart)
    onTrimChange(nextStart, trimEnd)
  }

  const handleEndChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = Number(event.target.value)
    const minEnd = Math.min(duration, trimStart + MIN_CLIP_LENGTH_SECONDS)
    const nextEnd = Math.max(Math.min(value, duration), minEnd)
    onTrimChange(trimStart, nextEnd)
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="space-y-2">
        <div className="relative">
          <input
            type="range"
            min={0}
            max={Math.max(0, trimEnd - 1)}
            step={0.1}
            value={safeStart}
            onChange={handleStartChange}
            className="w-full accent-[#3B55E6]"
          />
          <input
            type="range"
            min={Math.min(duration, trimStart + 1)}
            max={duration}
            step={0.1}
            value={safeEnd}
            onChange={handleEndChange}
            className="w-full accent-[#22C55E] -mt-2"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{rangeLabel}</span>
          <span>Drag handles to select which part to post</span>
        </div>
      </div>
    </div>
  )
}
