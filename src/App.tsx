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
          <h1 className="font-bold text-4xl md:text-6xl text-white text-center mb-4">
            Interactive Particle Kanban
          </h1>
          <p className="text-xl text-white/80 text-center max-w-2xl px-4">
            Experience project management reimagined with dynamic particle interactions
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