"use client"

import Image from "next/image"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react"
import { cn } from "@/lib/utils"

interface VideoTrimControlsProps {
  videoSrc: string
  duration: number
  trimStart: number
  trimEnd: number
  onTrimChange: (start: number, end: number) => void
}

const MIN_CLIP_LENGTH_SECONDS = 3
const THUMBNAIL_COUNT = 10

const formatClock = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const remaining = totalSeconds % 60
  return `${minutes}:${remaining.toString().padStart(2, "0")}`
}

export function VideoTrimControls({
  videoSrc,
  duration,
  trimStart,
  trimEnd,
  onTrimChange,
}: VideoTrimControlsProps): ReactElement {
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeHandle, setActiveHandle] = useState<"start" | "end" | "range" | null>(
    null
  )
  const barRef = useRef<HTMLDivElement | null>(null)
  const durationRef = useRef(duration)
  const trimStartRef = useRef(trimStart)
  const trimEndRef = useRef(trimEnd)
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 1 })
  const rangeDragOffsetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastClientXRef = useRef<number | null>(null)
  const placeholderFrames = useMemo(
    () => Array.from({ length: THUMBNAIL_COUNT }),
    []
  )

  useEffect(() => {
    let cancelled = false

    const generateThumbnails = async (): Promise<void> => {
      if (!videoSrc || !Number.isFinite(duration) || duration <= 0) {
        setThumbnails([])
        setIsGenerating(false)
        return
      }

      setIsGenerating(true)
      setThumbnails([])

      const video = document.createElement("video")
      video.src = videoSrc
      video.preload = "auto"
      video.muted = true
      video.playsInline = true

      const loadMetadata = (): Promise<void> =>
        new Promise((resolve, reject) => {
          video.onloadedmetadata = () => resolve()
          video.onerror = () => reject(new Error("Thumbnail generation failed"))
        })

      try {
        await loadMetadata()

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          setIsGenerating(false)
          return
        }

        const targetHeight = 80
        const ratio = video.videoWidth > 0 ? video.videoWidth / video.videoHeight : 16 / 9
        canvas.height = targetHeight
        canvas.width = Math.round(targetHeight * ratio)

        const step = duration / THUMBNAIL_COUNT
        const times = Array.from({ length: THUMBNAIL_COUNT }, (_, index) => {
          const base = step * index + step / 2
          return Math.min(Math.max(base, 0), Math.max(duration - 0.1, 0))
        })

        const captureFrame = (time: number): Promise<string> =>
          new Promise((resolve, reject) => {
            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              resolve(canvas.toDataURL("image/jpeg", 0.6))
            }
            video.onerror = () => reject(new Error("Thumbnail capture failed"))
            video.currentTime = time
          })

        const frames: string[] = []
        for (const time of times) {
          if (cancelled) {
            return
          }
          const frame = await captureFrame(time)
          frames.push(frame)
        }

        if (!cancelled) {
          setThumbnails(frames)
        }
      } catch {
        if (!cancelled) {
          setThumbnails([])
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false)
        }
      }
    }

    void generateThumbnails()
    return () => {
      cancelled = true
    }
  }, [duration, videoSrc])

  const selectionIndexes = useMemo((): { start: number; end: number } => {
    const count = Math.max(1, THUMBNAIL_COUNT)
    if (!Number.isFinite(duration) || duration <= 0) {
      return { start: 0, end: 1 }
    }
    const safeStartForIndex = Math.max(0, Math.min(trimStart, duration))
    const safeEndForIndex = Math.max(0, Math.min(trimEnd, duration))
    const startIndex = Math.max(0, Math.min(count - 1, Math.round((safeStartForIndex / duration) * count)))
    const endIndex = Math.max(startIndex + 1, Math.min(count, Math.round((safeEndForIndex / duration) * count)))
    return { start: startIndex, end: endIndex }
  }, [duration, trimEnd, trimStart])

  useEffect(() => {
    durationRef.current = duration
    trimStartRef.current = trimStart
    trimEndRef.current = trimEnd
    selectionRef.current = selectionIndexes
  }, [duration, selectionIndexes, trimEnd, trimStart])

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

  const clampStart = (value: number, end: number): number => {
    const maxStart = Math.max(0, end - MIN_CLIP_LENGTH_SECONDS)
    return Math.min(Math.max(0, value), maxStart)
  }

  const clampEnd = (value: number, start: number): number => {
    const minEnd = Math.min(duration, start + MIN_CLIP_LENGTH_SECONDS)
    return Math.max(Math.min(value, duration), minEnd)
  }

  const nudgeStart = (delta: number): void => {
    const nextStart = clampStart(Number((trimStart + delta).toFixed(1)), trimEnd)
    onTrimChange(nextStart, trimEnd)
  }

  const nudgeEnd = (delta: number): void => {
    const nextEnd = clampEnd(Number((trimEnd + delta).toFixed(1)), trimStart)
    onTrimChange(trimStart, nextEnd)
  }

  const updateFromPointer = (clientX: number, handle: "start" | "end"): void => {
    const container = barRef.current
    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()
    if (rect.width <= 0) {
      return
    }

    const clampedX = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    const percent = clampedX / rect.width
    const boundaryIndex = Math.round(percent * THUMBNAIL_COUNT)
    const currentTrimStart = trimStartRef.current
    const currentTrimEnd = trimEndRef.current
    const currentDuration = durationRef.current
    const currentSelection = selectionRef.current
    const currentMinIndexDelta = Math.max(
      1,
      Math.ceil((MIN_CLIP_LENGTH_SECONDS / currentDuration) * THUMBNAIL_COUNT)
    )

    if (handle === "start") {
      const nextStartIndex = Math.min(
        Math.max(0, boundaryIndex),
        Math.max(0, currentSelection.end - currentMinIndexDelta)
      )
      const nextStart = Number(
        ((nextStartIndex / THUMBNAIL_COUNT) * currentDuration).toFixed(1)
      )
      if (nextStart !== currentTrimStart) {
        onTrimChange(nextStart, currentTrimEnd)
      }
      return
    }

    const nextEndIndex = Math.max(
      Math.min(THUMBNAIL_COUNT, boundaryIndex),
      Math.min(THUMBNAIL_COUNT, currentSelection.start + currentMinIndexDelta)
    )
    const nextEnd = Number(((nextEndIndex / THUMBNAIL_COUNT) * currentDuration).toFixed(1))
    if (nextEnd !== currentTrimEnd) {
      onTrimChange(currentTrimStart, nextEnd)
    }
  }

  const updateRangeFromPointer = (clientX: number): void => {
    const container = barRef.current
    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()
    if (rect.width <= 0) {
      return
    }

    const clampedX = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    const percent = clampedX / rect.width
    const currentDuration = durationRef.current
    const currentTrimStart = trimStartRef.current
    const currentTrimEnd = trimEndRef.current
    const timeAtPointer = percent * currentDuration
    const currentClipLength = Math.max(
      MIN_CLIP_LENGTH_SECONDS,
      currentTrimEnd - currentTrimStart
    )
    const maxStart = Math.max(0, currentDuration - currentClipLength)
    const nextStartRaw = timeAtPointer - rangeDragOffsetRef.current
    const nextStart = Number(
      Math.min(Math.max(nextStartRaw, 0), maxStart).toFixed(1)
    )
    const nextEnd = Number((nextStart + currentClipLength).toFixed(1))
    if (nextStart !== currentTrimStart || nextEnd !== currentTrimEnd) {
      onTrimChange(nextStart, nextEnd)
    }
  }

  useEffect(() => {
    if (!activeHandle) {
      return
    }

    const handleMove = (event: PointerEvent): void => {
      lastClientXRef.current = event.clientX
      if (rafRef.current !== null) {
        return
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        const clientX = lastClientXRef.current
        if (clientX === null) {
          return
        }
        if (activeHandle === "range") {
          updateRangeFromPointer(clientX)
          return
        }
        updateFromPointer(clientX, activeHandle)
      })
    }

    const handleUp = (): void => {
      setActiveHandle(null)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastClientXRef.current = null
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)

    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [activeHandle])

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Start: {formatClock(safeStart)}</span>
          <span>End: {formatClock(safeEnd)}</span>
        </div>

        <div ref={barRef} className="overflow-hidden rounded-md border border-border bg-muted">
          <div className="flex h-20 items-stretch">
            {(thumbnails.length > 0 ? thumbnails : placeholderFrames).map(
              (thumb, index) => {
                const isSelected = index >= selectionIndexes.start && index < selectionIndexes.end
                const isStart = index === selectionIndexes.start
                const isEnd = index === selectionIndexes.end - 1
                return (
                  <div
                    key={typeof thumb === "string" ? thumb : index}
                    className={cn(
                      "relative flex-1 overflow-hidden",
                      isSelected ? "border-y-2 border-white" : "opacity-40 grayscale",
                      isStart && "border-l-2 border-white",
                      isEnd && "border-r-2 border-white",
                      isSelected && "cursor-grab touch-none"
                    )}
                    onPointerDown={(event) => {
                      if (!isSelected) {
                        return
                      }
                      const target = event.target as HTMLElement
                      if (target.closest("button")) {
                        return
                      }
                      event.preventDefault()
                      const container = barRef.current
                      if (!container) {
                        return
                      }
                      const rect = container.getBoundingClientRect()
                      const clampedX = Math.min(
                        Math.max(event.clientX - rect.left, 0),
                        rect.width
                      )
                      const percent = rect.width > 0 ? clampedX / rect.width : 0
                      const timeAtPointer = percent * duration
                      rangeDragOffsetRef.current = timeAtPointer - trimStart
                      setActiveHandle("range")
                      updateRangeFromPointer(event.clientX)
                    }}
                  >
                    {typeof thumb === "string" ? (
                      <Image
                        src={thumb}
                        alt={`Frame ${index + 1}`}
                        width={120}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse bg-muted-foreground/20" />
                    )}
                    {isStart && (
                      <button
                        type="button"
                        aria-label="Adjust start"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          setActiveHandle("start")
                          updateFromPointer(event.clientX, "start")
                        }}
                        className="absolute -left-3 top-1/2 z-20 size-9 -translate-y-1/2 rounded-full bg-white/20 shadow-sm cursor-ew-resize touch-none"
                      >
                        <span className="pointer-events-none absolute inset-[6px] rounded-full border-2 border-white bg-[#3B55E6]" />
                      </button>
                    )}
                    {isEnd && (
                      <button
                        type="button"
                        aria-label="Adjust end"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          setActiveHandle("end")
                          updateFromPointer(event.clientX, "end")
                        }}
                        className="absolute -right-3 top-1/2 z-20 size-9 -translate-y-1/2 rounded-full bg-white/20 shadow-sm cursor-ew-resize touch-none"
                      >
                        <span className="pointer-events-none absolute inset-[6px] rounded-full border-2 border-white bg-[#22C55E]" />
                      </button>
                    )}
                  </div>
                )
              }
            )}
          </div>
        </div>
        {isGenerating && (
          <p className="text-xs text-muted-foreground">Generating preview...</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Start</span>
            <button
              type="button"
              className="rounded-full border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
              onClick={() => nudgeStart(-0.5)}
            >
              -0.5s
            </button>
            <button
              type="button"
              className="rounded-full border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
              onClick={() => nudgeStart(0.5)}
            >
              +0.5s
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">End</span>
            <button
              type="button"
              className="rounded-full border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
              onClick={() => nudgeEnd(-0.5)}
            >
              -0.5s
            </button>
            <button
              type="button"
              className="rounded-full border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
              onClick={() => nudgeEnd(0.5)}
            >
              +0.5s
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          The bright section will be posted. Dimmed sections will be removed.
        </p>
      </div>
    </div>
  )
}
