"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers"

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null)
  const { user: authUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", authUser.id).single()

    if (error || !data.is_admin) {
      alert("You do not have admin privileges")
      router.push("/")
    } else {
      setUser(authUser)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/users">
          <div className="bg-purple-800 p-6 rounded-lg shadow-md hover:bg-purple-700 transition-colors">
            <h2 className="text-xl font-semibold text-white mb-2">Manage Users</h2>
            <p className="text-purple-200">View and manage user accounts, assign admin privileges.</p>
          </div>
        </Link>

        <Link href="/admin/forums">
          <div className="bg-purple-800 p-6 rounded-lg shadow-md hover:bg-purple-700 transition-colors">
            <h2 className="text-xl font-semibold text-white mb-2">Manage Forums</h2>
            <p className="text-purple-200">View, edit, and delete forums. Change forum status.</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

