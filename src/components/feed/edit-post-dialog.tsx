"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { editPostSchema } from "@/lib/validations"

interface EditPostDialogProps {
  post: { _id: Id<"posts">; content: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (content: string) => Promise<void>
  isSaving?: boolean
}

export function EditPostDialog({
  post,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: EditPostDialogProps) {
  const [content, setContent] = useState(post.content)

  useEffect(() => {
    if (open) {
      setContent(post.content)
    }
  }, [open, post.content])

  const trimmed = content.trim()
  const canSave = editPostSchema.safeParse({ content: trimmed }).success && !isSaving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>Update your post content before saving.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={content}
            maxLength={500}
            className="min-h-28 resize-none"
            onChange={(event) => setContent(event.target.value)}
          />
          <p className="text-right text-xs text-[#64748B]">{content.length}/500</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (editPostSchema.safeParse({ content: trimmed }).success) {
                void onSave(trimmed)
              }
            }}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
