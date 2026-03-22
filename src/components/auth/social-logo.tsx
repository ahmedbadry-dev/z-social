import logoDark from "../../../public/logo-dark.png"
import logoLight from "../../../public/logo-light.png"
import { cn } from "@/lib/utils"

interface SocialLogoProps {
  className?: string
}

export function SocialLogo({ className }: SocialLogoProps) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <img
        src={logoDark.src}
        alt="Z-Social"
        width={32}
        height={32}
        className="block dark:hidden object-contain"
      />
      <img
        src={logoLight.src}
        alt="Z-Social"
        width={32}
        height={32}
        className="hidden dark:block object-contain"
      />
    </div>
  )
}
