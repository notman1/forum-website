"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewForum() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      alert("You must be logged in to create a forum")
      return
    }

    const { error } = await supabase.from("forums").insert({
      title,
      description,
      tags: tags.split(",").map((tag) => tag.trim()),
      user_id: user.id,
      status: "open",
    })

    if (error) {
      alert(error.message)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Create New Forum</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-white mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 rounded bg-purple-800 text-white"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-white mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full p-2 rounded bg-purple-800 text-white"
            rows={4}
          ></textarea>
        </div>
        <div>
          <label htmlFor="tags" className="block text-white mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 rounded bg-purple-800 text-white"
          />
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-500">
          Create Forum
        </button>
      </form>
    </div>
  )
}

