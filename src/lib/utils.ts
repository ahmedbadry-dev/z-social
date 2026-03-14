import { format, formatDistanceToNow, isAfter, subDays } from "date-fns"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp)
  const sevenDaysAgo = subDays(new Date(), 7)

  if (isAfter(date, sevenDaysAgo)) {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return format(date, "d MMMM, yyyy")
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
