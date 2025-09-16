import { useEffect, useRef } from "react"

export default function ParticleSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Arrays to hold various particle types
    const particles: Particle[] = []
    const fireworkParticles: Particle[] = []
    const dustParticles: DustParticle[] = []
    const ripples: Ripple[] = []
    const techRipples: Ripple[] = []

    // Mouse state object to track the user's cursor
    const mouse = (() => {
      let state = { x: null as number | null, y: null as number | null }
      return {
        get x() {
          return state.x
        },
        get y() {
          return state.y
        },
        set({ x, y }: { x: number; y: number }) {
          state = { x, y }
        },
        reset() {
          state = { x: null, y: null }
        },
      }
    })()

    // Global state variables
    let frameCount = 0
    let autoDrift = true

    // Dynamically adjust the number of particles based on canvas size
    function adjustParticleCount() {
      const particleConfig = {
        heightConditions: [200, 300, 400, 500, 600],
        widthConditions: [450, 600, 900, 1200, 1600],
        particlesForHeight: [40, 60, 70, 90, 110],
        particlesForWidth: [40, 50, 70, 90, 110],
      }

      let numParticles = 130

      // Check the height and pick a suitable particle count
      for (let i = 0; i < particleConfig.heightConditions.length; i++) {
        if (canvas && canvas.height < particleConfig.heightConditions[i]) {
          numParticles = particleConfig.particlesForHeight[i]
          break
        }
      }
      for (let i = 0; i < particleConfig.widthConditions.length; i++) {
        if (canvas && canvas.width < particleConfig.widthConditions[i]) {
          numParticles = Math.min(numParticles, particleConfig.particlesForWidth[i])
          break
        }
      }

      return numParticles
    }

    // Particle class handles both "normal" and "firework" particles
    class Particle {
      isFirework: boolean
      x: number
      y: number
      vx: number
      vy: number
      size: number
      hue: number
      alpha: number
      sizeDirection: number
      trail: Array<{ x: number; y: number; hue: number; alpha: number }>

      constructor(x: number, y: number, isFirework = false) {
        const baseSpeed = isFirework ? Math.random() * 2 + 1 : Math.random() * 0.5 + 0.3

        this.isFirework = isFirework
        this.x = x
        this.y = y
        this.vx = Math.cos(Math.random() * Math.PI * 2) * baseSpeed
        this.vy = Math.sin(Math.random() * Math.PI * 2) * baseSpeed
        this.size = isFirework ? Math.random() * 2 + 2 : Math.random() * 3 + 1
        this.hue = Math.random() * 360
        this.alpha = 1
        this.sizeDirection = Math.random() < 0.5 ? -1 : 1
        this.trail = []
      }

      update(mouse: any) {
        // Calculate distance from mouse to apply interactive forces
        const dist = mouse.x !== null ? (mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2 : 0

        if (!this.isFirework) {
          // Apply a force pushing particles away or toward the mouse
          const force = dist && dist < 22500 ? (22500 - dist) / 22500 : 0

          // If mouse is not present and autoDrift is true, particles gently meander
          if (mouse.x === null && autoDrift) {
            this.vx += (Math.random() - 0.5) * 0.03
            this.vy += (Math.random() - 0.5) * 0.03
          }

          if (dist) {
            const sqrtDist = Math.sqrt(dist)
            // Slightly nudge particles toward the mouse position
            this.vx += ((mouse.x! - this.x) / sqrtDist) * force * 0.1
            this.vy += ((mouse.y! - this.y) / sqrtDist) * force * 0.1
          }

          // Dampen velocities
          this.vx *= mouse.x !== null ? 0.99 : 0.998
          this.vy *= mouse.y !== null ? 0.99 : 0.998
        } else {
          // Firework particles fade out over time
          this.alpha -= 0.02
        }

        // Update particle position
        this.x += this.vx
        this.y += this.vy

        // Bounce particles off canvas edges with energy loss
        if (canvas && (this.x <= 0 || this.x >= canvas.width - 1)) this.vx *= -0.9
        if (canvas && (this.y < 0 || this.y > canvas.height)) this.vy *= -0.9

        // Make the particle pulse in size
        this.size += this.sizeDirection * 0.1
        if (this.size > 4 || this.size < 1) this.sizeDirection *= -1

        // Cycle through hue to create a shifting color effect
        this.hue = (this.hue + 0.3) % 360

        // Leave a trail of previous positions
        if (frameCount % 2 === 0 && (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1)) {
          this.trail.push({
            x: this.x,
            y: this.y,
            hue: this.hue,
            alpha: this.alpha,
          })
          if (this.trail.length > 15) this.trail.shift()
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Draw a gradient-based circle
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size)
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${Math.max(this.alpha, 0)})`)
        gradient.addColorStop(1, `hsla(${this.hue + 30}, 80%, 30%, ${Math.max(this.alpha, 0)})`)

        ctx.fillStyle = gradient
        // Add a slight glow if the screen is large
        ctx.shadowBlur = canvas && canvas.width > 900 ? 10 : 0
        ctx.shadowColor = `hsl(${this.hue}, 80%, 60%)`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Draw the particle's trail
        if (this.trail.length > 1) {
          ctx.beginPath()
          ctx.lineWidth = 1.5
          for (let i = 0; i < this.trail.length - 1; i++) {
            const { x: x1, y: y1, hue: h1, alpha: a1 } = this.trail[i]
            const { x: x2, y: y2 } = this.trail[i + 1]
            ctx.strokeStyle = `hsla(${h1}, 80%, 60%, ${Math.max(a1, 0)})`
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
          }
          ctx.stroke()
        }
      }

      isDead() {
        return this.isFirework && this.alpha <= 0
      }
    }

    // Dust particles for background texture
    class DustParticle {
      x: number
      y: number
      size: number
      hue: number
      vx: number
      vy: number

      constructor() {
        this.x = canvas ? Math.random() * canvas.width : 0
        this.y = canvas ? Math.random() * canvas.height : 0
        this.size = Math.random() * 1.5 + 0.5
        this.hue = Math.random() * 360
        this.vx = (Math.random() - 0.5) * 0.05
        this.vy = (Math.random() - 0.5) * 0.05
      }

      update() {
        // Wrap around the edges
        if (canvas) {
          this.x = (this.x + this.vx + canvas.width) % canvas.width
          this.y = (this.y + this.vy + canvas.height) % canvas.height
        }
        // Slowly shift hue
        this.hue = (this.hue + 0.1) % 360
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `hsla(${this.hue}, 30%, 70%, 0.3)`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Ripples expand outward and fade out
    class Ripple {
      x: number
      y: number
      radius: number
      maxRadius: number
      alpha: number
      hue: number

      constructor(x: number, y: number, hue = 0, maxRadius = 30) {
        this.x = x
        this.y = y
        this.radius = 0
        this.maxRadius = maxRadius
        this.alpha = 0.5
        this.hue = hue
      }

      update() {
        this.radius += 1.5
        this.alpha -= 0.01
        this.hue = (this.hue + 5) % 360
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      isDone() {
        return this.alpha <= 0
      }
    }

    // Create initial particles
    function createParticles() {
      particles.length = 0
      dustParticles.length = 0

      const numParticles = adjustParticleCount()
      // Create normal particles
      for (let i = 0; i < numParticles; i++) {
        if (canvas) {
          particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height))
        }
      }
      // Create dust particles
      for (let i = 0; i < 200; i++) {
        dustParticles.push(new DustParticle())
      }
    }

    // Resize canvas to fill window
    function resizeCanvas() {
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        createParticles()
      }
    }

    // Draw shifting background gradient
    function drawBackground() {
      if (ctx && canvas) {
        ctx.fillStyle = "rgb(23, 23, 54)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    // Connect nearby particles with lines
    function connectParticles() {
      const gridSize = 120
      const grid = new Map<string, Particle[]>()

      particles.forEach((p) => {
        const key = `${Math.floor(p.x / gridSize)},${Math.floor(p.y / gridSize)}`
        if (!grid.has(key)) grid.set(key, [])
        grid.get(key)!.push(p)
      })

      if (ctx) ctx.lineWidth = 1.5
      particles.forEach((p) => {
        const gridX = Math.floor(p.x / gridSize)
        const gridY = Math.floor(p.y / gridSize)

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const key = `${gridX + dx},${gridY + dy}`
            if (grid.has(key)) {
              grid.get(key)!.forEach((neighbor) => {
                if (neighbor !== p) {
                  const diffX = neighbor.x - p.x
                  const diffY = neighbor.y - p.y
                  const dist = diffX * diffX + diffY * diffY
                  if (dist < 10000) {
                    if (ctx) {
                      ctx.strokeStyle = `hsla(${(p.hue + neighbor.hue) / 2}, 80%, 60%, ${1 - Math.sqrt(dist) / 100})`
                      ctx.beginPath()
                      ctx.moveTo(p.x, p.y)
                      ctx.lineTo(neighbor.x, neighbor.y)
                      ctx.stroke()
                    }
                  }
                }
              })
            }
          }
        }
      })
    }

    // Main animation loop
    function animate() {
      drawBackground()

      // Update and draw all entities
      const allArrays = [dustParticles, particles, ripples, techRipples, fireworkParticles]
      allArrays.forEach((arr) => {
        for (let i = arr.length - 1; i >= 0; i--) {
          const obj = arr[i]
          obj.update(mouse)
          if (ctx) obj.draw(ctx)
          // Remove done or dead objects
          if ("isDone" in obj && obj.isDone()) arr.splice(i, 1)
          if ("isDead" in obj && obj.isDead()) arr.splice(i, 1)
        }
      })

      connectParticles()
      frameCount++
      requestAnimationFrame(animate)
    }

    // Event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.set({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      techRipples.push(new Ripple(mouse.x!, mouse.y!))
      autoDrift = false
    }

    const handleMouseLeave = () => {
      mouse.reset()
      autoDrift = true
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      ripples.push(new Ripple(clickX, clickY, 0, 60))

      // Add firework particles
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 2 + 1
        const particle = new Particle(clickX, clickY, true)
        particle.vx = Math.cos(angle) * speed
        particle.vy = Math.sin(angle) * speed
        fireworkParticles.push(particle)
      }
    }

    const handleResize = () => {
      resizeCanvas()
    }

    // Add event listeners
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)
    canvas.addEventListener("click", handleClick)
    window.addEventListener("resize", handleResize)

    // Initialize
    resizeCanvas()
    animate()

    // Cleanup
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      canvas.removeEventListener("click", handleClick)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  )
}