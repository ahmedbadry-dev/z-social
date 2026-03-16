"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm">
                    <p className="mb-4 text-base font-semibold text-[#0F172A]">Something went wrong</p>
                    <p className="mb-6 text-sm text-[#64748B]">An unexpected error occurred. Please try again.</p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Try again
                    </Button>
                </div>
            )
        }
        return this.props.children
    }
}