import ParticleSystem from "./components/ParticleSystem"
import KanbanBoard from "./components/KanbanBoard"
import { Toaster } from "sonner"

function App() {
  return (
    <div className="relative w-full min-h-screen">
      {/* Particle System Hero Section */}
      <div className="relative w-full h-[60vh] overflow-hidden">
        <ParticleSystem />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <h1 className="font-semibold text-3xl md:text-4xl lg:text-5xl text-white text-center mb-4 tracking-tight">
            sentiment ux team
          </h1>
          <p className="text-white/80 text-center text-lg">
            Welcome to our hub
          </p>
        </div>
      </div>
      
      {/* Kanban Board Section */}
      <div className="relative w-full bg-background z-20">
        <KanbanBoard />
      </div>
      
      <Toaster />
    </div>
  )
}

export default App