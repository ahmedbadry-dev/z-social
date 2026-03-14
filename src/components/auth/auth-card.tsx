import { cn } from "@/lib/utils"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[400px] rounded-lg bg-white p-8 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}
