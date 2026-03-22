import Image from "next/image"
import { cn } from "@/lib/utils"

interface SocialLogoProps {
  className?: string
}

export function SocialLogo({ className }: SocialLogoProps) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <Image
        src="/logo-dark.png"
        alt="Z-Social"
        width={32}
        height={32}
        className="block dark:hidden object-contain"
        priority
      />
      <Image
        src="/logo-light.png"
        alt="Z-Social"
        width={32}
        height={32}
        className="hidden dark:block object-contain"
        priority
      />
    </div>
  )
}
