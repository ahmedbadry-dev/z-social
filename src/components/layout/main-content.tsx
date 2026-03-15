"use client"

import { Authenticated, AuthLoading } from "convex/react"
import { Sidebar } from "./sidebar"
import { RightPanel } from "./right-panel"

interface MainContentProps {
    children: React.ReactNode
}

function SidebarSkeleton() {
    return (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="h-20 bg-[#E2E8F0]" />
            <div className="px-4 pb-4">
                <div className="-mt-6 mb-3 size-12 animate-pulse rounded-full bg-[#E2E8F0]" />
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />
                <div className="h-3 w-32 animate-pulse rounded bg-[#E2E8F0]" />
            </div>
        </div>
    )
}

export function MainContent({ children }: MainContentProps) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_240px]">

            <aside className="hidden md:block">
                <AuthLoading>
                    <SidebarSkeleton />
                </AuthLoading>
                <Authenticated>
                    <Sidebar />
                </Authenticated>
            </aside>

            <div className="min-w-0">{children}</div>

            <aside className="hidden lg:block">
                <Authenticated>
                    <RightPanel />
                </Authenticated>
            </aside>

        </div>
    )
}
