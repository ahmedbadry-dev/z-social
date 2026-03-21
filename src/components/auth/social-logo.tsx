import { cn } from "@/lib/utils"
import logoLight from '../../../public/logo-light.png'

interface SocialLogoProps {
  className?: string
}

export function SocialLogo({ className }: SocialLogoProps) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <img
        src="/logo-light.png"
        alt="Z-Social"
        width={32}
        height={32}
        className="block dark:hidden object-contain"
      />
      <img
        src="/logo-dark.png"
        alt="Z-Social"
        width={32}
        height={32}
        className="hidden dark:block object-contain"
      />
    </div>
  )
}
