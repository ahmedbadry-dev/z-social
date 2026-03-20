# SOCIAL PLATFORM — VERSION 1.1 PROMPTS
# Paste MASTER_SYSTEM_PROMPT first in every new Codex session, then send prompts one at a time.

---

## ⚠️ NEXT.JS 16 — BREAKING CHANGES YOU MUST FOLLOW

This project runs on **Next.js 16.x**. Two things are different from Next.js 15:

### 1. proxy.ts replaces middleware.ts ✅ (already done in this project)
The file is already named `src/proxy.ts` with `export function proxy(...)` — no action needed.

### 2. searchParams and params are now async (breaking change)
In Next.js 16, `searchParams` and `params` in Server Components are Promises.
Every page that reads searchParams MUST await them:

```tsx
// ❌ WRONG — Next.js 15 style (will crash in Next.js 16)
export default function Page({ searchParams }: { searchParams: { userId?: string } }) {
  const userId = searchParams.userId
}

// ✅ CORRECT — Next.js 16 style
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const { userId } = await searchParams
}
```

**This rule applies to every new page created in these prompts.**
Always type `searchParams` as `Promise<{...}>` and always `await` it.

---

## VERSION 1.1 OVERVIEW

You are continuing work on the Social Platform project (Version 1.0 is live on Vercel).
The stack is unchanged: Next.js 15 · Convex · Better Auth · shadcn/ui · Tailwind v4 · Zustand · TypeScript strict.

Version 1.1 adds 5 features in this exact order:
1. Dark / Light mode toggle (Phase 1)
2. RTL / LTR detection on posts only (Phase 2)
3. Followers / Following pages (Phase 3)
4. Emoji reactions on posts (Phase 4)
5. Performance & SSR optimization (Phase 5)

Complete each phase fully before moving to the next.
After each phase, the app must build and run without errors.

---

## ─────────────────────────────────────────
## PHASE 1 — DARK / LIGHT MODE TOGGLE
## ─────────────────────────────────────────

### Context

The project already has a `.dark` CSS class defined in `src/app/globals.css` with full
shadcn/ui variable overrides. The class-based dark mode strategy is already wired via:

```css
@custom-variant dark (&:is(.dark *));
```

What is missing:
- A theme provider that applies the `.dark` class to `<html>`
- A toggle button in the Navbar
- Persistence across sessions (localStorage)
- Fixing hardcoded color classes that do not respond to the dark class

The design tokens in `globals.css` are already correct — do NOT change them.
The custom Social Platform tokens (`--primary-700`, `--bg-page`, `--bg-card`, etc.)
need dark equivalents added inside the `.dark {}` block.

### What to install

```bash
npm install next-themes
```

`next-themes` is the only addition. It handles SSR flicker prevention, localStorage
persistence, and class toggling on `<html>` automatically.

### Files to create

```
src/components/providers/theme-provider.tsx
src/components/shared/theme-toggle.tsx
```

### Files to modify

```
src/app/globals.css                          ← add dark variants for custom tokens
src/app/layout.tsx                           ← wrap with ThemeProvider
src/components/layout/navbar.tsx             ← add ThemeToggle button
src/components/layout/sidebar.tsx            ← replace hardcoded colors
src/components/layout/mobile-tab-bar.tsx     ← replace hardcoded colors
src/components/layout/right-panel.tsx        ← replace hardcoded colors
src/components/layout/main-content.tsx       ← replace hardcoded colors
src/app/(main)/layout.tsx                    ← replace bg-[#F3F4F6]
src/components/feed/post-card.tsx            ← replace hardcoded colors
src/components/feed/post-composer.tsx        ← replace hardcoded colors
src/components/feed/feed-content.tsx         ← replace hardcoded colors
src/components/profile/profile-header.tsx    ← replace hardcoded colors
src/components/shared/post-skeleton.tsx      ← replace hardcoded colors
src/components/shared/empty-state.tsx        ← replace hardcoded colors
```

### Step-by-step instructions

---

#### STEP 1 — Add dark token overrides to globals.css

Inside the existing `.dark {}` block in `src/app/globals.css`, add these lines
after the existing shadcn variable overrides:

```css
.dark {
  /* existing shadcn variables stay unchanged */

  /* Social Platform custom token overrides */
  --bg-page: #0f172a;
  --bg-card: #1e293b;
  --neutral-800: #f1f5f9;
  --neutral-700: #e2e8f0;
  --neutral-600: #cbd5e1;
  --neutral-500: #94a3b8;
  --neutral-400: #64748b;
  --neutral-300: #475569;
  --neutral-200: #334155;
  --neutral-100: #1e293b;
  --primary-100: #1e2a5e;
}
```

---

#### STEP 2 — Create ThemeProvider

Create `src/components/providers/theme-provider.tsx`:

```tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

---

#### STEP 3 — Wrap root layout with ThemeProvider

In `src/app/layout.tsx`, import `ThemeProvider` and wrap the body content:

```tsx
import { ThemeProvider } from "@/components/providers/theme-provider"

// Inside <body>:
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
  <ConvexClientProvider initialToken={initialToken}>
    <NuqsAdapter>
      {children}
      <Toaster position="bottom-right" richColors />
    </NuqsAdapter>
  </ConvexClientProvider>
</ThemeProvider>
```

---

#### STEP 4 — Create ThemeToggle component

Create `src/components/shared/theme-toggle.tsx`:

```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Toggle theme">
        <Sun className="size-4" />
      </Button>
    )
  }

  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
```

---

#### STEP 5 — Add ThemeToggle to Navbar

In `src/components/layout/navbar.tsx`, import `ThemeToggle` and add it between
the search bar and the logout button:

```tsx
import { ThemeToggle } from "@/components/shared/theme-toggle"

// In the JSX, inside the header flex container:
<ThemeToggle />
```

---

#### STEP 6 — Replace hardcoded colors across all components

Go through every file listed under "Files to modify" and apply this replacement guide:

| Hardcoded value | Replace with Tailwind semantic class |
|---|---|
| `bg-white` (cards, panels) | `bg-card` |
| `bg-[#F3F4F6]` (page bg) | `bg-background` |
| `bg-[#F1F5F9]` (hover, input bg) | `bg-muted` |
| `bg-[#F8FAFC]` (comment section) | `bg-muted` |
| `bg-[#E2E8F0]` (skeleton, cover) | `bg-muted` |
| `text-[#0F172A]` (primary text) | `text-foreground` |
| `text-[#64748B]` (secondary text) | `text-muted-foreground` |
| `text-[#94A3B8]` (hint text) | `text-muted-foreground` |
| `border-neutral-200` (borders) | `border-border` |
| `text-[#3B55E6]` (brand blue, keep as is) | leave hardcoded — brand color |
| `fill-[#3B55E6]` (liked icon fill) | leave hardcoded — brand color |
| `hover:bg-[#F1F5F9]` | `hover:bg-muted` |
| `hover:text-[#0F172A]` | `hover:text-foreground` |

**Important rules:**
- Only replace in the files listed above — do not touch `src/components/ui/*`
- Keep brand blue `#3B55E6` hardcoded — it is intentional and part of the design system
- Keep destructive red hardcoded where used for delete actions
- The skeleton pulse colors (`animate-pulse bg-[#E2E8F0]`) → change to `animate-pulse bg-muted`
- Cover image placeholder `bg-[#E2E8F0]` → `bg-muted`
- Active nav item `bg-[#F1F5F9]` → `bg-muted`

---

#### STEP 7 — Fix main layout background

In `src/app/(main)/layout.tsx`:

```tsx
// Before:
<div className="min-h-screen bg-[#F3F4F6]">

// After:
<div className="min-h-screen bg-background">
```

---

### Verification checklist

After completing Phase 1:
- [ ] Toggle button appears in Navbar (Sun/Moon icon)
- [ ] Clicking toggle switches between light and dark mode
- [ ] Preference is saved in localStorage (refresh the page — mode persists)
- [ ] System preference is respected on first load
- [ ] No white flash on page load in dark mode (next-themes handles this)
- [ ] Cards turn dark in dark mode (bg-card)
- [ ] Page background turns dark (bg-background)
- [ ] Text is readable in both modes
- [ ] Brand blue (#3B55E6) stays consistent in both modes
- [ ] Skeletons animate in dark mode
- [ ] Toaster (sonner) respects dark mode (it uses the theme class automatically)
- [ ] `npm run build` passes with no errors

---

### ✅ Phase 1 checkpoint

When done, reply with exactly:
```
✅ Phase 1 complete — Dark/Light mode
Branch: feature/dark-light-mode
Files changed: [list]
Next: Phase 2 — RTL/LTR on posts
```

---

## ─────────────────────────────────────────
## PHASE 2 — RTL / LTR DETECTION ON POSTS
## ─────────────────────────────────────────

### Context

When a user writes a post in Arabic, Hebrew, or any RTL language, the text should
automatically align right-to-left. For LTR languages (English, etc.) the text stays
left-to-right as it is now.

Scope: post content text only — `post-card.tsx` and `post-composer.tsx`.
Do NOT apply RTL to the rest of the UI (sidebar, navbar, profile, etc.).
This is intentional — full RTL support for the whole UI is planned for a later version.

### No new packages needed

Use the browser's built-in `dir="auto"` attribute on text elements.
This attribute makes the browser detect the direction automatically per paragraph.

### How RTL detection works

The HTML `dir="auto"` attribute reads the first strong directional character in the
text and applies `rtl` or `ltr` accordingly. This is zero-cost, no JS needed.

For the textarea in the composer, also add `dir="auto"` so the user sees the
correct direction as they type.

### Files to modify

```
src/components/feed/post-card.tsx      ← add dir="auto" to content <p>
src/components/feed/post-composer.tsx  ← add dir="auto" to <textarea>
src/components/feed/comment-item.tsx   ← add dir="auto" to comment content
```

### Step-by-step instructions

---

#### STEP 1 — Post content in PostCard

In `src/components/feed/post-card.tsx`, find the post content paragraph:

```tsx
// Before:
<p className="whitespace-pre-wrap text-sm text-[#0F172A]">{post.content}</p>

// After:
<p dir="auto" className="whitespace-pre-wrap text-sm text-foreground">{post.content}</p>
```

---

#### STEP 2 — Textarea in PostComposer

In `src/components/feed/post-composer.tsx`, find the `<Textarea>` component:

```tsx
// Add dir="auto" to the Textarea props:
<Textarea
  dir="auto"
  // ... rest of existing props
/>
```

---

#### STEP 3 — Comment content in CommentItem

In `src/components/feed/comment-item.tsx`, find the comment text:

```tsx
// Add dir="auto" to the comment content paragraph:
<p dir="auto" className="...existing classes...">{comment.content}</p>
```

---

### Verification checklist

After completing Phase 2:
- [ ] Type an Arabic post → text aligns right automatically
- [ ] Type an English post → text aligns left as normal
- [ ] Mixed content → direction follows the first strong character
- [ ] Comment input accepts RTL text correctly
- [ ] No other UI elements are affected
- [ ] Works in both light and dark mode

---

### ✅ Phase 2 checkpoint

When done, reply with exactly:
```
✅ Phase 2 complete — RTL/LTR on posts
Branch: feature/rtl-ltr-posts
Files changed: [list]
Next: Phase 3 — Followers/Following pages
```

---

## ─────────────────────────────────────────
## PHASE 3 — FOLLOWERS / FOLLOWING PAGES
## ─────────────────────────────────────────

### Context

Currently, `profile-header.tsx` shows Followers and Following as plain numbers.
They need to become clickable links that open dedicated pages showing the list of users.

The Following page must allow the current user to unfollow people directly from the list.
The Followers page is read-only (just shows who follows you).

The Convex backend already has all the data needed:
- `convex/follows.ts` has `toggleFollow` mutation and `getFollowStatus` query
- `convex/users.ts` has `getUserProfile` query
- `convex/schema.ts` has the `follows` table with `by_follower` and `by_following` indexes

### New Convex queries needed

Add two new queries to `convex/follows.ts`:

```typescript
// Returns list of users who follow targetUserId
export const getFollowers = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => { ... }
})

// Returns list of users that targetUserId follows
export const getFollowing = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => { ... }
})
```

Each user object returned must include:
```typescript
{
  userId: string
  name: string | null
  image: string | null
  isFollowedByMe: boolean   // needed for unfollow button on Following page
}
```

To get `name` and `image`, look them up from the `posts` table (same strategy
already used in `getSuggestedUsers` in `convex/users.ts`) OR from Better Auth
user data via `ctx.auth`. Use the posts table approach to stay consistent.

### New pages and routes

```
src/app/(main)/profile/followers/page.tsx
src/app/(main)/profile/following/page.tsx
```

Both pages receive the `userId` from the URL search params:
```
/profile/followers?userId=abc123
/profile/following?userId=abc123
```

### New components

```
src/components/profile/followers-list.tsx
src/components/profile/following-list.tsx
src/components/profile/user-list-item.tsx   ← shared, reusable
```

### Files to modify

```
src/components/profile/profile-header.tsx   ← make Followers/Following clickable
convex/follows.ts                            ← add getFollowers and getFollowing queries
src/proxy.ts                                 ← no change needed (profile/* already public)
```

### Step-by-step instructions

---

#### STEP 1 — Add getFollowers and getFollowing to convex/follows.ts

```typescript
export const getFollowers = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const followerDocs = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect()

    return Promise.all(
      followerDocs.map(async (doc) => {
        // Get name/image from most recent post
        const post = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", doc.followerId))
          .order("desc")
          .first()

        const isFollowedByMe = currentUserId
          ? !!(await ctx.db
              .query("follows")
              .withIndex("by_pair", (q) =>
                q.eq("followerId", currentUserId).eq("followingId", doc.followerId)
              )
              .unique())
          : false

        return {
          userId: doc.followerId,
          name: post?.authorName ?? null,
          image: post?.authorImage ?? null,
          isFollowedByMe,
        }
      })
    )
  },
})

export const getFollowing = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const followingDocs = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect()

    return Promise.all(
      followingDocs.map(async (doc) => {
        const post = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", doc.followingId))
          .order("desc")
          .first()

        const isFollowedByMe = currentUserId
          ? !!(await ctx.db
              .query("follows")
              .withIndex("by_pair", (q) =>
                q.eq("followerId", currentUserId).eq("followingId", doc.followingId)
              )
              .unique())
          : false

        return {
          userId: doc.followingId,
          name: post?.authorName ?? null,
          image: post?.authorImage ?? null,
          isFollowedByMe,
        }
      })
    )
  },
})
```

---

#### STEP 2 — Create UserListItem shared component

Create `src/components/profile/user-list-item.tsx`:

A single row showing:
- UserAvatar (size md)
- Name (truncated, bold)
- "Follow" / "Following" button (only shown when `showFollowButton` is true)
- Unfollow confirmation: clicking "Following" button directly unfollows (no confirm dialog needed)

Props:
```typescript
interface UserListItemProps {
  userId: string
  name: string | null
  image: string | null
  isFollowedByMe: boolean
  showFollowButton: boolean  // false on Followers page when viewing own profile
}
```

The follow button uses `api.follows.toggleFollow` mutation with optimistic UI
(same pattern as `profile-header.tsx`).

Styling must use semantic Tailwind classes (bg-card, text-foreground, etc.)
so it works in both light and dark mode.

---

#### STEP 3 — Create FollowersList component

Create `src/components/profile/followers-list.tsx`:

```typescript
"use client"
// Uses useQuery(api.follows.getFollowers, { userId })
// Shows list of UserListItem components
// showFollowButton = true always (you can follow your followers back)
// Empty state: "No followers yet"
// Loading state: 3 skeleton rows
```

---

#### STEP 4 — Create FollowingList component

Create `src/components/profile/following-list.tsx`:

```typescript
"use client"
// Uses useQuery(api.follows.getFollowing, { userId })
// Shows list of UserListItem components
// showFollowButton = true (the current user can unfollow from this list)
// Empty state: "Not following anyone yet"
// Loading state: 3 skeleton rows
```

---

#### STEP 5 — Create Followers page

Create `src/app/(main)/profile/followers/page.tsx`:

```tsx
// ⚠️ Next.js 16: searchParams is a Promise — always await it
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FollowersList } from "@/components/profile/followers-list"

export const metadata = { title: "Followers" }

export default async function FollowersPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const { userId } = await searchParams

  if (!userId) {
    return <div className="text-muted-foreground p-8 text-center">User not found.</div>
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile?userId=${userId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Followers</h1>
      </div>
      <FollowersList userId={userId} />
    </div>
  )
}
```

---

#### STEP 6 — Create Following page

Create `src/app/(main)/profile/following/page.tsx`:

```tsx
// ⚠️ Next.js 16: searchParams is a Promise — always await it
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FollowingList } from "@/components/profile/following-list"

export const metadata = { title: "Following" }

export default async function FollowingPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const { userId } = await searchParams

  if (!userId) {
    return <div className="text-muted-foreground p-8 text-center">User not found.</div>
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile?userId=${userId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Following</h1>
      </div>
      <FollowingList userId={userId} />
    </div>
  )
}
```

---

#### STEP 7 — Make stats clickable in ProfileHeader

In `src/components/profile/profile-header.tsx`, the stats section currently renders
plain `<div>` elements. Wrap Followers and Following in `<Link>`:

```tsx
import Link from "next/link"

// Replace the stats map with explicit items:
<div className="mt-5 flex items-center gap-8">
  {/* Posts — not clickable */}
  <div className="text-center">
    <p className="text-lg font-bold text-foreground">{postsCount}</p>
    <p className="text-xs text-muted-foreground">Posts</p>
  </div>

  {/* Followers — clickable */}
  <Link
    href={`/profile/followers?userId=${userId}`}
    className="text-center hover:opacity-75 transition-opacity"
  >
    <p className="text-lg font-bold text-foreground">{followers}</p>
    <p className="text-xs text-muted-foreground">Followers</p>
  </Link>

  {/* Following — clickable */}
  <Link
    href={`/profile/following?userId=${userId}`}
    className="text-center hover:opacity-75 transition-opacity"
  >
    <p className="text-lg font-bold text-foreground">{followingCount}</p>
    <p className="text-xs text-muted-foreground">Following</p>
  </Link>
</div>
```

---

### Verification checklist

After completing Phase 3:
- [ ] Clicking "Followers" number → navigates to `/profile/followers?userId=...`
- [ ] Followers page shows list of users who follow you
- [ ] Clicking "Following" number → navigates to `/profile/following?userId=...`
- [ ] Following page shows list of users you follow
- [ ] Unfollow button works on Following page with optimistic update
- [ ] Back button returns to the correct profile page
- [ ] Empty states display correctly
- [ ] Loading skeletons show while data loads
- [ ] Works on mobile (responsive)
- [ ] Works in dark mode

---

### ✅ Phase 3 checkpoint

When done, reply with exactly:
```
✅ Phase 3 complete — Followers/Following pages
Branch: feature/followers-following-pages
Files changed: [list]
Next: Phase 4 — Emoji reactions
```

---

## ─────────────────────────────────────────
## PHASE 4 — EMOJI REACTIONS ON POSTS
## ─────────────────────────────────────────

### Context

Currently posts support only a single "like" (ThumbsUp). We need to replace this
with a multi-reaction system similar to LinkedIn/Facebook: users can pick one reaction
per post from a set of emoji options.

The 6 reactions (matching popular social platforms):
```
👍  Like      → type: "like"
❤️  Love      → type: "love"
😂  Haha      → type: "haha"
😮  Wow       → type: "wow"
😢  Sad       → type: "sad"
😠  Angry     → type: "angry"
```

### Database changes

The current `likes` table stores `{ postId, userId, createdAt }`.
We need to add a `reactionType` field.

Add to `convex/schema.ts` in the `likes` table:

```typescript
likes: defineTable({
  postId: v.id("posts"),
  userId: v.string(),
  reactionType: v.union(
    v.literal("like"),
    v.literal("love"),
    v.literal("haha"),
    v.literal("wow"),
    v.literal("sad"),
    v.literal("angry")
  ),
  createdAt: v.number(),
})
  .index("by_post", ["postId"])
  .index("by_user", ["userId"])
  .index("by_post_user", ["postId", "userId"]),
```

**Migration note:** Existing records in the `likes` table do not have `reactionType`.
Handle this by making `reactionType` default to `"like"` when reading old records.
In Convex, use `v.optional(v.union(...))` and treat `undefined` as `"like"` in queries.

Actually use this schema to be safe with existing data:
```typescript
reactionType: v.optional(v.union(
  v.literal("like"),
  v.literal("love"),
  v.literal("haha"),
  v.literal("wow"),
  v.literal("sad"),
  v.literal("angry")
)),
```

---

### Convex changes

#### Update `convex/posts.ts` — `buildPostWithMeta` function

The function currently returns `isLikedByMe: boolean`. Change to:

```typescript
// Old:
isLikedByMe: boolean
likesCount: number

// New:
myReaction: "like" | "love" | "haha" | "wow" | "sad" | "angry" | null
reactionsCount: number
reactionsSummary: Array<{ type: string; count: number }>
```

Implementation in `buildPostWithMeta`:

```typescript
const allReactions = await ctx.db
  .query("likes")
  .withIndex("by_post", (q) => q.eq("postId", post._id))
  .collect()

const reactionsCount = allReactions.length

// Group by type for the summary bar
const reactionsSummary = Object.entries(
  allReactions.reduce((acc, r) => {
    const type = r.reactionType ?? "like"
    acc[type] = (acc[type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
)
  .map(([type, count]) => ({ type, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 3) // show top 3 reaction types

const myReactionDoc = currentUserId
  ? await ctx.db
      .query("likes")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", post._id).eq("userId", currentUserId)
      )
      .unique()
  : null

const myReaction = myReactionDoc
  ? (myReactionDoc.reactionType ?? "like")
  : null
```

#### Update `convex/posts.ts` — `toggleLike` mutation

Rename to `toggleReaction` and add `reactionType` arg:

```typescript
export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    reactionType: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("haha"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", args.postId).eq("userId", currentUserId)
      )
      .unique()

    if (existing) {
      if (existing.reactionType === args.reactionType) {
        // Same reaction → remove it (toggle off)
        await ctx.db.delete(existing._id)
      } else {
        // Different reaction → update it
        await ctx.db.patch(existing._id, { reactionType: args.reactionType })
      }
    } else {
      // No reaction → add it
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: currentUserId,
        reactionType: args.reactionType,
        createdAt: Date.now(),
      })

      // Only notify on first reaction (not on change)
      const post = await ctx.db.get(args.postId)
      if (post && post.authorId !== currentUserId) {
        await ctx.db.insert("notifications", {
          userId: post.authorId,
          actorId: currentUserId,
          type: "like",
          postId: args.postId,
          read: false,
          createdAt: Date.now(),
        })
      }
    }
  },
})

// Keep toggleLike as an alias for backward compatibility:
export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    // Delegates to toggleReaction with "like" type
    // Copy the same logic here with reactionType hardcoded to "like"
  },
})
```

---

### TypeScript types

Update `src/types/index.ts` — change `PostCardData`:

```typescript
export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

export interface ReactionSummary {
  type: ReactionType
  count: number
}

export interface PostCardData {
  // ... existing fields ...
  // Remove: isLikedByMe: boolean
  // Remove: likesCount: number
  // Add:
  myReaction: ReactionType | null
  reactionsCount: number
  reactionsSummary: ReactionSummary[]
}
```

---

### New component — ReactionBar

Create `src/components/feed/reaction-bar.tsx`:

This component renders the reaction picker only (not the full action bar).

**Behavior:**
- Default state: shows "Like" button with 👍 icon (or the user's current reaction emoji)
- On mouse enter (desktop): a popover appears ABOVE with 6 emoji options in a row
- On click (mobile): toggles the popover
- Close on mouse leave with 300ms delay to avoid flicker
- Clicking an emoji: selects that reaction (or deselects if same emoji clicked again)
- Optimistic UI: update immediately before the mutation

**Reaction config:**
```typescript
const REACTIONS = [
  { type: "like",  emoji: "👍", label: "Like"  },
  { type: "love",  emoji: "❤️", label: "Love"  },
  { type: "haha",  emoji: "😂", label: "Haha"  },
  { type: "wow",   emoji: "😮", label: "Wow"   },
  { type: "sad",   emoji: "😢", label: "Sad"   },
  { type: "angry", emoji: "😠", label: "Angry" },
] as const
```

**Component implementation approach:**
- Use shadcn `<Popover>` for the emoji picker (already installed)
- Open the Popover on mouse enter (desktop) and on click (mobile)
- Close on mouse leave (desktop) with a 300ms delay to avoid flicker
- Optimistic UI: update `myReaction` and `reactionsCount` immediately before the mutation
- When user has a reaction, show that emoji + color it with text-[#3B55E6]
- When no reaction, show 👍 in muted color

**Props:**
```typescript
interface ReactionBarProps {
  postId: Id<"posts">
  myReaction: ReactionType | null
  reactionsCount: number
  reactionsSummary: ReactionSummary[]
  onReactionChange: (type: ReactionType | null, countDelta: number) => void
}
```

---

### New component — PostActions

Create `src/components/feed/post-actions.tsx`:

This is the complete action bar at the bottom of every post.
It replaces the old inline buttons in PostCard.

**Layout — LinkedIn style:**

```
[reactions summary row]
─────────────────────────────
[Like btn] [Comment btn] [Share btn]
```

**Reactions summary row (above the divider):**
- Shows top 3 reaction emojis as overlapping circles + total count
- Example: 👍❤️😂 195
- Only shown when reactionsCount > 0
- Clicking it does nothing for now (future: show who reacted)

```tsx
// Reactions summary row
{reactionsCount > 0 && (
  <div className="flex items-center gap-1.5 mb-2">
    <div className="flex -space-x-1">
      {reactionsSummary.slice(0, 3).map((r) => (
        <span
          key={r.type}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-xs ring-1 ring-border"
        >
          {REACTION_EMOJI_MAP[r.type]}
        </span>
      ))}
    </div>
    <span className="text-xs text-muted-foreground">{reactionsCount}</span>
  </div>
)}
```

**Action buttons row (below the divider):**

Three equal-width buttons, each with icon + label:

```tsx
<div className="flex items-center border-t border-border pt-2">
  {/* Like — opens reaction picker */}
  <ReactionBar ... />

  {/* Comment — toggles comment section */}
  <button className="flex flex-1 items-center justify-center gap-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors">
    <MessageCircle className="size-4" />
    <span>Comment</span>
  </button>

  {/* Share — copy link + toast */}
  <button
    className="flex flex-1 items-center justify-center gap-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
    onClick={handleShare}
  >
    <Share2 className="size-4" />
    <span>Share</span>
  </button>
</div>
```

**Share behavior:**
```typescript
const handleShare = async () => {
  const url = `${window.location.origin}/post/${postId}`
  await navigator.clipboard.writeText(url)
  toast.success("Link copied to clipboard")
}
```

Note: The post detail page (`/post/[id]`) does not exist yet — that is fine.
We copy the link as a placeholder for the future feature.

**Props:**
```typescript
interface PostActionsProps {
  postId: Id<"posts">
  myReaction: ReactionType | null
  reactionsCount: number
  reactionsSummary: ReactionSummary[]
  commentsCount: number
  onCommentToggle: () => void
}
```

---

### Update PostCard

In `src/components/feed/post-card.tsx`:

1. Remove the old action bar (the `mt-3 flex items-center justify-between border-t pt-3` div)
2. Remove `toggleLikeMutation` — reaction logic moves to `ReactionBar`
3. Replace optimistic like state:
   ```typescript
   const [optimisticReaction, setOptimisticReaction] = useState<ReactionType | null>(post.myReaction)
   const [optimisticCount, setOptimisticCount] = useState(post.reactionsCount)
   ```
4. Add `<PostActions>` at the bottom of the article, replacing the old action bar:
   ```tsx
   <PostActions
     postId={post._id}
     myReaction={optimisticReaction}
     reactionsCount={optimisticCount}
     reactionsSummary={post.reactionsSummary}
     commentsCount={post.commentsCount}
     onCommentToggle={() => setShowComments((prev) => !prev)}
     onReactionChange={(type, delta) => {
       setOptimisticReaction(type)
       setOptimisticCount((prev) => prev + delta)
     }}
   />
   ```
5. Update PostCardProps to use the new fields (`myReaction`, `reactionsCount`, `reactionsSummary`)

---

### Update FeedList and other lists

In `src/components/feed/feed-list.tsx` and any other place that passes post data
to `<PostCard>`, update the props mapping to pass `myReaction`, `reactionsCount`,
and `reactionsSummary` instead of `isLikedByMe` and `likesCount`.

Also update `src/components/profile/my-posts-tab.tsx` and
`src/components/profile/saved-posts-tab.tsx` if they pass post props to PostCard.

---

### Verification checklist

After completing Phase 4:
- [ ] Post card shows reactions summary row (👍❤️😂 195) when reactions exist
- [ ] Post card shows 3 action buttons: Like, Comment, Share
- [ ] Hovering Like button shows 6 emoji options in a popover
- [ ] Clicking an emoji reacts to the post with optimistic update
- [ ] Clicking the same emoji again removes the reaction
- [ ] Clicking a different emoji changes the reaction
- [ ] Comment button toggles the comment section
- [ ] Share button copies link and shows toast "Link copied to clipboard"
- [ ] Works on mobile (touch)
- [ ] Notification is created only on first reaction
- [ ] Existing "likes" data still displays correctly (defaults to 👍)
- [ ] Works in dark mode
- [ ] `npm run build` passes

---

### ✅ Phase 4 checkpoint

When done, reply with exactly:
```
✅ Phase 4 complete — Emoji reactions + new post card UI
Branch: v1.1/phase-4-emoji-reactions
Files changed: [list]
Next: Phase 5 — Performance & SSR optimization
```

---

## ─────────────────────────────────────────
## PHASE 5 — PERFORMANCE & SSR OPTIMIZATION
## ─────────────────────────────────────────

### Context

Version 1.0 works correctly but has several performance gaps:
- Pages render entirely on the client (no SSR data prefetching)
- No caching strategy for Convex queries
- Heavy components load all at once (no code splitting)
- Images are not optimized at the component level
- The feed loads 10 posts all at once without virtualization

This phase applies targeted optimizations following Next.js 15 and Convex best practices.
Do NOT over-engineer. Apply only what gives real measurable benefit.

### No new packages needed

Everything in this phase uses built-in Next.js and Convex APIs.

---

### Optimization 1 — Prefetch user session in Server Components

**Problem:** `getCurrentUser` runs on the client after hydration, causing a loading
flash every page load even when the user is already logged in.

**Fix:** In `src/app/(main)/layout.tsx`, prefetch the current user server-side
using `preloadAuthQuery` from `@/lib/auth-server` and pass it to the client.

```typescript
// src/app/(main)/layout.tsx
import { preloadAuthQuery } from "@/lib/auth-server"
import { api } from "../../convex/_generated/api"

export default async function MainLayout({ children }) {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUser)

  return (
    <div className="min-h-screen bg-background">
      <AuthRedirect />
      <Navbar preloadedUser={preloadedUser} />
      ...
    </div>
  )
}
```

Update `Navbar` to accept and use `preloadedUser`:
```typescript
import { usePreloadedQuery } from "convex/react"
// Use usePreloadedQuery(preloadedUser) instead of useQuery(api.auth.getCurrentUser)
```

Do the same for `Sidebar` — pass `preloadedUser` from the layout.

---

### Optimization 2 — Prefetch feed data for SSR

**Problem:** The feed page shows skeletons on every visit because data is fetched
client-side.

**Fix:** In `src/app/(main)/feed/page.tsx`, use `preloadAuthQuery` to prefetch
the first page of feed posts server-side.

```typescript
// src/app/(main)/feed/page.tsx
import { preloadAuthQuery } from "@/lib/auth-server"
import { api } from "../../../convex/_generated/api"

export default async function FeedPage() {
  // Prefetch the first 10 posts SSR
  const preloadedPosts = await preloadAuthQuery(api.posts.getFeedPosts, {
    paginationOpts: { numItems: 10, cursor: null },
  })

  return <FeedContent preloadedPosts={preloadedPosts} />
}
```

Update `FeedContent` and `FeedList` to accept and use `preloadedPosts`.

---

### Optimization 3 — Lazy load heavy components

**Problem:** `EditPostDialog`, `ConfirmDialog`, and the emoji picker load JS
even on posts where they are never opened.

**Fix:** In `src/components/feed/post-card.tsx`, lazy load these components:

```typescript
import dynamic from "next/dynamic"

const EditPostDialog = dynamic(
  () => import("@/components/feed/edit-post-dialog").then((m) => ({ default: m.EditPostDialog })),
  { ssr: false }
)

const ConfirmDialog = dynamic(
  () => import("@/components/shared/confirm-dialog").then((m) => ({ default: m.ConfirmDialog })),
  { ssr: false }
)
```

Only load the dialog JS when `editOpen` or `deleteOpen` is true.
Use a conditional render guard:

```typescript
{editOpen && <EditPostDialog ... />}
{deleteOpen && <ConfirmDialog ... />}
```

---

### Optimization 4 — Add generateMetadata for profile pages

**Problem:** Profile pages have a static `export const metadata = { title: "Profile" }`.

**Fix:** In `src/app/(main)/profile/page.tsx`, add dynamic metadata.
⚠️ In Next.js 16, `searchParams` inside `generateMetadata` is also a Promise:

```tsx
import type { Metadata } from "next"

// ✅ Next.js 16: await searchParams
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}): Promise<Metadata> {
  const { userId } = await searchParams
  if (!userId) return { title: "Profile" }

  return {
    title: "Profile",
    description: "View profile on Social",
  }
}
```

---

### Optimization 5 — Add loading.tsx for all main routes

**Problem:** Some routes are missing `loading.tsx` fallbacks.

Check which routes are missing `loading.tsx`:
```
src/app/(main)/messages/    ← missing
src/app/(main)/search/      ← missing
src/app/(main)/profile/followers/  ← new, needs one
src/app/(main)/profile/following/  ← new, needs one
```

Create a `loading.tsx` for each missing route. Use the existing `PostSkeleton`
and page-level skeleton patterns already in the codebase.

For messages and search, use a simple full-page skeleton:
```typescript
import { PageLoading } from "@/components/shared/page-loading"
export default function Loading() {
  return <PageLoading />
}
```

---

### Optimization 6 — Memoize expensive components

**Problem:** `PostCard` re-renders whenever the parent list re-renders, even if
the post data hasn't changed.

**Fix:** Wrap `PostCard` with `React.memo`:

```typescript
export const PostCard = React.memo(function PostCard({ post, currentUserId }: PostCardProps) {
  // ... existing implementation
})
```

Also memoize `UserListItem` from Phase 3 with `React.memo`.

---

### Optimization 7 — Add Suspense boundaries

**Problem:** Slow Convex queries block the entire page render.

**Fix:** Wrap data-fetching sections in `<Suspense>`:

In `src/components/layout/sidebar.tsx` (already uses AuthLoading — keep it).

In `src/app/(main)/feed/layout.tsx`:
```typescript
import { Suspense } from "react"
import { PostSkeleton } from "@/components/shared/post-skeleton"

// Wrap the right panel in Suspense:
<Suspense fallback={<RightPanelSkeleton />}>
  <RightPanelWrapper />
</Suspense>
```

---

### Optimization 8 — Optimize image loading

**Problem:** Post images load eagerly even when below the fold.

**Fix:** In `src/components/feed/post-card.tsx`, add `loading="lazy"` to post images:

```tsx
<Image
  src={post.mediaUrl}
  alt="Post media"
  width={900}
  height={500}
  loading="lazy"
  className="max-h-[400px] w-full object-cover"
/>
```

For the first post in the feed, consider `loading="eager"` to improve LCP.
But since we don't know the order at the component level, `loading="lazy"` on all
is the safe default.

---

### Verification checklist

After completing Phase 5:
- [ ] Feed page loads without showing skeletons on first visit (SSR data visible)
- [ ] Profile page has correct dynamic metadata
- [ ] EditPostDialog and ConfirmDialog JS is not loaded until opened
- [ ] `loading.tsx` exists for all main routes
- [ ] `npm run build` passes with no errors
- [ ] No TypeScript errors
- [ ] Lighthouse performance score improves vs baseline (check in DevTools)

---

### ✅ Phase 5 checkpoint — Version 1.1 complete

When done, reply with exactly:
```
✅ Phase 5 complete — Performance & SSR optimization
✅ Version 1.1 COMPLETE

Branch: feature/performance-ssr
Files changed: [list]

Summary of all Version 1.1 changes:
- Phase 1: Dark/Light mode with next-themes
- Phase 2: RTL/LTR auto-detection on posts
- Phase 3: Followers/Following pages with unfollow
- Phase 4: Emoji reactions (6 types)
- Phase 5: SSR prefetch, lazy loading, Suspense, memoization

Ready to deploy Version 1.1 to Vercel.
```

---

## HOW TO USE THESE PROMPTS WITH CODEX

1. Start a new Codex session
2. Paste `MASTER_SYSTEM_PROMPT.md` first (always)
3. Paste this line: "We are building Version 1.1. The project is fully set up and running. Start with Phase 1."
4. Paste **Phase 1 prompt only**
5. Wait for Codex to complete all steps and give you the ✅ checkpoint
6. Review the changes, run `npm run dev`, verify the checklist
7. Commit the changes (use `GIT_COMMIT_MANAGER.md` workflow)
8. Start a new session for Phase 2 — paste MASTER + this file + "Start Phase 2"

**Never send two phases in one session.** Each phase is one focused unit of work.

---

*Social Platform — Version 1.1 Prompts*
*5 phases: Dark mode · RTL · Followers/Following · Emoji reactions · Performance*
*Follows: MASTER_SYSTEM_PROMPT.md · AI_RULES.md · GIT_COMMIT_MANAGER.md*
