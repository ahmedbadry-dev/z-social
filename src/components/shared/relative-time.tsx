"use client"

import { useEffect, useState } from "react"
import { formatRelativeTime } from "@/lib/utils"

interface RelativeTimeProps {
    date: number
}

export function RelativeTime({ date }: RelativeTimeProps) {
    const [label, setLabel] = useState(() => formatRelativeTime(date))

    useEffect(() => {
        const interval = setInterval(() => {
            setLabel(formatRelativeTime(date))
        }, 60_000)
        return () => clearInterval(interval)
    }, [date])

    return <span>{label}</span>
}