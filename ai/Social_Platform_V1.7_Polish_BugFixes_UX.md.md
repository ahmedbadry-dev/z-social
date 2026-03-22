# V1.7 — Polish, Bug Fixes & UX Improvements
# Branch: v1.7/phase-1-fixes-and-polish

---

# ═══════════════════════════════════════════
# PHASE 1 — Critical Bug Fixes
# Tasks: 3, 4, 7, 9, 15
# ═══════════════════════════════════════════

## READ FIRST
- `src/components/feed/post-detail-client.tsx`
- `src/components/auth/social-logo.tsx`
- `src/components/auth/auth-layout-wrapper.tsx`
- `src/components/search/search-main.tsx`
- `src/components/profile/profile-header.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/layout/sidebar.tsx`

---

## FIX 1 — Post page back button (Task 3)

**File:** `src/components/feed/post-detail-client.tsx`

**Problem:** `router.back()` fails when the user opens the post page directly (e.g. from a shared link) — there's no history to go back to.

**Fix:** Replace `router.back()` with a smarter back that falls back to `/feed`:

```tsx
// BEFORE:
onClick={() => router.back()}

// AFTER:
onClick={() => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push("/feed")
  }
}}
```

---

## FIX 2 — Auth pages logo not working (Task 4)

**File:** `src/components/auth/social-logo.tsx`

**Problem:** The component uses `<img>` tags with hardcoded paths. On some deployments the image paths don't resolve. Also has an unused `logoLight` import.

**Fix:** Replace `<img>` with Next.js `<Image>` and remove the unused import:

```tsx
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
```

---

## FIX 3 — Search result clicks should go to profile, not messages (Task 7)

**File:** `src/components/search/user-result-card.tsx`

**Problem:** Clicking a user card in search results navigates to `/messages?userId=...` — it should navigate to the user's profile page.

**Fix:** Change the `onOpenProfile` function:

```tsx
// BEFORE:
const onOpenProfile = () => {
  if (isCurrentUser) {
    router.push("/profile")
  } else {
    router.push(`/messages?userId=${userId}`)
  }
}

// AFTER:
const onOpenProfile = () => {
  if (isCurrentUser) {
    router.push("/profile")
  } else {
    router.push(`/profile?userId=${userId}`)
  }
}
```

---

## FIX 4 — Cover image not showing in sidebar (Task 9)

**File:** `src/components/layout/sidebar.tsx`

**Problem:** The sidebar queries `getUserProfile` using `currentUser._id` (the Convex document ID) instead of `currentUser.userId` (the Better Auth user ID). These are different values — the profile is stored by `userId`, not `_id`.

**Fix:** Change the query arg:

```tsx
// BEFORE:
const userProfile = useQuery(
  api.users.getUserProfile,
  currentUser?._id ? { userId: String(currentUser._id) } : "skip"
)

// AFTER:
const userProfile = useQuery(
  api.users.getUserProfile,
  currentUser?.userId ? { userId: currentUser.userId } : "skip"
)
```

---

## FIX 5 — Logo click navigates to home (Task 15)

**File:** `src/components/auth/social-logo.tsx` and `src/components/layout/navbar.tsx`

**In navbar.tsx**, wrap the existing `<SocialLogo />` in a `<Link href="/feed">`:

```tsx
// BEFORE:
<SocialLogo />

// AFTER:
<Link href="/feed" aria-label="Go to home feed">
  <SocialLogo />
</Link>
```

Make sure `Link` is already imported (it is).

---

## AFTER PHASE 1

1. Run `npm run build`
2. Fix any TypeScript errors

```
✅ Phase 1 complete — Critical Bug Fixes
Files changed:
- src/components/feed/post-detail-client.tsx
- src/components/auth/social-logo.tsx
- src/components/search/user-result-card.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
Build: passed
```

---
---
---

# ═══════════════════════════════════════════
# PHASE 2 — Online Status + Theme Fixes
# Tasks: 5, 6, 8
# ═══════════════════════════════════════════

## READ FIRST
- `src/components/messages/message-bubble.tsx`
- `src/components/messages/chat-window.tsx`
- `src/components/messages/conversation-item.tsx`
- `src/components/shared/online-status.tsx`
- `src/components/profile/privacy-settings.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/layout/mobile-tab-bar.tsx`
- `convex/messages.ts`
- `convex/users.ts`

---

## FIX 1 — Messages hardcoded colors (Task 5)

**File:** `src/components/messages/message-bubble.tsx`

Replace hardcoded error colors with semantic tokens:

```tsx
// BEFORE:
<AlertCircle className="size-6 text-red-400" />
// AFTER:
<AlertCircle className="size-6 text-destructive" />

// BEFORE:
<div className="flex items-center gap-1 text-xs text-red-400">
// AFTER:
<div className="flex items-center gap-1 text-xs text-destructive">
```

**File:** `src/components/messages/chat-window.tsx`

```tsx
// BEFORE:
<p className={isOnline ? "text-xs text-green-500" : "text-xs text-muted-foreground"}>
// AFTER:
<p className={isOnline ? "text-xs text-[#22C55E]" : "text-xs text-muted-foreground"}>
```

Note: `#22C55E` is our design system's success green — it's an allowed hardcoded value per project rules (same as `#3B55E6` and `#DC2626`).

---

## FIX 2 — Hardcoded red badge colors across layout (Task 6)

Replace all `bg-red-500` notification badges with the brand primary color `bg-[#3B55E6]`.
The unread dot in messages can stay red (it's a different semantic — unread message vs notification count).

**File:** `src/components/layout/sidebar.tsx`

```tsx
// BEFORE (notifications badge):
<span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">

// AFTER:
<span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#3B55E6] text-[10px] font-medium text-white">
```

Do this for BOTH badge spans in sidebar (notifications and messages).

**File:** `src/components/layout/navbar.tsx`

```tsx
// BEFORE:
<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">

// AFTER:
<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3B55E6] text-[10px] text-white">
```

**File:** `src/components/layout/mobile-tab-bar.tsx`

```tsx
// BEFORE:
<span className="absolute -top-2 -right-3 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">

// AFTER:
<span className="absolute -top-2 -right-3 inline-flex min-w-[16px] items-center justify-center rounded-full bg-[#3B55E6] px-1 text-[10px] leading-4 text-white">
```

**File:** `src/components/conversation-item.tsx`

The unread dot `bg-[#3B55E6]` is already correct — don't change it.

---

## FIX 3 — Online Status setting actually hides status (Task 8)

**Problem:** `showOnlineStatus` is saved in the DB but the `getPresence` query in `convex/messages.ts` never checks it. So even if a user disables online status, others can still see them as online.

**Fix A — convex/messages.ts:** Update `getPresence` to respect `showOnlineStatus`:

```typescript
export const getPresence = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Check if the user has hidden their online status
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    // If user disabled online status visibility, always return offline
    if (profile?.showOnlineStatus === false) {
      return { isOnline: false, isTyping: false }
    }

    const presence = await ctx.db
      .query("userPresence")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()

    if (!presence) return { isOnline: false, isTyping: false }

    const TWO_MINUTES = 2 * 60 * 1000
    const isOnline = Date.now() - presence.lastSeen < TWO_MINUTES

    return { isOnline, isTyping: false }
  },
})
```

**Fix B — privacy-settings.tsx:** Update the label and description to be clearer:

```tsx
// BEFORE:
<div className="flex items-center gap-2 text-sm font-medium text-foreground">
  <Eye className="size-4 text-muted-foreground" />
  Online Status
</div>
<p className="text-xs text-muted-foreground">
  Show when you're active in messages
</p>

// AFTER:
<div className="flex items-center gap-2 text-sm font-medium text-foreground">
  <Eye className="size-4 text-muted-foreground" />
  Show Online Status
</div>
<p className="text-xs text-muted-foreground">
  When off, others won't see when you're active or last seen
</p>
```

---

## AFTER PHASE 2

1. Run `npm run build`
2. Fix any TypeScript errors

```
✅ Phase 2 complete — Online Status + Theme Fixes
Files changed:
- src/components/messages/message-bubble.tsx
- src/components/messages/chat-window.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/navbar.tsx
- src/components/layout/mobile-tab-bar.tsx
- src/components/profile/privacy-settings.tsx
- convex/messages.ts
Build: passed
```

---
---
---

# ═══════════════════════════════════════════
# PHASE 3 — UI & Avatar Lightbox
# Tasks: 2, 10, 14, 16, 17
# ═══════════════════════════════════════════

## READ FIRST
- `src/components/shared/user-avatar.tsx`
- `src/components/explore/explore-content.tsx`
- `src/components/profile/general-settings.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/layout/mobile-tab-bar.tsx`

---

## FIX 1 — Avatar lightbox popup (Task 2)

**File:** `src/components/shared/user-avatar.tsx`

Add an optional `onClick` that opens a full-screen lightbox dialog to show the image clearly.
Only show the lightbox if the user has a real image (not a fallback).

```tsx
"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

interface UserAvatarProps {
  name?: string
  imageUrl?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  clickable?: boolean   // if true, clicking opens the lightbox
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
              onClick={(e) => e.stopPropagation()}
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
```

Then in `src/components/profile/profile-header.tsx`, add `clickable` to the avatar:

```tsx
// Find the UserAvatar inside the cover image section and add clickable:
<UserAvatar
  name={name}
  imageUrl={image}
  size="xl"
  clickable
  className="absolute bottom-0 left-6 translate-y-1/2 border-4 border-white"
/>
```

Also add `clickable` in `src/components/layout/sidebar.tsx` for the sidebar avatar.

---

## FIX 2 — Explore page improvements (Task 10)

**File:** `src/components/explore/explore-content.tsx`

**Problems:**
1. `??` showing instead of emoji (encoding issue) — replace with SVG-based rank badges
2. Header looks basic
3. Trending section title needs improvement
4. Border radius inconsistency on ring vs card

**Fix:**

Replace the entire component header and the medal badges with this approach:

```tsx
// Replace the header:
// BEFORE:
<div className="flex items-center gap-2">
  <Compass className="size-5 text-[#3B55E6]" />
  <h1 className="text-lg font-semibold text-foreground">Explore</h1>
</div>

// AFTER:
<div className="rounded-lg bg-card px-5 py-4 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B55E6]/10">
      <Compass className="size-5 text-[#3B55E6]" />
    </div>
    <div>
      <h1 className="text-base font-bold text-foreground">Explore</h1>
      <p className="text-xs text-muted-foreground">Discover trending posts</p>
    </div>
  </div>
</div>
```

Replace the trending section title:
```tsx
// BEFORE:
<h2 className="text-sm font-medium text-muted-foreground">
  {trendingPosts && trendingPosts.length > 0 ? "?? Trending posts" : "Trending posts"}
</h2>

// AFTER:
<h2 className="text-sm font-semibold text-foreground">Trending posts</h2>
```

Replace the broken emoji medal badges with clean numbered rank badges.
Remove `<span className="text-lg">??</span>` from all 3 medal divs and replace with rank numbers:

```tsx
// For index === 0 (gold): replace the ?? span with:
<span className="text-xs font-bold text-amber-700">#1</span>

// For index === 1 (silver): replace the ?? span with:
<span className="text-xs font-bold text-slate-600">#2</span>

// For index === 2 (bronze): replace the ?? span with:
<span className="text-xs font-bold text-orange-700">#3</span>
```

Fix border radius inconsistency — the `ring-2` wrapper and the `PostCard` inside have different border radii. Add `overflow-hidden` to the wrapper:

```tsx
// On every motion.div wrapper that has ring-2:
className={cn(
  "relative overflow-hidden",
  index === 0 && "ring-2 ring-yellow-400/30 rounded-xl",
  index === 1 && "ring-2 ring-slate-400/20 rounded-xl",
  index === 2 && "ring-2 ring-orange-400/20 rounded-xl"
)}
```

---

## FIX 3 — General Settings save button text visibility (Task 14)

**File:** `src/components/profile/general-settings.tsx`

Find the submit button and check its variant/className. The text is invisible because the button is using `variant="default"` which may have dark bg + dark text in dark mode due to a CSS conflict.

Find the Save button and update it:

```tsx
// Find the submit Button and ensure it uses explicit colors:
<Button
  type="submit"
  className="bg-[#3B55E6] text-white hover:bg-[#2D46D6]"
  disabled={form.formState.isSubmitting || isUploading}
>
  {form.formState.isSubmitting || isUploading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : null}
  Save changes
</Button>
```

---

## FIX 4 — Notification icon: Bell → Heart, with unread dot on mobile (Task 16)

**Files:**
- `src/components/layout/sidebar.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/layout/mobile-tab-bar.tsx`

**In sidebar.tsx:**
- Change `Bell` to `Heart` in the navItems array
- Change badge color from `bg-red-500` → `bg-[#3B55E6]` (already done in Phase 2)

```tsx
// In navItems array:
// BEFORE:
{ href: "/notifications", label: "Notifications", icon: Bell },
// AFTER:
{ href: "/notifications", label: "Notifications", icon: Heart },

// Add Heart to imports from lucide-react, remove Bell
```

**In navbar.tsx (mobile):**
- Change `Bell` to `Heart`
- Replace the number badge with a small dot (more subtle on mobile):

```tsx
// BEFORE:
<Link href="/notifications" className="relative md:hidden" aria-label="Notifications">
  <Bell className="size-5 text-foreground" />
  {unreadNotifications > 0 && (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3B55E6] text-[10px] text-white">
      {unreadNotifications > 9 ? "9+" : unreadNotifications}
    </span>
  )}
</Link>

// AFTER:
<Link href="/notifications" className="relative md:hidden" aria-label="Notifications">
  <Heart className="size-5 text-foreground" />
  {unreadNotifications > 0 && (
    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#3B55E6] ring-2 ring-card" />
  )}
</Link>
```

Import `Heart` and remove `Bell` from imports.

**In mobile-tab-bar.tsx:**
- Notifications is not in the mobile tab bar currently (it's only in navbar on mobile). No change needed here.

---

## FIX 5 — Sidebar nav item aesthetics (Task 17)

**File:** `src/components/layout/sidebar.tsx`

Update the nav items styling to be more polished — add icon background on active, smooth hover:

```tsx
// BEFORE:
<Link
  key={href}
  href={href}
  className={cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
    isActive && "bg-muted font-semibold text-foreground"
  )}
>
  <Icon className="size-5" />
  <span>{label}</span>
  ...badges
</Link>

// AFTER:
<Link
  key={href}
  href={href}
  className={cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
    isActive && "bg-[#3B55E6]/10 font-semibold text-[#3B55E6]"
  )}
>
  <div className={cn(
    "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
    isActive ? "bg-[#3B55E6]/15" : "group-hover:bg-muted"
  )}>
    <Icon className="size-4" />
  </div>
  <span>{label}</span>
  ...badges (unchanged)
</Link>
```

---

## AFTER PHASE 3

1. Run `npm run build`
2. Fix any TypeScript errors

```
✅ Phase 3 complete — UI & Avatar Lightbox
Files changed:
- src/components/shared/user-avatar.tsx
- src/components/profile/profile-header.tsx
- src/components/layout/sidebar.tsx
- src/components/explore/explore-content.tsx
- src/components/profile/general-settings.tsx
- src/components/layout/navbar.tsx
Build: passed
```

---
---
---

# ═══════════════════════════════════════════
# PHASE 4 — Mobile UX
# Tasks: 11, 12, 13
# ═══════════════════════════════════════════

## READ FIRST
- `src/components/profile/profile-header.tsx`
- `src/components/profile/followers-list.tsx`
- `src/components/profile/following-list.tsx`
- `src/components/feed/post-detail-client.tsx`
- `src/components/messages/chat-window.tsx`

---

## FIX 1 — Mobile profile: move Follow/Message buttons below stats (Task 11)

**File:** `src/components/profile/profile-header.tsx`

On mobile, the Follow and Message buttons should appear below the stats row (Posts/Followers/Following), not next to the name.

Use responsive classes: hide the buttons in the header area on mobile (`hidden sm:flex`), and show a second button row below the stats on mobile only (`flex sm:hidden`).

```tsx
// In the flex row with name + buttons, add hidden sm:flex to the buttons div:
{!isOwnProfile && (
  <div className="hidden sm:flex items-center gap-2">
    {/* ... existing Follow + Message buttons ... */}
  </div>
)}

// After the stats div (mt-5 flex items-center gap-8), add mobile-only button row:
{!isOwnProfile && (
  <div className="mt-4 flex items-center gap-2 sm:hidden">
    {/* exact same buttons as above */}
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={() => void onToggleFollow()}
      className={cn(
        "flex-1 rounded-full py-2 text-sm font-semibold transition-colors",
        following || requested
          ? "bg-muted text-foreground border border-border"
          : "bg-[#3B55E6] text-white"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={following ? "following" : requested ? "requested" : isFollowedByMe ? "follow_back" : "follow"}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
        >
          {following ? "Following" : requested ? "Requested" : isFollowedByMe ? "Follow back" : "Follow"}
        </motion.span>
      </AnimatePresence>
    </motion.button>

    <Link href={`/messages?userId=${userId}`}>
      <Button type="button" variant="outline" size="icon">
        <MessageCircle className="size-4" />
      </Button>
    </Link>
  </div>
)}
```

---

## FIX 2 — Add back button on mobile for followers/following pages (Task 12)

**Files:** `src/components/profile/followers-list.tsx` and `src/components/profile/following-list.tsx`

Add a mobile back button at the top of both components. This only shows on mobile (`md:hidden`).

Add `useRouter` import from `"next/navigation"` and `ArrowLeft` from `"lucide-react"`.

```tsx
// At the top of the return, before the <section>:
const router = useRouter()

// Add this above the section:
<div className="mb-3 md:hidden">
  <button
    type="button"
    onClick={() => {
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push("/profile")
      }
    }}
    className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    aria-label="Go back"
  >
    <ArrowLeft className="size-5" />
  </button>
</div>
```

Apply the same to both `FollowersList` and `FollowingList`.

---

## FIX 3 — Mobile back buttons: icon only, consistent padding & hover (Task 13)

Check ALL components that have a "Back" button and ensure:
1. On mobile (`md:hidden` or always visible back buttons): show icon only, no text
2. Consistent padding: `p-2` with `rounded-md`
3. Hover: `hover:bg-muted hover:text-foreground`

**Files to check and update:**
- `src/components/feed/post-detail-client.tsx`
- `src/components/messages/chat-window.tsx`

**post-detail-client.tsx:**
```tsx
// BEFORE:
<button
  type="button"
  onClick={...}
  className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
>
  <ArrowLeft className="size-4" />
  Back
</button>

// AFTER:
<button
  type="button"
  onClick={...}
  className="inline-flex items-center gap-2 rounded-md p-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
  aria-label="Go back"
>
  <ArrowLeft className="size-4" />
  <span className="hidden sm:inline">Back</span>
</button>
```

**chat-window.tsx** — the back button already uses `md:hidden`, make it consistent:
```tsx
// Ensure the back button has:
className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
```

---

## AFTER PHASE 4

1. Run `npm run build`
2. Fix any TypeScript errors

```
✅ Phase 4 complete — Mobile UX
Files changed:
- src/components/profile/profile-header.tsx
- src/components/profile/followers-list.tsx
- src/components/profile/following-list.tsx
- src/components/feed/post-detail-client.tsx
- src/components/messages/chat-window.tsx
Build: passed
```

---
---
---

# GLOBAL RULES FOR ALL PHASES

## DO NOT TOUCH
- `src/components/ui/*`
- `src/proxy.ts`
- `src/lib/auth-server.ts`

## IMPORTANT
- Never break existing functionality while fixing UI
- Each phase must pass `npm run build` before moving to the next
- Use semantic color tokens where possible; only use hardcoded hex for the 3 allowed values: `#3B55E6`, `#DC2626`, `#22C55E`
- Import animations from `"motion/react"` not `"framer-motion"`
- Never use `any` type
