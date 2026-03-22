"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

interface UserAvatarProps {
  name?: string
  imageUrl?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  clickable?: boolean
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
  clickable = false,
}: UserAvatarProps) {
  const [open, setOpen] = useState(false)

  const avatar = (
    <Avatar
      className={cn(
        sizeMap[size],
        clickable && imageUrl && "cursor-pointer hover:opacity-90 transition-opacity",
        className
      )}
      onClick={clickable && imageUrl ? () => setOpen(true) : undefined}
    >
      <AvatarImage src={imageUrl} alt={name} />
      <AvatarFallback className="bg-[#E8EAFF] font-medium text-[#3B55E6]">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <>
      {avatar}

      <AnimatePresence>
        {open && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={imageUrl}
                alt={name}
                className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground shadow-md hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
