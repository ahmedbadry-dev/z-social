"use client"

import { Search } from "lucide-react"
import { useQuery } from "convex/react"
import { useQueryState } from "nuqs"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchSkeleton } from "@/components/search/search-skeleton"
import { PostResultCard } from "@/components/search/post-result-card"
import { UserResultCard } from "@/components/search/user-result-card"
import { useDebounce } from "@/hooks/use-debounce"
import { api } from "../../../convex/_generated/api"
import type { ReactionType } from "@/types"

export function SearchMain() {
  const [query, setQuery] = useQueryState("q", { defaultValue: "" })
  const debouncedQuery = useDebounce(query.trim(), 300)
  const currentUser = useQuery(api.auth.getCurrentUser)

  const users = useQuery(api.search.searchUsers, { q: debouncedQuery })
  const posts = useQuery(api.search.searchPosts, { q: debouncedQuery })

  const isReadyToSearch = debouncedQuery.length >= 2
  const isLoadingResults = isReadyToSearch && (users === undefined || posts === undefined)
  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#64748B]" />
        <input
          value={query}
          onChange={(event) => void setQuery(event.target.value)}
          placeholder="Search"
          className="h-12 w-full rounded-full bg-[#F1F5F9] py-2 pr-4 pl-12 text-sm text-[#0F172A] outline-none placeholder:text-[#64748B]"
        />
      </div>

      {!isReadyToSearch && (
        <EmptyState
          icon={Search}
          title="Search for people and posts"
          description="Type at least 2 characters to start searching."
        />
      )}

      {isLoadingResults && <SearchSkeleton />}

      {isReadyToSearch && !isLoadingResults && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">People</h2>
            {users && users.length > 0 ? (
              users.map((user) => (
                <UserResultCard
                  key={user.userId}
                  userId={user.userId}
                  username={user.username}
                  bio={user.bio}
                  isCurrentUser={user.isCurrentUser}
                />
              ))
            ) : (
              <p className="text-sm text-[#64748B]">No people found for "{debouncedQuery}"</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">Posts</h2>
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostResultCard
                  key={post._id}
                  post={{
                    ...post,
                    reactionsSummary: (post.reactionsSummary ?? []).map((reaction) => ({
                      ...reaction,
                      type: reaction.type as ReactionType,
                    })),
                  }}
                  currentUserId={currentUserId}
                />
              ))
            ) : (
              <p className="text-sm text-[#64748B]">No posts found for "{debouncedQuery}"</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
