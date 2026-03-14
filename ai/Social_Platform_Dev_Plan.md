# 🚀 Social Platform — Full Stack Development Plan
## From 0 to 100%: Complete Build Roadmap

---

## 📐 Project Overview

**App Name:** Social  
**Type:** Social networking web platform  
**Stack:** React + Node.js + PostgreSQL  
**Design System:** Custom (Blue primary, dark navy neutrals, clean minimal UI)

---

## 🎨 Design System (From Figma)

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary B900 | `#3B55E6` | Buttons, active states, logo |
| Primary B100 | `#E8EAFF` | Hover backgrounds |
| Neutral B800 | `#0F172A` | Text headings |
| Neutral B400 | `#64748B` | Secondary text |
| White W900 | `#FFFFFF` | Cards, backgrounds |
| Background | `#F3F4F6` | Page background |
| Success G500 | `#4CAF50` | Success states |
| Error R500 | `#DC2626` | Destructive actions |

### Typography
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 40px | SemiBold | Page titles |
| H2 | 32px | Bold | Section headers |
| H3 | 24px | Bold | Card titles |
| H4 | 18px | SemiBold | Subheadings |
| H5 | 16px | Medium | Nav items |
| P1 | 14px | Regular/Medium | Body text |
| L1 | 12px | Regular/Medium | Labels, captions |

### Spacing Scale
4px → 168px (8px increments after 12px)

### Grid (Tablet/Desktop)
- Container: 936px max-width
- Columns: 12
- Gutter: 24px
- Margin: 12px

---

## 🗂️ Pages & Routes (From Sitemap)

### Public Routes
| Route | Page | Component |
|-------|------|-----------|
| `/login` | Log In | Login form + Google + Email magic link |
| `/signup` | Sign Up | Registration form + Google |
| `/login/email` | Login with Email | Magic link flow |
| `/forgot-password` | Forgot Password | Email entry |
| `/reset-password` | Reset Password | New password form |
| `/verify-otp` | Verify OTP | 4-digit code entry |
| `/check-inbox` | Check Inbox | Success confirmation |

### Protected Routes (Members Only)
| Route | Page | Component |
|-------|------|-----------|
| `/` or `/feed` | Feed | Post creation + post list |
| `/profile` | Profile — My Posts | User's own posts |
| `/profile/saved` | Profile — Saved Posts | Bookmarked posts |
| `/profile/settings/general` | Settings — General | Avatar, name, username, bio |
| `/profile/settings/account` | Settings — Account | Delete account |
| `/search` | Search | Profiles list + posts list |
| `/messages` | Messages | Chat list + conversation |
| `/notifications` | Notifications | Following + interaction notifs |

---

## 🏗️ Tech Stack Decision

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **State Management:** Zustand (lightweight, no boilerplate)
- **Server State:** TanStack Query (React Query v5)
- **Styling:** Tailwind CSS + CSS custom properties for design tokens
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React (matches Figma icon set)
- **Image Upload:** Cloudinary (avatar + post media)
- **Real-time:** Socket.io client (messages + notifications)

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL (Supabase or Railway)
- **Auth:** JWT (access + refresh tokens) + Google OAuth 2.0
- **Email:** Nodemailer + SendGrid (magic link + OTP emails)
- **File Storage:** Cloudinary
- **Real-time:** Socket.io server
- **Validation:** Zod

### Infrastructure
- **Frontend Deploy:** Vercel
- **Backend Deploy:** Railway or Render
- **Database:** Supabase (PostgreSQL)
- **Media:** Cloudinary
- **CI/CD:** GitHub Actions

---

## 📊 Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  username      String    @unique
  email         String    @unique
  password      String?   // nullable for OAuth users
  bio           String?
  avatar        String?
  coverImage    String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  posts         Post[]
  savedPosts    SavedPost[]
  comments      Comment[]
  likes         Like[]
  followers     Follow[]  @relation("Following")
  following     Follow[]  @relation("Follower")
  sentMessages     Message[] @relation("Sender")
  receivedMessages Message[] @relation("Receiver")
  notifications    Notification[]
  otp           OTP?
  refreshTokens RefreshToken[]
}

model Post {
  id         String    @id @default(cuid())
  content    String
  mediaUrl   String?
  mediaType  String?   // "image" | "video"
  authorId   String
  author     User      @relation(fields: [authorId], references: [id])
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  comments   Comment[]
  likes      Like[]
  savedBy    SavedPost[]
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  parentId  String?  // for nested replies
  parent    Comment? @relation("Replies", fields: [parentId], references: [id])
  replies   Comment[] @relation("Replies")
  createdAt DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  @@unique([postId, userId])
}

model SavedPost {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  @@unique([postId, userId])
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  follower    User     @relation("Follower", fields: [followerId], references: [id])
  followingId String
  following   User     @relation("Following", fields: [followingId], references: [id])
  createdAt   DateTime @default(now())
  @@unique([followerId, followingId])
}

model Message {
  id         String   @id @default(cuid())
  content    String
  senderId   String
  sender     User     @relation("Sender", fields: [senderId], references: [id])
  receiverId String
  receiver   User     @relation("Receiver", fields: [receiverId], references: [id])
  read       Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  actorId   String?          // who triggered it
  postId    String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
}

model OTP {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  code      String
  expiresAt DateTime
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
}

enum Role { USER ADMIN }
enum NotificationType { LIKE COMMENT FOLLOW REPLY }
```

---

## 🗓️ Development Phases

---

### ✅ PHASE 0 — Project Setup (Day 1-2)

**Goals:** Monorepo scaffold, tooling, environment

**Tasks:**
- [ ] Initialize monorepo: `apps/web`, `apps/api`, `packages/shared`
- [ ] Setup Vite + React + TypeScript for frontend
- [ ] Setup Express + TypeScript for backend
- [ ] Configure ESLint + Prettier + Husky pre-commit hooks
- [ ] Setup Tailwind CSS with custom design tokens (colors, spacing, typography from Figma)
- [ ] Create `.env.example` files for both apps
- [ ] Initialize PostgreSQL database + Prisma
- [ ] Run initial `prisma migrate dev`
- [ ] Setup GitHub repository + branch protection rules
- [ ] Configure GitHub Actions CI workflow

**Deliverable:** Both apps run locally, DB connected, linting passing ✓

---

### ✅ PHASE 1 — Design System & Component Library (Day 3-5)

**Goals:** Build all reusable UI components matching Figma exactly

**Components to build:**
```
components/
├── ui/
│   ├── Button.tsx          (primary dark, outline red for danger)
│   ├── Input.tsx           (text, password with toggle)
│   ├── Textarea.tsx
│   ├── Avatar.tsx          (with online indicator)
│   ├── Card.tsx
│   ├── Badge.tsx           (Author badge)
│   ├── Divider.tsx         (OR divider with lines)
│   ├── Spinner.tsx
│   └── Modal.tsx
├── layout/
│   ├── Navbar.tsx          (logo + search + logout)
│   ├── Sidebar.tsx         (profile card + nav links)
│   ├── RightPanel.tsx      (suggested friends + footer)
│   └── PageLayout.tsx      (3-column wrapper)
└── icons/                  (Lucide icon wrappers)
```

**Tailwind config tokens:**
```js
// tailwind.config.js
colors: {
  primary: { 900: '#3B55E6', 500: '#6B7FE8', 100: '#E8EAFF' },
  neutral: { 800: '#0F172A', 600: '#334155', 400: '#64748B', 200: '#E2E8F0' },
  bg: '#F3F4F6',
}
```

**Deliverable:** Storybook or demo page showing all components ✓

---

### ✅ PHASE 2 — Authentication (Day 6-10)

**Goals:** Complete auth flow matching all Figma auth screens

**Backend APIs:**
```
POST /api/auth/register          → name, email, username, password
POST /api/auth/login             → email, password → JWT
POST /api/auth/google            → Google OAuth token → JWT
POST /api/auth/login-with-email  → send magic link email
POST /api/auth/verify-magic      → verify magic link token
POST /api/auth/forgot-password   → send reset email
POST /api/auth/reset-password    → token + new password
POST /api/auth/verify-otp        → code + userId
POST /api/auth/refresh           → refresh token → new access token
POST /api/auth/logout            → invalidate refresh token
```

**Frontend Pages:**
- `/login` — Google button + Email magic link button + email/password form + Forgot Password link + Sign Up link
- `/signup` — Google button + Email magic link button + name/email/username/password form + Terms checkbox + Log In link
- `/login/email` — Email input + Send link button
- `/forgot-password` — Email input + Send reset link button
- `/reset-password` — New password + Confirm password + Reset button
- `/verify-otp` — 4 boxes OTP input (auto-advance) + Resend countdown + Verify button
- `/check-inbox` — Green checkmark + success message

**Auth State (Zustand):**
```ts
interface AuthStore {
  user: User | null
  accessToken: string | null
  setAuth: (user, token) => void
  logout: () => void
}
```

**Security:**
- Access token: 15min expiry, stored in memory
- Refresh token: 7 days, stored in httpOnly cookie
- Axios interceptor auto-refreshes on 401

**Deliverable:** Full auth flow works end-to-end ✓

---

### ✅ PHASE 3 — Feed Page (Day 11-15)

**Goals:** Home feed with post creation, display, likes, comments, replies

**Backend APIs:**
```
GET    /api/posts/feed           → paginated posts from followed users
POST   /api/posts                → create post (text + optional media)
PUT    /api/posts/:id            → edit post (author only)
DELETE /api/posts/:id            → delete post (author only)
POST   /api/posts/:id/like       → toggle like
POST   /api/posts/:id/save       → toggle save
GET    /api/posts/:id/comments   → get comments + replies
POST   /api/posts/:id/comments   → add comment
POST   /api/posts/:id/comments/:commentId/reply → add reply
DELETE /api/comments/:id         → delete comment (author only)
```

**Frontend Components:**
```
feed/
├── PostComposer.tsx    → "What's on your mind?" + Add Media + Post button
├── PostCard.tsx        → Author info + timestamp + content + media + Comment/Like bar
├── PostMenu.tsx        → ••• dropdown (edit/delete for own posts, save for others)
├── CommentInput.tsx    → avatar + text input
├── CommentList.tsx     → threaded comments with Reply
├── CommentItem.tsx     → author + content + Reply button + nested replies
├── MediaUpload.tsx     → image/video upload with preview
└── FeedPage.tsx        → PostComposer + infinite scroll PostCard list
```

**Features:**
- Infinite scroll pagination (TanStack Query + `useInfiniteQuery`)
- Optimistic updates for likes (instant UI feedback)
- Media upload to Cloudinary with progress indicator
- Expandable/collapsible comment threads
- Real-time new post notifications via Socket.io

**Deliverable:** Full feed CRUD with comments and likes ✓

---

### ✅ PHASE 4 — Profile Pages (Day 16-20)

**Goals:** Profile with My Posts, Saved Posts, and Settings tabs

**Backend APIs:**
```
GET    /api/users/:username          → public profile data
GET    /api/users/:id/posts          → user's posts (paginated)
GET    /api/users/me/saved           → current user's saved posts
POST   /api/users/:id/follow         → follow/unfollow toggle
GET    /api/users/suggestions        → suggested friends list
PUT    /api/users/me                  → update profile (name, username, bio, avatar)
DELETE /api/users/me                  → delete account
POST   /api/auth/logout              → logout
```

**Frontend Pages & Components:**
```
profile/
├── ProfileHeader.tsx      → cover + avatar + name + @username + bio + stats + follow button
├── ProfileTabs.tsx        → My Posts | Saved Posts | Settings tabs
├── MyPostsTab.tsx         → user's own posts feed
├── SavedPostsTab.tsx      → saved posts feed
├── SettingsPage.tsx       → settings layout with sidebar
├── settings/
│   ├── GeneralSettings.tsx  → avatar upload + full name + username + bio + Save Changes
│   └── AccountSettings.tsx  → Delete Account (with confirmation modal)
└── SuggestedFriends.tsx   → right panel with + follow buttons
```

**Stats displayed:** Posts count | Followers | Following

**Deliverable:** Full profile view and edit working ✓

---

### ✅ PHASE 5 — Search (Day 21-23)

**Goals:** Search for users and posts

**Backend APIs:**
```
GET /api/search?q=query&type=users    → search users by name/username
GET /api/search?q=query&type=posts    → search posts by content
GET /api/search?q=query               → combined results
```

**Frontend:**
```
search/
├── SearchBar.tsx          → debounced input (300ms)
├── SearchResults.tsx      → tabs: People | Posts
├── UserResultCard.tsx     → avatar + name + username + follow button
└── PostResultCard.tsx     → post excerpt + author
```

**Deliverable:** Search with debounce, results for users and posts ✓

---

### ✅ PHASE 6 — Messages (Day 24-28)

**Goals:** Real-time direct messaging

**Backend:**
```
GET    /api/messages/conversations     → list of conversations
GET    /api/messages/:userId           → chat history with user
POST   /api/messages/:userId           → send message
DELETE /api/messages/:messageId        → delete message

# Socket.io events:
emit:    "send_message"    → { receiverId, content }
on:      "receive_message" → { senderId, content, timestamp }
on:      "user_online"     → { userId }
on:      "user_offline"    → { userId }
on:      "typing"          → { userId }
```

**Frontend:**
```
messages/
├── ConversationList.tsx   → list of chats with last message + unread count
├── ChatWindow.tsx         → message bubbles + scroll to bottom
├── MessageInput.tsx       → text input + send button
├── MessageBubble.tsx      → sent (right, blue) / received (left, gray)
└── MessagesPage.tsx       → 2-column layout: list + active chat
```

**Deliverable:** Real-time messaging with online indicators ✓

---

### ✅ PHASE 7 — Notifications (Day 29-31)

**Goals:** Real-time in-app notifications

**Backend:**
```
GET   /api/notifications              → paginated notifications
PATCH /api/notifications/:id/read     → mark as read
PATCH /api/notifications/read-all     → mark all as read

# Socket.io:
on: "notification"  → { type, actor, post, message }
```

**Notification Types:**
- Someone liked your post
- Someone commented on your post
- Someone replied to your comment
- Someone followed you

**Frontend:**
```
notifications/
├── NotificationList.tsx   → grouped: Following | Interactions
├── NotificationItem.tsx   → actor avatar + action text + time ago + unread dot
└── NotificationBell.tsx   → navbar icon with unread count badge
```

**Deliverable:** Real-time notification system ✓

---

### ✅ PHASE 8 — Polish & UX (Day 32-35)

**Goals:** Smooth, production-quality UX

**Tasks:**
- [ ] Loading skeletons for all data-fetching states
- [ ] Toast notifications (success/error) for all actions
- [ ] Empty states (no posts, no messages, no notifications)
- [ ] Error boundaries with friendly error UI
- [ ] Confirm modals for destructive actions (delete post, delete account)
- [ ] Responsive design (desktop → tablet → mobile)
- [ ] Infinite scroll with intersection observer
- [ ] Optimistic UI for likes, follows, saves
- [ ] Image lazy loading
- [ ] Route-based code splitting (React.lazy)
- [ ] 404 page

---

### ✅ PHASE 9 — Security & Performance (Day 36-38)

**Goals:** Production-ready hardening

**Backend Security:**
- [ ] Helmet.js (HTTP security headers)
- [ ] Rate limiting (express-rate-limit): 100 req/15min general, 5 req/15min auth
- [ ] CORS configured for frontend origin only
- [ ] Input sanitization (DOMPurify equivalent on backend)
- [ ] SQL injection prevention (Prisma parameterized queries — automatic)
- [ ] XSS prevention
- [ ] File upload validation (type + size limits)
- [ ] Sensitive routes protected with auth middleware

**Performance:**
- [ ] Database indexes on: `email`, `username`, `authorId`, `createdAt`
- [ ] Redis caching for feed (optional, v2)
- [ ] Image compression via Cloudinary transformations
- [ ] API response pagination everywhere
- [ ] Frontend bundle analysis + optimization

---

### ✅ PHASE 10 — Testing (Day 39-42)

**Goals:** Confidence to ship

**Backend Tests (Jest + Supertest):**
- Auth endpoints (register, login, refresh, logout)
- Post CRUD
- Follow/unfollow logic
- Like toggle (unique constraint)
- Save toggle

**Frontend Tests (Vitest + React Testing Library):**
- Auth form validation
- Post composer behavior
- Comment thread rendering
- Settings form submission

**E2E Tests (Playwright):**
- Full signup flow
- Login → create post → like → comment → logout
- Profile edit flow

---

### ✅ PHASE 11 — Deployment (Day 43-45)

**Goals:** Live on the internet

**Steps:**
1. **Database:** Create Supabase project → get connection string → `prisma migrate deploy`
2. **Backend:** Deploy to Railway
   - Set all env vars (DATABASE_URL, JWT secrets, Google OAuth, Cloudinary, SendGrid)
   - Enable auto-deploy from `main` branch
3. **Frontend:** Deploy to Vercel
   - Set `VITE_API_URL` to Railway backend URL
   - Enable auto-deploy from `main` branch
4. **Domain:** Configure custom domain (optional)
5. **Monitoring:** Sentry for error tracking (frontend + backend)
6. **Uptime:** UptimeRobot ping monitoring

---

## 📁 Project Folder Structure

```
social-platform/
├── apps/
│   ├── web/                        # React frontend
│   │   ├── src/
│   │   │   ├── components/         # Shared UI components
│   │   │   ├── pages/              # Route-based pages
│   │   │   ├── features/           # Feature modules (feed, profile, etc.)
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── stores/             # Zustand stores
│   │   │   ├── services/           # Axios API calls
│   │   │   ├── lib/                # Utilities, helpers
│   │   │   ├── types/              # TypeScript types
│   │   │   └── styles/             # Global CSS
│   │   ├── public/
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── api/                        # Express backend
│       ├── src/
│       │   ├── controllers/        # Route handlers
│       │   ├── routes/             # Express routers
│       │   ├── middleware/         # Auth, error, rate limit
│       │   ├── services/           # Business logic
│       │   ├── lib/                # Prisma, Cloudinary, Socket.io clients
│       │   ├── utils/              # Helpers
│       │   └── types/              # TypeScript types
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── tsconfig.json
│
├── packages/
│   └── shared/                     # Shared Zod schemas + types
│       └── src/
│           ├── schemas/            # Zod validation schemas
│           └── types/              # Shared TypeScript interfaces
│
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json                    # Root workspace config
└── README.md
```

---

## ⚡ API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | ✗ | Register with email |
| POST | /auth/login | ✗ | Login with email/password |
| POST | /auth/google | ✗ | Google OAuth |
| POST | /auth/login-with-email | ✗ | Magic link |
| POST | /auth/forgot-password | ✗ | Reset link |
| POST | /auth/reset-password | ✗ | Set new password |
| POST | /auth/verify-otp | ✗ | OTP verification |
| POST | /auth/refresh | ✗ | Refresh access token |
| POST | /auth/logout | ✓ | Logout |
| GET | /posts/feed | ✓ | Get feed |
| POST | /posts | ✓ | Create post |
| PUT | /posts/:id | ✓ | Edit post |
| DELETE | /posts/:id | ✓ | Delete post |
| POST | /posts/:id/like | ✓ | Toggle like |
| POST | /posts/:id/save | ✓ | Toggle save |
| GET | /posts/:id/comments | ✓ | Get comments |
| POST | /posts/:id/comments | ✓ | Add comment |
| POST | /posts/:id/comments/:cId/reply | ✓ | Add reply |
| GET | /users/:username | ✓ | Get user profile |
| GET | /users/:id/posts | ✓ | Get user's posts |
| GET | /users/me/saved | ✓ | Get saved posts |
| POST | /users/:id/follow | ✓ | Follow/unfollow |
| GET | /users/suggestions | ✓ | Suggested friends |
| PUT | /users/me | ✓ | Update profile |
| DELETE | /users/me | ✓ | Delete account |
| GET | /search | ✓ | Search users + posts |
| GET | /messages/conversations | ✓ | All conversations |
| GET | /messages/:userId | ✓ | Chat with user |
| POST | /messages/:userId | ✓ | Send message |
| GET | /notifications | ✓ | Get notifications |
| PATCH | /notifications/read-all | ✓ | Mark all read |

---

## 📅 Timeline Summary

| Phase | Description | Days | Duration |
|-------|-------------|------|----------|
| 0 | Project Setup | 1-2 | 2 days |
| 1 | Design System | 3-5 | 3 days |
| 2 | Authentication | 6-10 | 5 days |
| 3 | Feed | 11-15 | 5 days |
| 4 | Profile | 16-20 | 5 days |
| 5 | Search | 21-23 | 3 days |
| 6 | Messages | 24-28 | 5 days |
| 7 | Notifications | 29-31 | 3 days |
| 8 | Polish & UX | 32-35 | 4 days |
| 9 | Security & Performance | 36-38 | 3 days |
| 10 | Testing | 39-42 | 4 days |
| 11 | Deployment | 43-45 | 3 days |
| **Total** | | | **~45 days** |

---

## 🔑 Environment Variables

### Frontend (`apps/web/.env`)
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Backend (`apps/api/.env`)
```env
DATABASE_URL=postgresql://user:pass@host:5432/social
JWT_ACCESS_SECRET=super_secret_access_key_here
JWT_REFRESH_SECRET=super_secret_refresh_key_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@social.app
FRONTEND_URL=http://localhost:5173

NODE_ENV=development
PORT=3001
```

---

## 🚦 Development Commands

```bash
# Install all dependencies
npm install

# Run both apps in parallel
npm run dev

# Frontend only
npm run dev:web

# Backend only
npm run dev:api

# Database
npx prisma migrate dev      # Create migration
npx prisma studio           # Visual DB editor
npx prisma db seed          # Seed with test data

# Tests
npm run test                # All tests
npm run test:e2e            # Playwright E2E

# Build for production
npm run build
```

---

## ✅ Definition of Done (Per Feature)

A feature is complete when:
1. Backend API endpoint(s) working with proper validation and error handling
2. Frontend page/component renders correctly matching Figma
3. Loading states and error states handled
4. Works on desktop and tablet (responsive)
5. Manual smoke test passes
6. No TypeScript errors
7. No ESLint warnings

---

*Plan generated from Figma design analysis — Social Platform v1.0*
