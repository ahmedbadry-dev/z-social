import { useEffect, useRef } from "react"

export function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) callback()
      },
      { threshold: 0.1 }
    )
    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [callback, hasMore])

  return observerRef
}
