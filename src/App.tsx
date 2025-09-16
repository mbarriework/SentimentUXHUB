import { useState } from "react"
import ParticleSystem from "./components/ParticleSystem"
import KanbanBoard from "./components/KanbanBoard"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus } from "@phosphor-icons/react"

function App() {
  const [createWorkItem, setCreateWorkItem] = useState<(() => void) | null>(null)

  return (
    <div className="relative w-full min-h-screen">
      {/* Particle System Hero Section */}
      <div className="relative w-full h-[60vh] overflow-hidden">
        <ParticleSystem />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <h1 className="font-semibold text-4xl md:text-5xl lg:text-6xl text-white text-center mb-4 tracking-tight">
            sentiment ux team
          </h1>
          <p className="text-sm md:text-base text-white/80 text-center max-w-2xl px-4 mb-8">
            Welcome to our hub, add a work item or view our team's current bandwidth and backlog, excited to elevate our user's experiences!
          </p>
          <Button 
            onClick={() => createWorkItem?.()}
            className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full px-8 py-3 text-base font-medium transition-all duration-300 backdrop-blur-sm"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create a UX Work Item
          </Button>
        </div>
      </div>
      
      {/* Kanban Board Section */}
      <div className="relative w-full bg-background z-20">
        <KanbanBoard onCreateWorkItemRef={setCreateWorkItem} />
      </div>
      
      <Toaster />
    </div>
  )
}

export default App