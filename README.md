# Z-Social Platform

A modern social media platform built with Next.js, Convex, and Better Auth.

## Features

- Create and share posts with media
- Follow people and see their posts
- Real-time messaging
- Notifications for likes, comments, and follows
- Search for people and posts
- Customizable profile with avatar and cover image

## Tech Stack

- Framework: Next.js 16 (App Router)
- Backend/DB/Realtime: Convex
- Auth: Better Auth
- UI: shadcn/ui + Tailwind CSS v4
- State: Zustand
- File Upload: Uploadthing
- Email: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account
- Uploadthing account
- Resend account (for emails)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in values
4. Run Convex dev: `npx convex dev`
5. Run the app: `npm run dev`

## Environment Variables

See `.env.example` for all required variables.
