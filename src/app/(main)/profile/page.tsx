import type { Metadata } from "next"
import { ProfilePageClient } from "@/components/profile/profile-page-client"
import { PageTransition } from "@/components/shared/page-transition"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}): Promise<Metadata> {
  const { userId } = await searchParams
  if (!userId) {
    return { title: "Profile" }
  }

  return {
    title: "Profile",
    description: "View profile on Z-Social",
  }
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; tab?: string }>
}) {
  const { userId } = await searchParams
  return (
    <PageTransition>
      <ProfilePageClient targetUserId={userId} />
    </PageTransition>
  )
}
