import { useState } from "react"
import { useKV } from "@github/spark/hooks"
import { Plus, PencilSimple, Trash, User, ArrowRight, Database, Eraser } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import WorkItemSidePanel from "./WorkItemSidePanel"

interface WorkItem {
  id: string
  title: string
  description: string
  assignee: string
  priority: "low" | "medium" | "high"
  type: "research" | "design" | "prototype" | "testing"
}

interface Column {
  id: string
  title: string
  items: WorkItem[]
}

const initialColumns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    items: [
      {
        id: "sample-1",
        title: "User Research Initiative",
        description: "Conduct user interviews to understand pain points and gather feedback on the current workflow",
        assignee: "Sarah Chen",
        priority: "high",
        type: "research"
      },
      {
        id: "sample-2", 
        title: "Design System Documentation",
        description: "Create comprehensive documentation for the component library and design tokens",
        assignee: "Alex Rodriguez",
        priority: "medium",
        type: "design"
      }
    ]
  },
  {
    id: "in-progress",
    title: "In Progress", 
    items: [
      {
        id: "sample-3",
        title: "Mobile App Prototype",
        description: "Build interactive prototype for the mobile dashboard experience",
        assignee: "Jordan Kim",
        priority: "high",
        type: "prototype"
      }
    ]
  },
  {
    id: "review",
    title: "Review",
    items: [
      {
        id: "sample-4",
        title: "Accessibility Audit",
        description: "Review current application for WCAG compliance and accessibility improvements",
        assignee: "Morgan Davis",
        priority: "medium",
        type: "testing"
      }
    ]
  },
  {
    id: "done",
    title: "Done",
    items: [
      {
        id: "sample-5",
        title: "Navigation Redesign",
        description: "Completed mobile-first navigation system with improved user experience",
        assignee: "Taylor Brown",
        priority: "low",
        type: "design"
      }
    ]
  }
]

export default function KanbanBoard() {
  const [columns, setColumns] = useKV<Column[]>("kanban-columns", initialColumns)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [targetColumnId, setTargetColumnId] = useState<string>("")

  const handleCreateWorkItem = (columnId?: string) => {
    setEditingItem(null)
    setTargetColumnId(columnId || "backlog")
    setSidePanelOpen(true)
  }

  const handleEditWorkItem = (item: WorkItem) => {
    setEditingItem(item)
    setSidePanelOpen(true)
  }

  const handleDeleteWorkItem = (itemId: string) => {
    setColumns((prev = []) =>
      prev.map((col) => ({
        ...col,
        items: col.items.filter((item) => item.id !== itemId),
      }))
    )
    toast.success("Work item deleted")
  }

  const handleMoveWorkItem = (itemId: string, newColumnId: string) => {
    setColumns((prev = []) => {
      let itemToMove: WorkItem | null = null
      const updatedColumns = prev.map((col) => {
        const item = col.items.find(item => item.id === itemId)
        if (item) {
          itemToMove = item
          return {
            ...col,
            items: col.items.filter(item => item.id !== itemId)
          }
        }
        return col
      })

      if (itemToMove) {
        return updatedColumns.map((col) => 
          col.id === newColumnId 
            ? { ...col, items: [...col.items, itemToMove!] }
            : col
        )
      }
      return updatedColumns
    })
    toast.success("Work item moved")
  }

  const handleClearStorage = () => {
    setColumns(initialColumns)
    toast.success("Storage cleared - sample data restored")
  }

  const handleSaveWorkItem = (itemData: Omit<WorkItem, "id"> | WorkItem) => {
    if (editingItem) {
      setColumns((prev = []) =>
        prev.map((col) => ({
          ...col,
          items: col.items.map((item) => 
            item.id === editingItem.id ? { ...item, ...itemData } : item
          ),
        }))
      )
      toast.success("Work item updated")
    } else {
      const newItem: WorkItem = {
        id: Date.now().toString(),
        ...itemData,
      }
      setColumns((prev = []) =>
        prev.map((col) => 
          col.id === targetColumnId ? { ...col, items: [...col.items, newItem] } : col
        )
      )
      toast.success("Work item created")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "research": return "bg-blue-100 text-blue-800"
      case "design": return "bg-purple-100 text-purple-800"
      case "prototype": return "bg-orange-100 text-orange-800"
      case "testing": return "bg-teal-100 text-teal-800"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Project Board</h2>
            <p className="text-muted-foreground text-lg">Track and manage your team's workflow</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database size={16} />
              <span>Data persisted automatically</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearStorage}
              className="flex items-center gap-2"
            >
              <Eraser size={16} />
              Reset Data
            </Button>
          </div>
        </div>
      </div>

      {/* Storage Information Card */}
      <div className="mt-8 max-w-2xl">
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Database className="text-accent mt-1" size={20} />
              <div>
                <h4 className="font-medium text-card-foreground mb-1">Persistent Data Storage</h4>
                <p className="text-sm text-muted-foreground">
                  All work items are automatically saved using GitHub Spark's storage system. 
                  Your data persists between sessions and page refreshes. Try creating, editing, 
                  or moving items - everything will be saved automatically!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {(columns || []).map((column) => (
          <div key={column.id} className="space-y-4">
            <Card className="border-2 border-dashed border-border bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {column.items.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreateWorkItem(column.id)}
                    className="h-8 w-8 p-0 hover:bg-accent"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              {column.items.map((item) => (
                <Card key={item.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-card-foreground mb-1 line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {item.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getPriorityColor(item.priority)} variant="outline">
                            {item.priority}
                          </Badge>
                          <Badge className={getTypeColor(item.type)} variant="outline">
                            {item.type}
                          </Badge>
                        </div>

                        {item.assignee && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <User size={14} />
                            <span>{item.assignee}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Select
                            value=""
                            onValueChange={(newColumnId) => handleMoveWorkItem(item.id, newColumnId)}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <div className="flex items-center gap-1">
                                <ArrowRight size={12} />
                                <SelectValue placeholder="Move to..." />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {(columns || [])
                                .filter(col => col.id !== column.id)
                                .map(col => (
                                <SelectItem key={col.id} value={col.id}>
                                  {col.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditWorkItem(item)}
                          className="h-8 w-8 p-0 hover:bg-accent"
                        >
                        <PencilSimple size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWorkItem(item.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {column.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No items yet</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCreateWorkItem(column.id)}
                    className="mt-2 text-xs"
                  >
                    Add first item
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <WorkItemSidePanel
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        onSave={handleSaveWorkItem}
        editingItem={editingItem}
        columnId={targetColumnId}
      />
    </div>
  )
}