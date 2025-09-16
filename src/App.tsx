import ParticleSystem from "./components/ParticleSystem"
import KanbanBoard from "./components/KanbanBoard"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus } from "@phosphor-icons/react"
import { useState } from "react"

function App() {
  const [createWorkItemOpen, setCreateWorkItemOpen] = useState(false)

  const handleCreateWorkItem = () => {
    setCreateWorkItemOpen(true)
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Particle System Hero Section */}
      <div className="relative w-full h-[60vh] overflow-hidden">
        <ParticleSystem />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <h1 className="font-semibold text-3xl md:text-4xl lg:text-5xl text-white text-center mb-4 tracking-tight">
            sentiment ux team
          </h1>
          <p className="text-white/80 text-center text-lg mb-6 max-w-2xl">
            Welcome to our team's hub. Add work items, check team capacity, and discover how we collaborate. We're thrilled to elevate the user experience together!
          </p>
          <Button 
            onClick={handleCreateWorkItem}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus size={16} className="mr-2" />
            Create new work item
          </Button>
        </div>
      </div>
      
      {/* Kanban Board Section */}
      <div className="relative w-full bg-background z-20">
        <KanbanBoard createWorkItemTrigger={createWorkItemOpen} onCreateWorkItemHandled={() => setCreateWorkItemOpen(false)} />
      </div>
      
      <Toaster />
    </div>
  )
}

export default App