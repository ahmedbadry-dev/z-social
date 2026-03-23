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
  const [activeHandle, setActiveHandle] = useState<"start" | "end" | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

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

  const minIndexDelta = Math.max(
    1,
    Math.ceil((MIN_CLIP_LENGTH_SECONDS / duration) * THUMBNAIL_COUNT)
  )

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

    if (handle === "start") {
      const nextStartIndex = Math.min(
        Math.max(0, boundaryIndex),
        Math.max(0, selectionIndexes.end - minIndexDelta)
      )
      const nextStart = Number(((nextStartIndex / THUMBNAIL_COUNT) * duration).toFixed(1))
      onTrimChange(nextStart, trimEnd)
      return
    }

    const nextEndIndex = Math.max(
      Math.min(THUMBNAIL_COUNT, boundaryIndex),
      Math.min(THUMBNAIL_COUNT, selectionIndexes.start + minIndexDelta)
    )
    const nextEnd = Number(((nextEndIndex / THUMBNAIL_COUNT) * duration).toFixed(1))
    onTrimChange(trimStart, nextEnd)
  }

  useEffect(() => {
    if (!activeHandle) {
      return
    }

    const handleMove = (event: PointerEvent): void => {
      updateFromPointer(event.clientX, activeHandle)
    }

    const handleUp = (): void => {
      setActiveHandle(null)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)

    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [activeHandle, selectionIndexes.end, selectionIndexes.start, trimEnd, trimStart, duration])

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Start: {formatClock(safeStart)}</span>
          <span>End: {formatClock(safeEnd)}</span>
        </div>

        <div
          ref={barRef}
          className="overflow-hidden rounded-md border border-border bg-muted"
        >
          <div className="flex h-20 items-stretch">
            {(thumbnails.length > 0 ? thumbnails : Array.from({ length: THUMBNAIL_COUNT })).map(
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
                      isEnd && "border-r-2 border-white"
                    )}
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
                        className="absolute -left-2 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#3B55E6] shadow-sm cursor-ew-resize"
                      />
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
                        className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-[#22C55E] shadow-sm cursor-ew-resize"
                      />
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
        <p className="text-xs text-muted-foreground">
          The bright section will be posted. Dimmed sections will be removed.
        </p>
      </div>
    </div>
  )
}
