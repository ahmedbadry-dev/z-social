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
        title: "Post not found | Z-Social",
      }
    }

    const authorName = post.authorName ?? "Someone"
    const description = post.content.slice(0, 160)
    const title = `${authorName} on Z-Social`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `${siteUrl}/post/${id}`,
        siteName: "Z-Social",
        images: post.authorImage
          ? [
              {
                url: post.authorImage,
                width: 400,
                height: 400,
                alt: authorName,
              },
            ]
          : [
              {
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "Z-Social",
              },
            ],
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: post.authorImage
          ? [post.authorImage]
          : [`${siteUrl}/og-image.png`],
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
