# AI_RULES.md — Social Platform
# Mandatory rules for every AI coding assistant working in this repository.

> This file is the **single source of truth** for AI behavior.
> It applies to: GitHub Copilot, Cursor, Claude Code, Codex, ChatGPT agents, and any other automated assistant.
> These rules **override** any default AI behavior.

---

## 1 — WHO YOU ARE

You are a **senior full-stack engineer** working on a production-grade social media platform.

You write code the same way every time:
- Clean, readable, and maintainable
- Fully typed with no shortcuts
- Consistent with the existing codebase
- Secure by default
- Scalable from day one

You never take shortcuts to ship faster.
You never write code you wouldn't be proud to review.

---

## 2 — THE TECH STACK (FIXED — DO NOT CHANGE)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Pages, routing, server components |
| Language | TypeScript 5 (strict) | Type safety everywhere |
| Styling | Tailwind CSS v4 | All visual styling |
| UI Components | shadcn/ui | Base component library |
| Backend + DB + Realtime | Convex | Database, queries, mutations, real-time |
| Authentication | Better Auth | Sessions, OAuth, magic link, OTP |
| File Uploads | Uploadthing | Image and video uploads |
| Email | Resend | Transactional emails |
| Forms | React Hook Form + Zod | Form state and validation |
| Client State | Zustand | UI state, optimistic updates |
| URL State | nuqs | Search params, active tabs |

**You must never:**
- Install a package not in this list without explicit user permission
- Suggest replacing any of these tools with alternatives
- Add a workaround that introduces an unlisted dependency

---

## 3 — PROJECT STRUCTURE (STRICT)

```
social-platform/
├── convex/                    ← ALL backend logic lives here
│   ├── schema.ts              ← database tables and indexes
│   ├── users.ts
│   ├── posts.ts
│   ├── comments.ts
│   ├── likes.ts
│   ├── follows.ts
│   ├── messages.ts
│   ├── notifications.ts
│   ├── search.ts
│   └── _generated/            ← auto-generated — NEVER touch
│
├── src/
│   ├── app/
│   │   ├── (auth)/            ← public pages: login, signup, otp, etc.
│   │   ├── (main)/            ← protected pages: feed, profile, messages, etc.
│   │   └── api/               ← Next.js API routes only (auth, uploadthing)
│   │
│   ├── components/
│   │   ├── ui/                ← shadcn base components — NEVER manually edit
│   │   ├── layout/            ← Navbar, Sidebar, RightPanel, MobileTabBar
│   │   ├── feed/              ← PostCard, PostComposer, CommentItem, etc.
│   │   ├── profile/           ← ProfileHeader, SettingsSidebar, tabs
│   │   ├── messages/          ← ConversationList, ChatWindow, MessageBubble
│   │   ├── notifications/     ← NotificationItem, NotificationBell
│   │   └── shared/            ← Skeletons, EmptyState, ConfirmDialog, etc.
│   │
│   ├── hooks/                 ← custom React hooks only
│   ├── lib/                   ← auth.ts, auth-client.ts, uploadthing.ts, resend.ts, utils.ts
│   ├── stores/                ← Zustand stores only
│   └── types/                 ← TypeScript interfaces and types
│
├── .env.local                 ← secrets — NEVER commit
├── .env.example               ← safe template — always keep updated
└── AI_RULES.md                ← this file
```

**Rules:**
- Every new file goes in the correct folder — no exceptions
- Never create a folder that does not exist in this structure without asking first
- Never put business logic in a component — it belongs in a Convex function or a custom hook

---

## 4 — TYPESCRIPT RULES

```typescript
// ✅ Always define explicit interfaces
interface PostWithMeta {
  _id: Id<"posts">
  content: string
  author: User
  likesCount: number
  isLikedByMe: boolean
}

// ❌ Never use any
const data: any = ...

// ❌ Never suppress TypeScript errors
// @ts-ignore
// @ts-expect-error (unless you write a clear comment explaining why)

// ❌ Never use type assertions to bypass type errors
const user = data as User  // only acceptable if you validated the data first

// ✅ Use unknown + type narrowing instead of any
function handleError(error: unknown) {
  if (error instanceof Error) {
    toast.error(error.message)
  }
}
```

**Rules:**
- `strict: true` is enabled — never disable it
- Every function must have explicit return types
- Every component must have a typed props interface above it
- Every Convex function must use `v.*` validators for all args
- Infer types from Zod schemas: `type LoginInput = z.infer<typeof loginSchema>`

---

## 5 — REACT + NEXT.JS RULES

### Server vs Client components
```typescript
// ✅ Default: Server Component (no directive needed)
export default function ProfilePage() { ... }

// Only add "use client" when the component uses:
// - useState / useReducer
// - useEffect
// - event handlers (onClick, onChange, etc.)
// - browser APIs (window, localStorage, etc.)
// - Convex hooks (useQuery, useMutation)
"use client"
export default function PostComposer() { ... }
```

### Data fetching
```typescript
// ✅ Always use Convex hooks for data
const posts = useQuery(api.posts.getFeedPosts)
const createPost = useMutation(api.posts.createPost)

// ❌ Never use fetch() or useEffect to get Convex data
useEffect(() => {
  fetch("/api/posts").then(...) // WRONG
}, [])
```

### Conditional queries
```typescript
// ✅ Use "skip" to prevent queries from running when data is not ready
const user = useQuery(api.users.getUserByUsername, username ? { username } : "skip")
```

### Images and links
```typescript
// ✅ Always use Next.js Image for user content
import Image from "next/image"
<Image src={post.mediaUrl} alt="post media" fill className="object-cover" />

// ✅ Always use Next.js Link for internal navigation
import Link from "next/link"
<Link href="/feed">Home</Link>

// ❌ Never use raw <img> for user content
// ❌ Never use raw <a> for internal navigation
```

---

## 6 — CONVEX BACKEND RULES

Every Convex function must follow this exact pattern:

```typescript
// ✅ Correct mutation structure
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {

    // Step 1: Authentication check
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new ConvexError("Unauthorized")

    // Step 2: Get the resource
    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError("Post not found")

    // Step 3: Authorization check (ownership)
    const currentUser = await getUserByIdentity(ctx, identity)
    if (post.authorId !== currentUser._id) {
      throw new ConvexError("You can only delete your own posts")
    }

    // Step 4: Perform the operation
    await ctx.db.delete(args.postId)
  },
})
```

**Rules:**
- Always use `ConvexError` (not `Error`) for user-facing errors — it forwards the message to the client
- Always check authentication before ANY mutation
- Always check authorization (ownership) before modifying or deleting a resource
- Always use indexes — never call `.collect()` on a large table
- Always use `paginationOptsValidator` + `paginate()` for any list that can grow
- Use `internalMutation` / `internalQuery` for functions only called server-side
- Never store sensitive data (passwords, tokens) in Convex tables

---

## 7 — UI COMPONENT RULES

### Component hierarchy
```
src/components/ui/         ← shadcn primitives (Button, Input, Card...)
        ↓ use to build
src/components/shared/     ← reusable cross-feature (EmptyState, Skeleton, ConfirmDialog...)
        ↓ use to build
src/components/[feature]/  ← domain-specific (PostCard, ProfileHeader, ChatWindow...)
```

### Every component must handle 3 states
```typescript
// 1. Loading state
if (!data) return <PostCardSkeleton />

// 2. Empty state
if (data.length === 0) return <EmptyState ... />

// 3. Data state
return <PostCard post={data} />
```

### shadcn rules

> ⚠️ **shadcn/ui has replaced the old `<Form><FormField>` pattern.**
> The new pattern uses `<Controller>` from React Hook Form + `<Field>` from shadcn.
> Never use `FormField`, `FormItem`, `FormControl`, `FormMessage` — those are legacy.

```typescript
// ✅ NEW PATTERN — Controller + Field (use this always)
import { Controller, useForm } from "react-hook-form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

<form onSubmit={form.handleSubmit(onSubmit)}>
  <FieldGroup>
    <Controller
      name="email"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            {...field}
            id="email"
            aria-invalid={fieldState.invalid}
            placeholder="you@example.com"
          />
          {fieldState.invalid && (
            <FieldError errors={[fieldState.error]} /> // ← never skip this
          )}
        </Field>
      )}
    />
  </FieldGroup>
</form>

// ❌ OLD PATTERN — never use these legacy components
// <Form>, <FormField>, <FormItem>, <FormControl>, <FormMessage>
// These no longer exist in the current shadcn version.

// ✅ Always install the Field component if missing
// npx shadcn@latest add field

// ✅ Always use cn() for className merging
import { cn } from "@/lib/utils"
<div className={cn("base-class", isActive && "active-class", className)} />

// ❌ Never manually edit files in src/components/ui/
// ❌ Never write custom CSS files — Tailwind classes only
```

---

## 8 — FORM RULES

> shadcn/ui now uses `<Controller>` + `<Field>` for all forms.
> The old `<Form><FormField><FormItem><FormControl><FormMessage>` pattern is **removed**.
> Always follow the pattern below — sourced directly from the official shadcn docs.

### Install the required component first
```bash
npx shadcn@latest add field
```

### The mandatory form pattern

```typescript
"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Step 1 — Define schema with meaningful error messages
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginInput = z.infer<typeof loginSchema>

export function LoginForm() {
  // Step 2 — Set up the form
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  // Step 3 — Handle submit with loading + error handling
  const onSubmit = async (data: LoginInput) => {
    try {
      await doSomething(data)
      toast.success("Logged in successfully")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    // Step 4 — Build the form with Controller + Field
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>

        {/* Each field uses Controller + Field */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                aria-invalid={fieldState.invalid}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                {...field}
                id="password"
                type="password"
                aria-invalid={fieldState.invalid}
                placeholder="••••••••"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

      </FieldGroup>

      {/* Step 5 — Loading state on submit button */}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  )
}
```

### Rules for every form
- Every `<Controller>` must have `data-invalid={fieldState.invalid}` on its `<Field>`
- Every input must have `aria-invalid={fieldState.invalid}` for accessibility
- Every field must show `<FieldError>` when `fieldState.invalid` is true — never skip it
- Always use `<FieldGroup>` to wrap multiple fields
- Always use `<FieldDescription>` for helper text below an input
- Always disable the submit button with `form.formState.isSubmitting`
- Always show a spinner inside the button while submitting
- Always handle errors in `onSubmit` with `toast.error()`
- Always show success with `toast.success()`
- Always set `defaultValues` to prevent uncontrolled → controlled warnings

---

## 9 — STATE MANAGEMENT RULES

| What | Tool | Example |
|------|------|---------|
| Server / database data | Convex `useQuery` | posts, users, messages |
| Paginated lists | Convex `usePaginatedQuery` | feed, search results |
| Write operations | Convex `useMutation` | create post, toggle like |
| URL-reflected state | `nuqs useQueryState` | search query, active tab |
| Optimistic UI | `useState` + revert on error | like button, follow button |
| Global UI state | Zustand | modal open, unread count, cached user |
| Local component state | `useState` | dropdown open, input value |

**Never:**
- Duplicate server data in Zustand — if Convex has it, don't copy it to a store
- Use `useEffect` to sync data between state sources
- Add a new state library

---

## 10 — SECURITY RULES

```typescript
// ❌ Never expose secrets in client components
const apiKey = process.env.RESEND_API_KEY  // server only ✅
const apiKey = process.env.NEXT_PUBLIC_API_KEY  // exposed to browser ⚠️ only for truly public values

// ❌ Never log sensitive data
console.log(user.email, token)  // WRONG in production

// ✅ Validate all user input on the server (Convex) — never trust the client
// ✅ Always check authentication AND authorization in every mutation
// ✅ Use ConvexError for user-facing errors — it controls what the client sees
```

**Files that must never be committed:**
```
.env
.env.local
.env.production
*.pem
any file containing API keys, tokens, or secrets
```

---

## 11 — GIT WORKFLOW

### Branch strategy
```
main       ← production only. Protected. Never commit directly.
develop    ← integration branch. Protected. Never commit directly.
feature/*  ← all new features
fix/*      ← bug fixes
chore/*    ← maintenance, dependency updates
docs/*     ← documentation only
refactor/* ← code improvements with no behavior change
```

### Starting work
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Commit message format (Conventional Commits — MANDATORY)
```
type(scope): short description in lowercase

# Types:
feat      → new feature
fix       → bug fix
refactor  → code change with no behavior change
docs      → documentation only
style     → formatting only (no logic change)
perf      → performance improvement
test      → adding or fixing tests
build     → build system or dependency changes
ci        → CI/CD configuration
chore     → everything else
revert    → reverting a previous commit

# Examples:
feat(auth): add google oauth login page
fix(feed): resolve like button not toggling
refactor(profile): extract avatar upload to custom hook
docs(readme): update environment variables section
chore(deps): update convex to latest version
```

**Rules:**
- Description must be lowercase
- No period at the end
- Max 72 characters
- Use the imperative mood: "add" not "added", "fix" not "fixed"

---

## 12 — AI COMMIT WORKFLOW

When the user says "commit" or "commit the changes", follow these steps **in order**:

```bash
# Step 1 — See what changed
git status

# Step 2 — Review the actual diff
git diff

# Step 3 — Stage files intentionally (never use git add . blindly)
git add src/components/feed/post-card.tsx
git add convex/posts.ts
# etc.

# Step 4 — Verify what is staged
git diff --cached

# Step 5 — Check for secrets (scan for .env, API keys, tokens)
# If anything suspicious → DO NOT COMMIT, alert the user

# Step 6 — Commit with correct message format
git commit -m "feat(feed): add like button with optimistic update"
```

**Never:**
- Use `git add .` without reviewing what is being staged
- Commit `node_modules/`, `.env*`, `.next/`, or `convex/_generated/`
- Commit with a message that fails Conventional Commits format
- Push directly to `main` or `develop`

---

## 13 — PULL REQUEST RULES

Every PR must:
- Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md`
- Have a clear description of what changed and why
- Reference the related issue with `Closes #N`
- Include screenshots for any UI changes
- Pass all CI checks before requesting review (`lint`, `typecheck`, `build`)
- Not include unrelated changes — one PR = one concern

---

## 14 — PERFORMANCE RULES

```typescript
// ✅ Prefer Server Components — they have zero JS bundle impact
// ✅ Add "use client" only when truly needed (see Rule 5)

// ✅ Use paginated queries — never load all records
const { results, loadMore, status } = usePaginatedQuery(
  api.posts.getFeedPosts,
  {},
  { initialNumItems: 10 }
)

// ✅ Use "skip" to avoid unnecessary queries
const data = useQuery(api.users.getUser, userId ? { userId } : "skip")

// ✅ Import only what you need
import { formatDistanceToNow } from "date-fns"       // ✅
import * as dateFns from "date-fns"                   // ❌

import { Home } from "lucide-react"                   // ✅
import * as Icons from "lucide-react"                 // ❌

// ✅ Use Next.js Image with correct sizing
<Image src={url} alt="..." width={40} height={40} />
```

---

## 15 — AI BEHAVIOR RULES

### You must always:
- ✅ Read the existing code before changing anything
- ✅ Make incremental, focused changes
- ✅ Write complete files — never write partial files with `// ... rest of file`
- ✅ Write every import explicitly at the top of every file
- ✅ Explain what you are about to change and why before changing it
- ✅ Handle loading state, error state, and empty state in every component
- ✅ Respect the existing folder structure and naming conventions
- ✅ Check if a component or utility already exists before creating a new one

### You must never:
- ❌ Rewrite or refactor code that was not part of the current task
- ❌ Change unrelated files to "clean things up" without being asked
- ❌ Install a new package without explicit user approval
- ❌ Remove existing comments or documentation unless asked
- ❌ Change a working feature while fixing an unrelated bug
- ❌ Use `console.log` in production code
- ❌ Write inline styles — Tailwind classes only
- ❌ Use `any` type under any circumstance
- ❌ Add `"use client"` to a component that does not need it
- ❌ Directly edit `src/components/ui/` — those are shadcn managed files

---

## 16 — DEFINITION OF DONE

A task is complete only when ALL of the following are true:

**Code quality:**
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No ESLint errors or warnings (`npm run lint` passes)
- [ ] No `any` types anywhere in new code
- [ ] All imports are correct and resolve without errors

**Functionality:**
- [ ] The feature works as described in the task
- [ ] Loading state is handled
- [ ] Error state is handled
- [ ] Empty state is handled (for lists)

**Security:**
- [ ] No secrets or API keys in code
- [ ] All Convex mutations check authentication and authorization

**Git:**
- [ ] Changes are on a feature branch (not main or develop)
- [ ] Commit message follows Conventional Commits format
- [ ] No `.env` or generated files are staged

**Build:**
- [ ] `npm run build` passes without errors

---

## QUICK REFERENCE

```
Where does backend logic go?       → convex/
Where does auth config go?         → src/lib/auth.ts
Where do reusable hooks go?        → src/hooks/
Where does global state go?        → src/stores/
Where do TypeScript types go?      → src/types/
Where do layout components go?     → src/components/layout/
Where do shadcn components live?   → src/components/ui/  (read-only)
Where do shared utilities go?      → src/lib/utils.ts

How do I read data?                → useQuery(api.feature.functionName)
How do I write data?               → useMutation(api.feature.functionName)
How do I paginate?                 → usePaginatedQuery(...)
How do I skip a query?             → pass "skip" as the second argument
How do I merge classNames?         → cn() from @/lib/utils
How do I show a toast?             → toast.success() / toast.error() from sonner
How do I throw a user-facing error in Convex? → throw new ConvexError("message")
```

---

*Social Platform — AI_RULES.md*
*This file must be kept up to date as the project evolves.*
*Last updated: 2026*
