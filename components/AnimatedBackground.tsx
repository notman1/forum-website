"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    // Early return if canvas is null
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    // Early return if context is null
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const circles: Circle[] = []

    class Circle {
      x: number
      y: number
      radius: number
      dx: number
      dy: number

      constructor() {
        // Ensure canvas is not null before accessing its properties
        if (!canvas) {
          // Provide default values if canvas is null
          this.x = 0
          this.y = 0
          this.radius = 0
          this.dx = 0
          this.dy = 0
          return
        }

        // Now we can safely use canvas since we've checked it's not null
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.radius = Math.random() * 300 + 150 // Increased size
        this.dx = (Math.random() - 0.5) * 0.2
        this.dy = (Math.random() - 0.5) * 0.2
      }

      draw() {
        // Add null check for ctx
        if (!ctx) return

        ctx.beginPath()
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius)
        gradient.addColorStop(0, "rgba(128, 0, 128, 0.4)") // Increased opacity
        gradient.addColorStop(1, "rgba(128, 0, 128, 0)")
        ctx.fillStyle = gradient
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fill()
      }

      update() {
        // Add null check for canvas
        if (!canvas) return

        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
          this.dx = -this.dx
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
          this.dy = -this.dy
        }

        this.x += this.dx
        this.y += this.dy

        this.draw()
      }
    }

    for (let i = 0; i < 5; i++) {
      // Reduced number of circles
      circles.push(new Circle())
    }

    function animate() {
      // Add null check for ctx
      if (!ctx) return

      requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply a blur effect
      ctx.filter = "blur(80px)" // Increased blur

      circles.forEach((circle) => {
        circle.update()
      })

      // Reset the filter
      ctx.filter = "none"
    }

    animate()

    const handleResize = () => {
      // Add null check for canvas
      if (!canvas) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 bg-black" />
}

