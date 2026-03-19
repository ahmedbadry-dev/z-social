import type { ReactElement } from "react"
import { FollowingList } from "@/components/profile/following-list"

export const metadata = { title: "Following" }

interface FollowingPageProps {
  searchParams: Promise<{ userId?: string }>
}

export default async function FollowingPage({
  searchParams,
}: FollowingPageProps): Promise<ReactElement> {
  const { userId } = await searchParams

  return <FollowingList userId={userId ?? ""} />
}
