"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase, supabaseQueryWithRetry } from "@/lib/supabase"
import { useAuth } from "@/app/providers"
import { formatDistanceToNow } from "date-fns"

interface Profile {
  id: string;
  username: string;
}

interface Forum {
  id: string
  title: string
  description?: string
  tags: string[]
  status: "open" | "closed" | "solved"
  created_at: string
  user_id: string
  author_username: string
  likes_count: number
}

export default function Home() {
  const [forums, setForums] = useState<Forum[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchForums()
  }, [])

  const fetchForums = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // First, fetch all forums with retry logic
      const { data: forumsData, error: forumsError } = await supabaseQueryWithRetry(() =>
        supabase.from("forums").select("*").order("created_at", { ascending: false }),
      )

      if (forumsError) throw forumsError

      if (!forumsData || forumsData.length === 0) {
        setForums([])
        setIsLoading(false)
        return
      }

      // Get all unique user IDs from forums
      const userIds = [...new Set(forumsData.map((forum: any) => forum.user_id))]
      // Fetch profiles for those users with retry logic
      const { data: profilesData, error: profilesError } = await supabaseQueryWithRetry(() =>
        supabase.from("profiles").select("id, username").in("id", userIds),
      )

      if (profilesError) throw profilesError

      // Create a map of user_id to username
      const usernameMap = new Map()
      profilesData?.forEach((profile: { id: string; username: string }) => {
        usernameMap.set(profile.id, profile.username || "Unknown");
      });

      // Simplified approach for likes - get all at once
      const forumIds = forumsData.map((forum) => forum.id)

      // Initialize likes map with zeros
      const likesMap = new Map()
      forumIds.forEach((id) => likesMap.set(id, 0))

      // Try to get likes counts, but don't fail if this part fails
      try {
        // For each forum, get the likes count
        for (const forumId of forumIds) {
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("forum_id", forumId)

          likesMap.set(forumId, count || 0)
        }
      } catch (likesError) {
        console.error("Error fetching likes counts, using zeros:", likesError)
      }

      // Combine the data
      const formattedForums = forumsData.map((forum) => ({
        ...forum,
        author_username: usernameMap.get(forum.user_id) || "Unknown",
        likes_count: likesMap.get(forum.id) || 0,
      }))

      setForums(formattedForums)
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please try again later.")
      setForums([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredForums = forums.filter(
    (forum) =>
      forum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      forum.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-white">Loading forums...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Welcome to NerdForums</h1>
        {user && (
          <Link
            href="/new-forum"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 transition-colors"
          >
            Create Forum
          </Link>
        )}
      </div>

      <input
        type="text"
        placeholder="Search forums..."
        className="w-full p-2 mb-4 rounded bg-purple-800 text-white placeholder:text-purple-300"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {error ? (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded mb-4">{error}</div>
      ) : filteredForums.length === 0 ? (
        <div className="text-center text-purple-300 py-8">
          {searchTerm ? "No forums found matching your search." : "No forums have been created yet."}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredForums.map((forum) => (
            <Link href={`/forum/${forum.id}`} key={forum.id}>
              <div className="bg-purple-800 bg-opacity-70 p-4 rounded shadow hover:bg-opacity-100 transition-all duration-300 ease-in-out">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-white">{forum.title}</h2>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      forum.status === "open"
                        ? "bg-green-500/20 text-green-500"
                        : forum.status === "solved"
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {forum.status}
                  </span>
                </div>
                <p className="text-purple-200 mt-2">{forum.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-purple-300 text-sm">
                    Posted by {forum.author_username} {formatDistanceToNow(new Date(forum.created_at))} ago
                  </div>
                  <div className="text-purple-300 text-sm">Likes: {forum.likes_count}</div>
                </div>
                {forum.tags && forum.tags.length > 0 && (
                  <div className="mt-2">
                    {forum.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-purple-600 text-white rounded-full px-2 py-1 text-sm mr-2 mb-2"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

