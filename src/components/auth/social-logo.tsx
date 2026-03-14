import { cn } from "@/lib/utils"

interface SocialLogoProps {
  className?: string
}

export function SocialLogo({ className }: SocialLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        aria-hidden="true"
        className="size-6 text-[#3B55E6]"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L22 12L12 22L2 12L12 2Z"
          fill="currentColor"
          opacity="0.24"
        />
        <path d="M12 5L19 12L12 19L5 12L12 5Z" fill="currentColor" />
        <path d="M7.5 12L12 7.5L16.5 12L12 16.5L7.5 12Z" fill="white" />
      </svg>
      <span className="text-xl font-bold text-[#0F172A]">Social</span>
    </div>
  )
}
