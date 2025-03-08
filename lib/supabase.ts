import { createClient } from "@supabase/supabase-js"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Create Supabase client with retry options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => {
      return fetch(...args)
    },
  },
  // Add retry logic for failed requests
  db: {
    schema: "public",
  },
})

// Helper function to handle Supabase queries with retries
export async function supabaseQueryWithRetry(queryFn, maxRetries = 3) {
  let retries = 0

  while (retries < maxRetries) {
    try {
      return await queryFn()
    } catch (error) {
      retries++
      console.log(`Supabase query failed, retry ${retries}/${maxRetries}`)

      if (retries >= maxRetries) {
        console.error("Max retries reached, throwing error:", error)
        throw error
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
    }
  }
}

