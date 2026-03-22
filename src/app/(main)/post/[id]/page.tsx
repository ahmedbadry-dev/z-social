import type { Metadata } from "next"
import { PostDetailClient } from "@/components/feed/post-detail-client"
import { fetchQuery } from "convex/nextjs"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://z-social-rouge.vercel.app"

  try {
    const post = await fetchQuery(api.posts.getPostById, {
      postId: id as Id<"posts">,
    })

    if (!post) {
      return {
        title: "Post not found",
      }
    }

    const authorName = post.authorName ?? "Someone"
    const description = post.content.slice(0, 160)
    const title = `${authorName} on Z-Social`
    const ogFallback = `${siteUrl}/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(
      description
    )}&type=post`
    const usePostImage = post.mediaType === "image" && !!post.mediaUrl
    const ogImageUrl = usePostImage ? post.mediaUrl! : ogFallback

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `${siteUrl}/post/${id}`,
        siteName: "Z-Social",
        images: usePostImage
          ? [{ url: ogImageUrl, alt: `${authorName}'s post` }]
          : [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    }
  } catch {
    return {
      title: "Z-Social",
    }
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PostDetailClient postId={id} />
}
