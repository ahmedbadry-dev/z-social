"use client"

import { Loader2, SendHorizontal } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  isSending: boolean
}

export function MessageInput({ onSend, isSending }: MessageInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const maxHeight = 24 * 4
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }

  const submit = async () => {
    const content = value.trim()
    if (!content || isSending) return
    await onSend(content)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder="Type a message..."
        className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#3B55E6]"
        onInput={autoResize}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            void submit()
          }
        }}
      />
      <Button
        type="button"
        size="icon"
        className="h-10 w-10 rounded-full bg-[#3B55E6] text-white hover:bg-[#2E46C4]"
        disabled={!value.trim() || isSending}
        onClick={() => void submit()}
      >
        {isSending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <SendHorizontal className="size-4" />
        )}
      </Button>
    </div>
  )
}
