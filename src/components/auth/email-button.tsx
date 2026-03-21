import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmailButtonProps {
  label: string
  onClick: () => void
}

export function EmailButton({ label, onClick }: EmailButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full justify-center border-border bg-card text-foreground hover:bg-muted"
      onClick={onClick}
    >
      <Mail className="mr-2 size-4" />
      {label}
    </Button>
  )
}
