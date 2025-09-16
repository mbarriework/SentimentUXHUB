import { useState } from "react"
import { useKV } from "@github/spark/hooks"
import { Plus, PencilSimple, Trash, User } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    items: []
  },
  {
    id: "in-progress",
    title: "In Progress", 
    items: []
  },
  {
    id: "review",
    title: "Review",
    items: []
  },
  {
    id: "done",
    title: "Done",
    items: []
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
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Project Board</h2>
        <p className="text-muted-foreground text-lg">Track and manage your team's workflow</p>
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User size={14} />
                            <span>{item.assignee}</span>
                          </div>
                        )}
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