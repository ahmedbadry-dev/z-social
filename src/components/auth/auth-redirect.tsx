"use client"

import { Unauthenticated } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function RedirectToLogin() {
    const router = useRouter()
    useEffect(() => {
        router.replace("/login")
    }, [router])
    return null
}

export function AuthRedirect() {
    return (
        <Unauthenticated>
            <RedirectToLogin />
        </Unauthenticated>
    )
}