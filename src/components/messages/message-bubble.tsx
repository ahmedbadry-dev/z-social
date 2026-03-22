"use client"

import { motion } from "motion/react"
import { AlertCircle, Loader2, RotateCcw, X } from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"

interface MessageBubbleProps {
  content: string
  createdAt: number
  isSent: boolean
  isOptimistic?: boolean
  imageUrl?: string | null
  isUploading?: boolean
  uploadFailed?: boolean
  onCancel?: () => void
  onRetry?: () => void
}

export function MessageBubble({
  content,
  createdAt,
  isSent,
  isOptimistic,
  imageUrl,
  isUploading,
  uploadFailed,
  onCancel,
  onRetry,
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn("flex", isSent ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[70%]", isOptimistic && "opacity-60")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isSent
              ? "rounded-br-sm bg-[#3B55E6] text-white"
              : "rounded-bl-sm border border-border bg-card text-foreground"
          )}
        >
          {imageUrl && (
            <div className="relative mb-1">
              <img
                src={imageUrl}
                alt="Shared image"
                className={cn(
                  "max-h-60 w-full rounded-xl object-cover",
                  isUploading && "opacity-60"
                )}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              )}
              {uploadFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/40">
                  <AlertCircle className="size-6 text-destructive" />
                  <button
                    type="button"
                    onClick={onRetry}
                    className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/30"
                  >
                    <RotateCcw className="size-3" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
          {content && <p className="text-sm">{content}</p>}
          {uploadFailed && !imageUrl && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3" />
              Failed to send
            </div>
          )}
        </div>
        {isUploading && (
          <p className={cn("mt-1 text-xs text-muted-foreground", isSent ? "text-right" : "text-left")}>
            Uploading...
          </p>
        )}
        <p
          className={cn(
            "mt-1 text-xs text-muted-foreground",
            isSent ? "text-right" : "text-left"
          )}
        >
          {isOptimistic ? "Sending..." : formatRelativeTime(createdAt)}
        </p>
      </div>
    </motion.div>
  )
}
