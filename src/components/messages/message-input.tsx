"use client"

import { ImagePlus, Loader2, SendHorizontal, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface MessageInputProps {
  onSend: (content: string, imageFile?: File, localPreviewUrl?: string) => Promise<void>
  isSending: boolean
  onTyping?: () => void
}

export function MessageInput({ onSend, isSending, onTyping }: MessageInputProps) {
  const [value, setValue] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const autoResize = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const maxHeight = 24 * 4
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }

  const submit = () => {
    const content = value.trim()
    if ((!content && !imageFile) || isSending) return

    const previewUrl = imagePreview ?? undefined
    const fileToSend = imageFile

    setValue("")
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    void onSend(content, fileToSend ?? undefined, previewUrl)
  }

  return (
    <div>
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-32 rounded-lg object-cover"
          />
          <button
            type="button"
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
            onClick={() => {
              setImageFile(null)
              setImagePreview(null)
            }}
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (imagePreview) {
              URL.revokeObjectURL(imagePreview)
            }
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
          }}
        />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
        >
          <ImagePlus className="size-4" />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder="Type a message..."
          className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#3B55E6]"
          onInput={autoResize}
          onChange={(event) => {
            setValue(event.target.value)
            onTyping?.()
          }}
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
          disabled={(!value.trim() && !imageFile) || isSending}
          onClick={() => void submit()}
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
