import { format, formatDistanceToNowStrict, isAfter, subDays } from "date-fns"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp)
  const sevenDaysAgo = subDays(new Date(), 7)

  if (isAfter(date, sevenDaysAgo)) {
    const distance = formatDistanceToNowStrict(date, { roundingMethod: "floor" })
    if (distance.includes("less than a minute")) {
      return "now"
    }
    return distance
      .replace(" seconds", "s")
      .replace(" second", "s")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "h")
      .replace(" hour", "h")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace(" months", "mo")
      .replace(" month", "mo")
      .replace(" years", "y")
      .replace(" year", "y")
  }

  return format(date, "d MMMM, yyyy")
}

// Format last seen time: "last seen 5 minutes ago" / "last seen yesterday" etc.
export function formatLastSeen(timestamp: number | null): string {
  if (!timestamp) return "last seen a while ago"
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "last seen just now"
  if (minutes < 60) return `last seen ${minutes}m ago`
  if (hours < 24) return `last seen ${hours}h ago`
  if (days === 1) return "last seen yesterday"
  return `last seen ${days} days ago`
}

// Format date for separator: "Today" / "Yesterday" / "Mon, Mar 10"
export function formatDateSeparator(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

// Check if two timestamps are on different days
export function isDifferentDay(ts1: number, ts2: number): boolean {
  return new Date(ts1).toDateString() !== new Date(ts2).toDateString()
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`
  }

  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`
  }

  return String(n)
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
