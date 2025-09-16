import { useState, useEffect } from "react"
import { useKV } from "@github/spark/hooks"
import { Plus, PencilSimple, Trash, User, ArrowRight, Database } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import WorkItemSidePanel from "./WorkItemSidePanel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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

interface KanbanBoardProps {
  onCreateWorkItemRef?: (createFn: () => void) => void
}

export default function KanbanBoard({ onCreateWorkItemRef }: KanbanBoardProps) {
  const [columns, setColumns] = useKV<Column[]>("kanban-columns", initialColumns)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [targetColumnId, setTargetColumnId] = useState<string>("")

  const handleCreateWorkItem = (columnId?: string) => {
    setEditingItem(null)
    setTargetColumnId(columnId || "backlog")
    setSidePanelOpen(true)
  }

  // Expose the create function to parent component
  useEffect(() => {
    if (onCreateWorkItemRef) {
      onCreateWorkItemRef(() => handleCreateWorkItem())
    }
  }, [onCreateWorkItemRef])

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

  const renderWorkItemCard = (item: WorkItem, column: Column) => (
    <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 hover:border-accent/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-3">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-card-foreground text-sm leading-tight pr-2">
            {item.title}
          </h4>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditWorkItem(item)}
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              <PencilSimple size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteWorkItem(item.id)}
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash size={12} />
            </Button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge className={`${getPriorityColor(item.priority)} text-xs px-2 py-0.5`} variant="outline">
            {item.priority}
          </Badge>
          <Badge className={`${getTypeColor(item.type)} text-xs px-2 py-0.5`} variant="outline">
            {item.type}
          </Badge>
        </div>

        {/* Assignee */}
        {item.assignee && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <User size={12} />
            <span className="truncate">{item.assignee}</span>
          </div>
        )}

        {/* Move selector */}
        <Select
          value=""
          onValueChange={(newColumnId) => handleMoveWorkItem(item.id, newColumnId)}
        >
          <SelectTrigger className="h-7 text-xs border-dashed hover:border-solid transition-all">
            <div className="flex items-center gap-1">
              <ArrowRight size={12} />
              <SelectValue placeholder="Move to..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(columns || [])
              .filter((col) => col.id !== column.id)
              .map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )

  const renderColumnHeader = (column: Column) => (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground text-base">{column.title}</h3>
          <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
            {column.items.length}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreateWorkItem(column.id)}
          className="h-8 px-3 text-xs hover:bg-accent transition-colors"
        >
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>
    </div>
  )

  const renderEmptyState = (column: Column) => (
    <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg bg-muted/20">
      <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
        <Plus size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-3">No items in {column.title.toLowerCase()}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCreateWorkItem(column.id)}
        className="text-xs hover:bg-accent"
      >
        Add your first item
      </Button>
    </div>
  )

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* Removed title and subtitle as requested */}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
              <Database size={14} />
              <span>Auto-saved</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <Tabs defaultValue="working" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="working" className="text-sm font-medium">
              Currently Working On
            </TabsTrigger>
            <TabsTrigger value="backlog" className="text-sm font-medium">
              Backlog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="working" className="mt-0">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {(columns || [])
                .filter((col) => ["in-progress", "review", "done"].includes(col.id))
                .map((column) => (
                  <div key={column.id} className="space-y-3">
                    {renderColumnHeader(column)}
                    <div className="space-y-3 min-h-[200px]">
                      {column.items.map((item) => renderWorkItemCard(item, column))}
                      {column.items.length === 0 && renderEmptyState(column)}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="backlog" className="mt-0">
            <div className="max-w-4xl mx-auto">
              {(columns || [])
                .filter((col) => col.id === "backlog")
                .map((column) => (
                  <div key={column.id} className="space-y-3">
                    {renderColumnHeader(column)}
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {column.items.map((item) => renderWorkItemCard(item, column))}
                      {column.items.length === 0 && renderEmptyState(column)}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
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