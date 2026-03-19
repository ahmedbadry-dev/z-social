import type { ReactElement } from "react"
import { FollowersList } from "@/components/profile/followers-list"

export const metadata = { title: "Followers" }

interface FollowersPageProps {
  searchParams: Promise<{ userId?: string }>
}

export default async function FollowersPage({
  searchParams,
}: FollowersPageProps): Promise<ReactElement> {
  const { userId } = await searchParams

  return <FollowersList userId={userId ?? ""} />
}
