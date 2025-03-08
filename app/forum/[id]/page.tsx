"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase, supabaseQueryWithRetry } from "@/lib/supabase"
import { useAuth } from "@/app/providers"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Forum {
  id: string
  title: string
  description: string
  tags: string[]
  status: "open" | "closed" | "solved"
  created_at: string
  user_id: string
  author_username: string
  likes_count: number
}

interface Reply {
  id: string
  content: string
  created_at: string
  user_id: string
  author_username: string
}

export default function ForumDetails() {
  const [forum, setForum] = useState<Forum | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newReply, setNewReply] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const { user } = useAuth()
  const { id } = useParams()
  const router = useRouter()

  useEffect(() => {
    fetchForumDetails()
    fetchReplies()
    if (user) {
      checkLikeStatus()
    }
  }, [user])

  const fetchForumDetails = async () => {
    try {
      // Get forum data with retry
      const { data: forumData, error: forumError } = await supabaseQueryWithRetry(() =>
        supabase.from("forums").select("*").eq("id", id).single(),
      )

      if (forumError) throw forumError

      // Get author username with retry
      const { data: authorData, error: authorError } = await supabaseQueryWithRetry(() =>
        supabase.from("profiles").select("username").eq("id", forumData.user_id).single(),
      )

      if (authorError && authorError.code !== "PGRST116") throw authorError

      // Get likes count with retry
      const { count, error: likesError } = await supabaseQueryWithRetry(() =>
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("forum_id", id),
      )

      if (likesError) throw likesError

      setForum({
        ...forumData,
        author_username: authorData?.username || "Unknown",
        likes_count: count || 0,
      })
    } catch (error) {
      console.error("Error fetching forum details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReplies = async () => {
    try {
      // Get replies with retry
      const { data: repliesData, error: repliesError } = await supabaseQueryWithRetry(() =>
        supabase.from("replies").select("*").eq("forum_id", id).order("created_at", { ascending: true }),
      )

      if (repliesError) throw repliesError

      if (!repliesData || repliesData.length === 0) {
        setReplies([])
        return
      }

      // Get all unique user IDs from replies
      const userIds = [...new Set(repliesData.map((reply) => reply.user_id))]

      // Fetch profiles for those users with retry
      const { data: profilesData, error: profilesError } = await supabaseQueryWithRetry(() =>
        supabase.from("profiles").select("id, username").in("id", userIds),
      )

      if (profilesError) throw profilesError

      // Create a map of user_id to username
      const usernameMap = new Map()
      profilesData?.forEach((profile) => {
        usernameMap.set(profile.id, profile.username || "Unknown")
      })

      // Combine the data
      const formattedReplies = repliesData.map((reply) => ({
        ...reply,
        author_username: usernameMap.get(reply.user_id) || "Unknown",
      }))

      setReplies(formattedReplies)
    } catch (error) {
      console.error("Error fetching replies:", error)
    }
  }

  const checkLikeStatus = async () => {
    if (!user) return
    try {
      const { data, error } = await supabaseQueryWithRetry(() =>
        supabase.from("likes").select("id").eq("user_id", user.id).eq("forum_id", id).single(),
      )

      if (error && error.code !== "PGRST116") throw error
      setLiked(!!data)
    } catch (error) {
      console.error("Error checking like status:", error)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert("You must be logged in to reply")
      return
    }

    if (!newReply.trim()) {
      alert("Reply content cannot be empty")
      return
    }

    // Fetch the latest forum status before submitting
    try {
      const { data: latestForum, error: forumError } = await supabaseQueryWithRetry(() =>
        supabase.from("forums").select("status").eq("id", id).single(),
      )

      if (forumError) {
        console.error("Error checking forum status:", forumError)
        alert("Error submitting reply. Please try again.")
        return
      }

      if (latestForum.status !== "open") {
        alert("This forum is no longer accepting replies")
        // Refresh the forum data to show the updated status
        fetchForumDetails()
        return
      }

      setSubmitting(true)
      const { error } = await supabaseQueryWithRetry(() =>
        supabase.from("replies").insert({
          content: newReply.trim(),
          user_id: user.id,
          forum_id: id,
        }),
      )

      if (error) throw error
      setNewReply("")
      fetchReplies()
    } catch (error) {
      console.error("Error submitting reply:", error)
      alert("Error submitting reply. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      alert("You must be logged in to like a forum")
      return
    }

    try {
      const { data, error } = await supabaseQueryWithRetry(() =>
        supabase.rpc("toggle_like", {
          p_user_id: user.id,
          p_forum_id: id,
        }),
      )

      if (error) throw error
      setLiked(data[0].liked)
      setForum((prev) => (prev ? { ...prev, likes_count: data[0].likes_count } : null))
    } catch (error) {
      console.error("Error toggling like:", error)
      alert("Error liking forum. Please try again.")
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  if (!forum) {
    return <div className="text-white">Forum not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-4 text-white">{forum.title}</h1>
      <p className="text-purple-200 mb-2">{forum.description}</p>
      <p className="text-purple-300 text-sm mb-4">Created by {forum.author_username}</p>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-purple-300 text-sm">Posted {formatDistanceToNow(new Date(forum.created_at))} ago</p>
          <div className="flex items-center space-x-2 mt-2">
            {forum.tags &&
              forum.tags.map((tag) => (
                <span key={tag} className="bg-purple-700 text-white px-2 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              forum.status === "open"
                ? "bg-green-500/20 text-green-500"
                : forum.status === "solved"
                  ? "bg-blue-500/20 text-blue-500"
                  : "bg-red-500/20 text-red-500"
            }`}
          >
            {forum.status}
          </span>
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-4 py-2 rounded ${
              liked ? "bg-purple-600 text-white" : "bg-purple-800 text-purple-200"
            } hover:bg-purple-700 transition-colors`}
          >
            <span>{liked ? "Liked" : "Like"}</span>
            <span>({forum.likes_count})</span>
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-white">Replies</h2>
      {replies.length === 0 ? (
        <div className="bg-purple-800 bg-opacity-70 p-4 rounded-lg mb-4 text-center">
          <p className="text-purple-300">
            No replies yet.{" "}
            {forum.status === "open" ? "Be the first to reply!" : "This forum is no longer accepting replies."}
          </p>
        </div>
      ) : (
        replies.map((reply) => (
          <div key={reply.id} className="bg-purple-800 bg-opacity-70 p-4 rounded-lg mb-4">
            <p className="text-white">{reply.content}</p>
            <div className="text-purple-300 text-sm mt-2">
              Posted by {reply.author_username} {formatDistanceToNow(new Date(reply.created_at))} ago
            </div>
          </div>
        ))
      )}

      {user && forum.status === "open" ? (
        <form onSubmit={handleReply} className="mt-6">
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Write your reply..."
            className="w-full p-2 rounded bg-purple-800 bg-opacity-70 text-white placeholder-purple-400 mb-2"
            rows={4}
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 disabled:bg-purple-400"
          >
            {submitting ? "Submitting..." : "Submit Reply"}
          </button>
        </form>
      ) : (
        <div className="mt-6 bg-purple-800 bg-opacity-70 p-4 rounded-lg text-center">
          {!user ? (
            <p className="text-purple-300">
              Please{" "}
              <Link href="/login" className="text-purple-400 underline">
                log in
              </Link>{" "}
              to reply
            </p>
          ) : (
            <p className="text-purple-300">
              This forum is {forum.status === "solved" ? "marked as solved" : "closed"} and no longer accepting replies
            </p>
          )}
        </div>
      )}
    </div>
  )
}

