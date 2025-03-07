"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export function Header() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

        if (!error && data) {
          setIsAdmin(data.is_admin)
        }
      }
    }

    checkAdminStatus()
  }, [user])

  useEffect(() => {
    if (user) {
      setShowWelcome(true)
      const timer = setTimeout(() => setShowWelcome(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="bg-purple-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          NerdForums
        </Link>
        <nav>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="mr-4">
                  Admin
                </Link>
              )}
              <Link href="/new-forum" className="mr-4">
                New Forum
              </Link>
              <Link href="/profile" className="mr-4">
                Profile
              </Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="mr-4">
                Login
              </Link>
              <Link href="/signup">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
      {showWelcome && user && (
        <div className="fixed top-20 right-4 bg-purple-600 text-white p-4 rounded shadow-lg transition-opacity duration-300">
          Welcome to NerdForums, {user.email}!
        </div>
      )}
    </header>
  )
}

