"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"
import Link from "next/link"

interface Forum {
  id: string
  title: string
  description: string
  status: "open" | "closed" | "solved"
  created_at: string
  author_username: string
}

export default function AdminForums() {
  const [forums, setForums] = useState<Forum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    checkAdminStatus()
    fetchForums()
  }, [])

  const checkAdminStatus = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (error || !data?.is_admin) {
      router.push("/")
    }
  }

  const fetchForums = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("forums_with_details")
        .select("id, title, description, status, created_at, author_username")
        .order("created_at", { ascending: false })

      if (error) throw error

      setForums(data || [])
    } catch (err) {
      console.error("Error fetching forums:", err)
      setError("Failed to load forums. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const updateForumStatus = async (forumId: string, status: "open" | "closed" | "solved") => {
    try {
      const { error } = await supabase.from("forums").update({ status }).eq("id", forumId)

      if (error) throw error

      // Update local state
      setForums(forums.map((forum) => (forum.id === forumId ? { ...forum, status } : forum)))
    } catch (err) {
      console.error("Error updating forum status:", err)
      alert("Failed to update forum status. Please try again.")
    }
  }

  const deleteForumHandler = async (forumId: string) => {
    if (!confirm("Are you sure you want to delete this forum? This action cannot be undone.")) {
      return
    }

    try {
      // Delete related replies first
      await supabase.from("replies").delete().eq("forum_id", forumId)

      // Delete likes
      await supabase.from("likes").delete().eq("forum_id", forumId)

      // Delete the forum
      const { error } = await supabase.from("forums").delete().eq("id", forumId)

      if (error) throw error

      // Update local state
      setForums(forums.filter((forum) => forum.id !== forumId))
    } catch (err) {
      console.error("Error deleting forum:", err)
      alert("Failed to delete forum. Please try again.")
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Forums</h1>
        <Link href="/admin" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500">
          Back to Admin
        </Link>
      </div>

      <div className="bg-purple-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-purple-700">
          <thead className="bg-purple-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-purple-800 divide-y divide-purple-700">
            {forums.map((forum) => (
              <tr key={forum.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                  <Link href={`/forum/${forum.id}`} className="hover:underline">
                    {forum.title}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">{forum.author_username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <select
                      value={forum.status}
                      onChange={(e) => updateForumStatus(forum.id, e.target.value as "open" | "closed" | "solved")}
                      className="bg-purple-700 text-white px-2 py-1 rounded"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="solved">Solved</option>
                    </select>
                    <button
                      onClick={() => deleteForumHandler(forum.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

