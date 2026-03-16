import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadMoreButtonProps {
    onClick: () => void
    isLoading: boolean
    hasMore: boolean
}

export function LoadMoreButton({ onClick, isLoading, hasMore }: LoadMoreButtonProps) {
    if (!hasMore) return null

    return (
        <div className="flex justify-center py-4">
            <Button
                type="button"
                variant="outline"
                onClick={onClick}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Loading...
                    </>
                ) : (
                    "Load more"
                )}
            </Button>
        </div>
    )
}