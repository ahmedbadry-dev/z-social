import { cn } from "@/lib/utils"

interface MentionTextProps {
  content: string
  className?: string
}

export function MentionText({ content, className }: MentionTextProps) {
  const parts = content.split(/(@\w+)/g)

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, index) => {
        if (part.match(/^@\w+$/)) {
          return (
            <span key={index} className="font-medium text-[#3B55E6]">
              {part}
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
