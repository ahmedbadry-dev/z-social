import type { Metadata } from "next"
import { ProfilePageClient } from "@/components/profile/profile-page-client"

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

export default function ProfilePage() {
  return <ProfilePageClient />
}
