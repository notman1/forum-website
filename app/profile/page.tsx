"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers"
import type React from "react" // Added import for React

export default function Profile() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else {
      fetchProfile()
    }
  }, [user, router])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Check if profile exists
      const { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No profile found, create a new one directly
          const defaultUsername = user.email?.split("@")[0] || ""

          try {
            const { error: insertError } = await supabase.from("profiles").insert({
              id: user.id,
              username: defaultUsername,
              email: user.email,
            })

            if (insertError) {
              console.error("Error creating profile:", insertError)
            }

            setUsername(defaultUsername)
          } catch (insertErr) {
            console.error("Exception creating profile:", insertErr)
            setUsername(defaultUsername)
          }
        } else {
          console.error("Error fetching profile:", error)
        }
      } else if (data) {
        setUsername(data.username || "")
      }
    } catch (error) {
      console.error("Exception in fetchProfile:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setUpdating(true)
      const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id)

      if (error) {
        console.error("Error updating profile:", error)
        alert("Error updating profile. Please try again.")
      } else {
        alert("Profile updated successfully!")
      }
    } catch (error) {
      console.error("Exception in updateProfile:", error)
      alert("Error updating profile. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-white">Your Profile</h1>
      <form onSubmit={updateProfile} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-purple-200">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={user?.email || ""}
            disabled
            className="mt-1 block w-full px-3 py-2 bg-purple-900 border border-purple-700 rounded-md text-white"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-purple-200">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-purple-800 border border-purple-700 rounded-md text-white"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={updating}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-500 disabled:bg-purple-400"
          >
            {updating ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  )
}

