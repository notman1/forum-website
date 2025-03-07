"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"

interface User {
  id: string
  email: string
  is_admin: boolean
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    checkAdminStatus()
    fetchUsers()
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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, is_admin")
        .order("created_at", { ascending: true })

      if (error) throw error

      setUsers(data)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc("set_user_admin", {
        user_id: userId,
        admin_status: !currentStatus,
      })

      if (error) throw error

      setUsers(users.map((user) => (user.id === userId ? { ...user, is_admin: !currentStatus } : user)))
    } catch (err) {
      console.error("Error updating admin status:", err)
      alert("Failed to update admin status. Please try again.")
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
      <h1 className="text-3xl font-bold mb-6 text-white">Manage Users</h1>
      <div className="bg-purple-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-purple-700">
          <thead className="bg-purple-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                Admin Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-purple-800 divide-y divide-purple-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                  {user.is_admin ? "Admin" : "User"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    {user.is_admin ? "Remove Admin" : "Make Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

