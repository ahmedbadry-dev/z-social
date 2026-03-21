# SOCIAL PLATFORM — VERSION 1.2 PROMPTS
# Paste MASTER_SYSTEM_PROMPT first in every new Codex session, then send prompts one at a time.

---

## VERSION 1.2 OVERVIEW

Version 1.2 adds 3 features to the messages system:
1. Chat reply (reply to a specific message) — Phase 1
2. Emoji reactions on messages — Phase 2
3. Typing indicator + Online/Offline status — Phase 3

Complete each phase fully before moving to the next.
After each phase, the app must build and run without errors.

⚠️ Next.js 16 rules apply:
- searchParams is a Promise — always await it
- No JSX.Element return types — let TypeScript infer

---

## ─────────────────────────────────────────
## PHASE 1 — CHAT REPLY
## ─────────────────────────────────────────

### Context

Users should be able to reply to a specific message in a conversation.
When replying, a preview of the original message appears above the input.
The replied-to message is shown as a quote inside the reply bubble.

This is similar to WhatsApp/Telegram reply behavior.

### Database changes

Add `replyToId` to the `messages` table in `convex/schema.ts`:

```typescript
messages: defineTable({
  content: v.string(),
  senderId: v.string(),
  receiverId: v.string(),
  read: v.boolean(),
  replyToId: v.optional(v.id("messages")),  // ← add this
  createdAt: v.number(),
})
  .index("by_sender", ["senderId"])
  .index("by_receiver", ["receiverId"])
  .index("by_conversation", ["senderId", "receiverId"]),
```

### Convex changes

#### Update `convex/messages.ts` — sendMessage mutation

Add `replyToId` arg:

```typescript
export const sendMessage = mutation({
  args: {
    receiverId: v.string(),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),  // ← add
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const content = args.content.trim()

    if (currentUserId === args.receiverId) {
      throw new ConvexError("You cannot message yourself")
    }
    if (!content) throw new ConvexError("Message cannot be empty")
    if (content.length > 1000) throw new ConvexError("Message cannot exceed 1000 characters")

    // Validate replyToId if provided
    if (args.replyToId) {
      const replyTo = await ctx.db.get(args.replyToId)
      if (!replyTo) throw new ConvexError("Replied message not found")
    }

    return ctx.db.insert("messages", {
      content,
      senderId: currentUserId,
      receiverId: args.receiverId,
      read: false,
      replyToId: args.replyToId,
      createdAt: Date.now(),
    })
  },
})
```

#### Update `convex/messages.ts` — getMessages query

Enrich messages with their replied-to message content:

```typescript
export const getMessages = query({
  args: { otherUserId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return []

    const sent = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", currentUserId).eq("receiverId", args.otherUserId)
      )
      .collect()

    const received = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", args.otherUserId).eq("receiverId", currentUserId)
      )
      .collect()

    const sorted = [...sent, ...received].sort((a, b) => a.createdAt - b.createdAt)

    // Enrich with replyTo content
    return Promise.all(
      sorted.map(async (message) => {
        if (!message.replyToId) return { ...message, replyTo: null }
        const replyTo = await ctx.db.get(message.replyToId)
        return {
          ...message,
          replyTo: replyTo
            ? { content: replyTo.content, senderId: replyTo.senderId }
            : null,
        }
      })
    )
  },
})
```

### New component — ReplyPreview

Create `src/components/messages/reply-preview.tsx`:

This shows above the message input when user is replying to a message.

```tsx
// Shows: [X button] "Replying to: [truncated message content]"
// Props:
interface ReplyPreviewProps {
  replyToContent: string
  onCancel: () => void
}
// Style: rounded-lg bg-muted border-l-4 border-[#3B55E6] p-3
// Shows first 80 chars of the replied message
// X button (lucide X icon) to cancel the reply
```

### Update MessageBubble

In `src/components/messages/message-bubble.tsx`, add reply quote display:

```tsx
interface MessageBubbleProps {
  content: string
  createdAt: number
  isSent: boolean
  isOptimistic?: boolean
  replyTo?: { content: string; senderId: string } | null  // ← add
  currentUserId?: string  // ← add (to show "You" vs sender name)
}

// If replyTo exists, show above the message content:
{replyTo && (
  <div className="mb-2 rounded-md border-l-2 border-white/50 bg-white/10 px-2 py-1 text-xs opacity-80">
    <p className="truncate">{replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? "..." : ""}</p>
  </div>
)}
// For received messages (isSent=false), use border-[#3B55E6]/50 and bg-muted
```

### Update MessageInput

In `src/components/messages/message-input.tsx`, add reply support:

```tsx
interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => Promise<void>
  isSending: boolean
  replyTo?: { id: string; content: string } | null  // ← add
  onCancelReply?: () => void  // ← add
}

// Show ReplyPreview above the textarea when replyTo is set
```

### Update ChatWindow

In `src/components/messages/chat-window.tsx`:

1. Add reply state:
```typescript
const [replyingTo, setReplyingTo] = useState<{
  id: string
  content: string
} | null>(null)
```

2. Pass `replyTo` to `MessageBubble` from the enriched message data

3. Add swipe-to-reply on mobile / right-click context menu on desktop:
   - Long press or swipe right on a message → sets that message as `replyingTo`
   - For simplicity: add a Reply button that appears on hover (desktop) or tap (mobile)
   - Use a small Reply icon (lucide `Reply` icon) next to each message

4. Pass `replyingTo` and `onCancelReply` to `MessageInput`

5. Update `onSend` to pass `replyToId`:
```typescript
const onSend = async (content: string, replyToId?: string) => {
  // ... existing optimistic message logic ...
  await sendMessage({ receiverId: otherUserId, content, replyToId })
}
```

### OptimisticMessage type update

Add `replyTo` to the optimistic message type in `chat-window.tsx`:
```typescript
interface OptimisticMessage {
  _id: string
  content: string
  createdAt: number
  senderId: string
  receiverId: string
  read: boolean
  replyTo: null  // optimistic messages never have reply preview
  isOptimistic: true
}
```

### Verification checklist

- [ ] Hovering/tapping a message shows a Reply button
- [ ] Clicking Reply shows the ReplyPreview above the input
- [ ] Sending a reply shows the quoted message inside the bubble
- [ ] X button cancels the reply
- [ ] Works in dark mode
- [ ] `npm run build` passes

### ✅ Phase 1 checkpoint
```
✅ Phase 1 complete — Chat reply
Branch: v1.2/phase-1-chat-reply
Files changed: [list]
Next: Phase 2 — Emoji reactions on messages
```

---

## ─────────────────────────────────────────
## PHASE 2 — EMOJI REACTIONS ON MESSAGES
## ─────────────────────────────────────────

### Context

Users can react to individual messages with emojis.
Same 6 reactions as posts: 👍 ❤️ 😂 😮 😢 😠
Reactions appear below the message bubble as small emoji pills.
Each user can have one reaction per message.

### Database changes

Add `messageReactions` table to `convex/schema.ts`:

```typescript
messageReactions: defineTable({
  messageId: v.id("messages"),
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
  .index("by_message", ["messageId"])
  .index("by_user", ["userId"])
  .index("by_message_user", ["messageId", "userId"]),
```

### Convex changes

Add to `convex/messages.ts`:

```typescript
export const toggleMessageReaction = mutation({
  args: {
    messageId: v.id("messages"),
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
      .query("messageReactions")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", currentUserId)
      )
      .unique()

    if (existing) {
      if (existing.reactionType === args.reactionType) {
        await ctx.db.delete(existing._id)
      } else {
        await ctx.db.patch(existing._id, { reactionType: args.reactionType })
      }
    } else {
      await ctx.db.insert("messageReactions", {
        messageId: args.messageId,
        userId: currentUserId,
        reactionType: args.reactionType,
        createdAt: Date.now(),
      })
    }
  },
})

export const getMessageReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const reactions = await ctx.db
      .query("messageReactions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect()

    const summary = Object.entries(
      reactions.reduce((acc, r) => {
        acc[r.reactionType] = (acc[r.reactionType] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({ type, count }))

    const myReaction = currentUserId
      ? reactions.find((r) => r.userId === currentUserId)?.reactionType ?? null
      : null

    return { summary, myReaction }
  },
})
```

### New component — MessageReactions

Create `src/components/messages/message-reactions.tsx`:

```tsx
// Shows reaction pills below message bubble
// Props: messageId, isSent (for alignment)
// Uses useQuery(api.messages.getMessageReactions, { messageId })
// Shows emoji pills: "👍 2" "❤️ 1"
// On hover: shows full reaction picker (same 6 emojis)
// Clicking an emoji toggles the reaction
// Position: below bubble, aligned left for received, right for sent
```

### Update MessageBubble

Add `messageId` prop and render `<MessageReactions>` below the bubble.

### Verification checklist

- [ ] Long press / hover on message shows reaction picker
- [ ] Clicking emoji adds reaction below bubble
- [ ] Clicking same emoji removes it
- [ ] Reaction count updates in real-time (Convex reactivity)
- [ ] Works in dark mode
- [ ] `npm run build` passes

### ✅ Phase 2 checkpoint
```
✅ Phase 2 complete — Emoji reactions on messages
Branch: v1.2/phase-2-message-reactions
Files changed: [list]
Next: Phase 3 — Typing indicator + Online/Offline status
```

---

## ─────────────────────────────────────────
## PHASE 3 — TYPING INDICATOR + ONLINE STATUS
## ─────────────────────────────────────────

### Context

**Typing indicator:** When a user is typing in the message input,
the other user sees "Ahmed is typing..." below the conversation header.

**Online/Offline status:** Each user has a status dot:
- 🟢 Green dot = online (active in last 2 minutes)
- ⚫ Gray dot = offline

### Implementation approach

Use Convex's real-time capabilities.

#### Online status — database

Add `userPresence` table to `convex/schema.ts`:

```typescript
userPresence: defineTable({
  userId: v.string(),
  lastSeen: v.number(),
  isTypingTo: v.optional(v.string()),  // userId they are typing to
})
  .index("by_userId", ["userId"]),
```

#### Convex functions for presence

Add to `convex/messages.ts` (or new `convex/presence.ts`):

```typescript
export const updatePresence = mutation({
  args: {
    isTypingTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const existing = await ctx.db
      .query("userPresence")
      .withIndex("by_userId", (q) => q.eq("userId", currentUserId))
      .first()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: now,
        isTypingTo: args.isTypingTo,
      })
    } else {
      await ctx.db.insert("userPresence", {
        userId: currentUserId,
        lastSeen: now,
        isTypingTo: args.isTypingTo,
      })
    }
  },
})

export const getPresence = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
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

export const getTypingStatus = query({
  args: { otherUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return false

    const presence = await ctx.db
      .query("userPresence")
      .withIndex("by_userId", (q) => q.eq("userId", args.otherUserId))
      .first()

    return presence?.isTypingTo === currentUserId
  },
})
```

#### Frontend — update presence heartbeat

In `src/components/providers/zustand-hydration.tsx`, add presence heartbeat:

```typescript
// Ping presence every 60 seconds while user is active
const updatePresence = useMutation(api.messages.updatePresence)

useEffect(() => {
  if (!currentUser) return

  // Initial ping
  void updatePresence({ isTypingTo: undefined })

  // Heartbeat every 60 seconds
  const interval = setInterval(() => {
    void updatePresence({ isTypingTo: undefined })
  }, 60_000)

  return () => clearInterval(interval)
}, [currentUser, updatePresence])
```

#### Frontend — typing indicator in MessageInput

In `src/components/messages/message-input.tsx`:

```typescript
// Add onTyping prop:
interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => Promise<void>
  isSending: boolean
  replyTo?: { id: string; content: string } | null
  onCancelReply?: () => void
  onTyping?: () => void  // ← add
}

// Call onTyping on input change (debounced):
onChange={(event) => {
  setValue(event.target.value)
  onTyping?.()
}}
```

#### Frontend — ChatWindow typing + presence

In `src/components/messages/chat-window.tsx`:

```typescript
const isTyping = useQuery(api.messages.getTypingStatus, { otherUserId })
const otherPresence = useQuery(api.messages.getPresence, { userId: otherUserId })
const updatePresence = useMutation(api.messages.updatePresence)

// Debounced typing handler (stop typing after 2 seconds of no input)
const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const handleTyping = () => {
  void updatePresence({ isTypingTo: otherUserId })
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  typingTimeoutRef.current = setTimeout(() => {
    void updatePresence({ isTypingTo: undefined })
  }, 2000)
}

// In the header, add online status dot:
// Green dot if otherPresence?.isOnline, gray if not

// Below header or in message area, show typing indicator:
{isTyping && (
  <div className="flex items-center gap-2 px-4 py-1">
    <div className="flex gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
    </div>
    <span className="text-xs text-muted-foreground">typing...</span>
  </div>
)}
```

#### Online status dot component

Create `src/components/shared/online-status.tsx`:

```tsx
interface OnlineStatusProps {
  isOnline: boolean
  className?: string
}

export function OnlineStatus({ isOnline, className }: OnlineStatusProps) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-card",
        isOnline ? "bg-green-500" : "bg-muted-foreground/40",
        className
      )}
    />
  )
}
```

Use it in:
- `chat-window.tsx` header — next to avatar
- `conversation-item.tsx` — next to avatar in list

### Verification checklist

- [ ] Green dot shows next to user avatar when online
- [ ] Gray dot shows when offline
- [ ] "typing..." indicator shows with bouncing dots animation
- [ ] Typing indicator disappears after 2 seconds of no input
- [ ] Online status updates in real-time
- [ ] Works in dark mode
- [ ] `npm run build` passes

### ✅ Phase 3 checkpoint — Version 1.2 complete
```
✅ Phase 3 complete — Typing indicator + Online/Offline status
✅ Version 1.2 COMPLETE

Branch: v1.2/phase-3-typing-online
Files changed: [list]

Summary of all Version 1.2 changes:
- Phase 1: Chat reply (quote messages)
- Phase 2: Emoji reactions on messages
- Phase 3: Typing indicator + Online/Offline status

Ready to deploy Version 1.2 to Vercel.
```

---

## HOW TO USE THESE PROMPTS WITH CODEX

1. Start a new Codex session
2. Paste MASTER_SYSTEM_PROMPT.md first
3. Paste: "We are building Version 1.2. Start with Phase 1."
4. Paste Phase 1 prompt only
5. Wait for ✅ checkpoint
6. Test locally, commit, push, open PR
7. New session for Phase 2

Branch naming:
```
v1.2/phase-1-chat-reply
v1.2/phase-2-message-reactions
v1.2/phase-3-typing-online
```

---

*Social Platform — Version 1.2 Prompts*
*3 phases: Chat reply · Message reactions · Typing + Online status*
