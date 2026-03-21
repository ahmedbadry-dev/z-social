"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReplyPreviewProps {
  replyToContent: string
  onCancel: () => void
}

export function ReplyPreview({ replyToContent, onCancel }: ReplyPreviewProps) {
  const previewText =
    replyToContent.length > 80 ? `${replyToContent.slice(0, 80)}...` : replyToContent

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border-l-4 border-[#3B55E6] bg-muted p-3">
      <p className="text-sm text-foreground">{previewText}</p>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={onCancel}
        aria-label="Cancel reply"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
