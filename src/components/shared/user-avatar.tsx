import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

interface UserAvatarProps {
  name?: string
  imageUrl?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: "h-6 w-6 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-20 w-20 text-lg",
}

export function UserAvatar({
  name = "",
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  return (
    <Avatar className={cn(sizeMap[size], className)}>
      <AvatarImage src={imageUrl} alt={name} />
      <AvatarFallback className="bg-[#E8EAFF] font-medium text-[#3B55E6]">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
