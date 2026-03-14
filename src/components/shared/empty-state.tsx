import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-[#F1F5F9] p-4">
        <Icon className="h-8 w-8 text-[#94A3B8]" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-[#0F172A]">{title}</h3>
      <p className="max-w-xs text-sm text-[#64748B]">{description}</p>
    </div>
  )
}
