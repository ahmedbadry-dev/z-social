"use client"

import { useRef, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { UserAvatar } from "@/components/shared/user-avatar"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  maxLength?: number
  dir?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  id?: string
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className,
  rows = 1,
  maxLength,
  dir,
  onKeyDown,
  id,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState<number>(-1)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const debouncedQuery = useDebounce(mentionQuery ?? "", 200)

  const suggestions = useQuery(
    api.users.searchUsersByUsername,
    mentionQuery !== null && debouncedQuery.length >= 1
      ? { query: debouncedQuery }
      : "skip"
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"

    const cursor = e.target.selectionStart
    const textBeforeCursor = newValue.slice(0, cursor)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)

    if (atMatch) {
      setMentionQuery(atMatch[1])
      setMentionStart(cursor - atMatch[0].length)
      setSelectedIndex(0)
    } else {
      setMentionQuery(null)
      setMentionStart(-1)
    }
  }

  const insertMention = (username: string) => {
    const before = value.slice(0, mentionStart)
    const after = value.slice(textareaRef.current?.selectionStart ?? mentionStart)
    const newValue = `${before}@${username} ${after}`
    onChange(newValue)
    setMentionQuery(null)
    setMentionStart(-1)

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursor = before.length + username.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursor, newCursor)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions && suggestions.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (suggestions[selectedIndex]) {
          e.preventDefault()
          insertMention(suggestions[selectedIndex].username)
          return
        }
      }
      if (e.key === "Escape") {
        setMentionQuery(null)
        return
      }
    }
    onKeyDown?.(e)
  }

  const showDropdown = mentionQuery !== null && suggestions && suggestions.length > 0

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        dir={dir}
        className={cn("w-full resize-none outline-none", className)}
        style={{ overflow: "hidden" }}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {suggestions!.map((user, index) => (
            <button
              key={user.userId}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                index === selectedIndex ? "bg-muted" : "hover:bg-muted"
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                insertMention(user.username)
              }}
            >
              <UserAvatar
                name={user.name ?? user.username}
                imageUrl={user.image ?? undefined}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{user.name ?? user.username}</p>
                <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
