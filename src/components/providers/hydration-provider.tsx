"use client"

import { Authenticated } from "convex/react"
import { ZustandHydration } from "./zustand-hydration"

export function HydrationProvider() {
  return (
    <Authenticated>
      <ZustandHydration />
    </Authenticated>
  )
}
