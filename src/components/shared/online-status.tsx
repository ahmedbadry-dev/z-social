import { memo } from "react"
import { cn } from "@/lib/utils"

interface OnlineStatusProps {
  isOnline: boolean
  className?: string
}

export const OnlineStatus = memo(function OnlineStatus({ isOnline, className }: OnlineStatusProps) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-card",
        isOnline ? "bg-green-500" : "bg-muted-foreground/40",
        className
      )}
    />
  )
})
