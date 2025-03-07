import { Providers } from "./providers"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { Header } from "@/components/Header"
import "@/styles/globals.css"
import type React from "react" // Added import for React

export const metadata = {
  title: "NerdForums - A Community for Tech Enthusiasts",
  description: "Join NerdForums to discuss technology, programming, and more with like-minded enthusiasts.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AnimatedBackground />
          <Header />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  )
}



import './globals.css'