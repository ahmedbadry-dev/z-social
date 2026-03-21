import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GoogleButtonProps {
  label: string
  onClick: () => void
  isLoading?: boolean
}

export function GoogleButton({
  label,
  onClick,
  isLoading = false,
}: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full justify-center border-border bg-card text-foreground hover:bg-muted"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <svg
          aria-hidden="true"
          className="mr-2 size-4"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.35 11.1H12v2.98h5.36c-.48 2.5-2.68 4.02-5.36 4.02a6.1 6.1 0 1 1 0-12.2c1.54 0 2.94.58 4 1.54l2.3-2.3A9.25 9.25 0 1 0 21.35 11.1Z"
            fill="#4285F4"
          />
          <path
            d="M5.9 14.2a6.1 6.1 0 0 1 0-4.4L3.38 7.86a9.28 9.28 0 0 0 0 8.28L5.9 14.2Z"
            fill="#34A853"
          />
          <path
            d="M12 21.25a9.06 9.06 0 0 0 6.3-2.3l-2.92-2.27a5.76 5.76 0 0 1-3.38 1.02c-2.68 0-4.88-1.52-5.36-4.02l-2.52 1.94a9.26 9.26 0 0 0 7.88 5.63Z"
            fill="#FBBC05"
          />
          <path
            d="M6.64 9.8c.48-2.5 2.68-4.02 5.36-4.02 1.54 0 2.94.58 4 1.54l2.3-2.3A9.06 9.06 0 0 0 12 2.75a9.26 9.26 0 0 0-7.88 5.63L6.64 9.8Z"
            fill="#EA4335"
          />
        </svg>
      )}
      {label}
    </Button>
  )
}
