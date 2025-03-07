"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-white">Login to NerdForums</h1>
      <p className="text-purple-300 mb-6">Welcome back! Please login to your account.</p>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-white mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 rounded bg-purple-800 text-white"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-white mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded bg-purple-800 text-white"
          />
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-500">
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-purple-300">
        Don't have an account?{" "}
        <Link href="/signup" className="text-purple-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

