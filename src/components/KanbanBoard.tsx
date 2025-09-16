import { useState, useEffect } from "react"
import { useKV } from "@github/spark/hooks"
import { Plus, PencilSimple, Trash, User, ArrowRight, Database } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import WorkItemSidePanel from "./WorkItemSidePanel"

interface KanbanBoardProps {
  createWorkItemTrigger: boolean
  onCreateWorkItemHandled: () => void
}

type ViewMode = "current" | "backlog" | "capacity"

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

const initialCurrentColumns: Column[] = [
  {
    id: "new",
    title: "New",
    items: [
      {
        id: "sample-1",
        title: "Define Goals and Objectives",
        description: "Clearly outline the purpose of the website, target audience, and project goals",
        assignee: "UI Team",
        priority: "high",
        type: "research"
      },
      {
        id: "sample-2", 
        title: "Create User Personas",
        description: "Develop fictional representations of your ideal users to understand their needs",
        assignee: "UI Team",
        priority: "medium",
        type: "research"
      }
    ]
  },
  {
    id: "in-progress",
    title: "In Progress",
    items: [
      {
        id: "sample-3",
        title: "Conduct Market Research", 
        description: "Analyze competitors, market trends, and industry standards to inform decisions",
        assignee: "UI Team",
        priority: "medium",
        type: "research"
      },
      {
        id: "sample-4",
        title: "Design System Updates",
        description: "Update button components and color palette for consistency",
        assignee: "Design Team",
        priority: "high",
        type: "design"
      }
    ]
  }
]

const initialBacklogColumns: Column[] = [
  {
    id: "newly-created",
    title: "Newly created",
    items: []
  },
  {
    id: "backlog",
    title: "Backlog",
    items: [
      {
        id: "backlog-1",
        title: "User Testing Session",
        description: "Plan and conduct user testing for the new dashboard interface",
        assignee: "Research Team",
        priority: "high",
        type: "testing"
      },
      {
        id: "backlog-2",
        title: "Mobile App Prototype",
        description: "Create interactive prototype for mobile application",
        assignee: "Design Team",
        priority: "medium",
        type: "prototype"
      },
      {
        id: "backlog-3",
        title: "AR Integration Concept",
        description: "Explore augmented reality features for product visualization",
        assignee: "Innovation Team",
        priority: "low",
        type: "research"
      },
      {
        id: "backlog-4",
        title: "Accessibility Audit",
        description: "Comprehensive review of accessibility standards compliance",
        assignee: "QA Team",
        priority: "high",
        type: "testing"
      },
      {
        id: "backlog-5",
        title: "Voice Interface Design",
        description: "Design voice commands and responses for hands-free interaction",
        assignee: "UX Team",
        priority: "low",
        type: "design"
      }
    ]
  }
]

function KanbanBoard({ createWorkItemTrigger, onCreateWorkItemHandled }: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("current")
  const [currentColumns, setCurrentColumns] = useKV<Column[]>("current-columns", initialCurrentColumns)
  const [backlogColumns, setBacklogColumns] = useKV<Column[]>("backlog-columns", initialBacklogColumns)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [targetColumnId, setTargetColumnId] = useState<string>("")

  const columns = viewMode === "current" ? (currentColumns || []) : (backlogColumns || [])
  const setColumns = viewMode === "current" ? setCurrentColumns : setBacklogColumns

  // Handle create work item trigger from parent
  useEffect(() => {
    if (createWorkItemTrigger) {
      handleCreateWorkItem()
      onCreateWorkItemHandled()
    }
  }, [createWorkItemTrigger, onCreateWorkItemHandled])

  const handleCreateWorkItem = (columnId?: string) => {
    setEditingItem(null)
    setTargetColumnId(columnId || (columns && columns[0]?.id) || "new")
    setSidePanelOpen(true)
  }

  const handleEditWorkItem = (item: WorkItem) => {
    setEditingItem(item)
    setSidePanelOpen(true)
  }

  const handleDeleteWorkItem = (itemId: string) => {
    setColumns((prev: Column[] = []) =>
      prev.map((col) => ({
        ...col,
        items: col.items.filter((item) => item.id !== itemId),
      }))
    )
    toast.success("Work item deleted")
  }

  const handleMoveWorkItem = (itemId: string, newColumnId: string) => {
    setColumns((prev: Column[] = []) => {
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

  const handleSaveWorkItem = (itemData: Omit<WorkItem, "id"> | WorkItem) => {
    if (editingItem) {
      setColumns((prev: Column[] = []) =>
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
      setColumns((prev: Column[] = []) =>
        prev.map((col) => 
          col.id === targetColumnId ? { ...col, items: [...col.items, newItem] } : col
        )
      )
      toast.success("Work item created")
    }
  }

  const renderCapacityView = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Get first day of month and days in month
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // Month names
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    
    // Generate calendar days
    const calendarDays: (number | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day)
    }
    
    // Sample team assignments for demonstration
    const teamAssignments: Record<number, string[]> = {
      15: ["UI Team", "Design Team"],
      16: ["Research Team"],
      17: ["UI Team"],
      22: ["Design Team", "QA Team"],
      23: ["UI Team", "Research Team"],
      25: ["Design Team"],
      28: ["UI Team", "QA Team"]
    }
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-foreground mb-2">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <p className="text-muted-foreground">Team capacity and scheduling</p>
        </div>
        
        <Card className="p-6">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-medium text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[80px] p-2 border border-border/30 rounded-md relative
                  ${day === null ? 'bg-muted/30' : 'bg-card hover:bg-muted/50 transition-colors'}
                  ${day === currentDate.getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear() 
                    ? 'ring-2 ring-accent' : ''}
                `}
              >
                {day && (
                  <>
                    <div className="text-sm font-medium text-foreground mb-1">{day}</div>
                    {teamAssignments[day] && (
                      <div className="space-y-1">
                        {teamAssignments[day].map((team, idx) => (
                          <div
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-md truncate ${
                              team === "UI Team" ? "bg-blue-100 text-blue-800" :
                              team === "Design Team" ? "bg-purple-100 text-purple-800" :
                              team === "Research Team" ? "bg-green-100 text-green-800" :
                              "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {team}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
        
        {/* Team Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <div>
              <div className="font-medium text-sm">UI Team</div>
              <div className="text-xs text-muted-foreground">Frontend & Interface</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <div>
              <div className="font-medium text-sm">Design Team</div>
              <div className="text-xs text-muted-foreground">Visual & UX Design</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <div>
              <div className="font-medium text-sm">Research Team</div>
              <div className="text-xs text-muted-foreground">User Research</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <div>
              <div className="font-medium text-sm">QA Team</div>
              <div className="text-xs text-muted-foreground">Quality Assurance</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background">
      {/* Header with View Toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {/* Minimalistic View Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode("current")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "current"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Current Work
            </button>
            <button
              onClick={() => setViewMode("backlog")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "backlog"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Backlog
            </button>
            <button
              onClick={() => setViewMode("capacity")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "capacity"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Capacity
            </button>
          </div>

          {/* Auto-saved indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
            <Database size={14} />
            <span>Auto-saved</span>
          </div>
        </div>
      </div>
      
      {/* Content based on view mode */}
      {viewMode === "capacity" ? renderCapacityView() : (
        <>
          {viewMode === "backlog" && (
            <div className="mb-6 text-center">
              <p className="text-muted-foreground text-sm">Will be sorted by team later</p>
            </div>
          )}
          <div className={`grid gap-6 ${
            viewMode === "backlog" 
              ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" 
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}>
          {(columns || []).map((column) => (
            <div key={column.id} className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground">{column.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCreateWorkItem(column.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Plus size={16} />
                </Button>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 min-h-[400px]">
                {column.items.map((item) => (
                  <Card key={item.id} className="group hover:shadow-md transition-all duration-200 border border-border/50">
                    <CardContent className="p-4">
                      {/* Task Title */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-card-foreground leading-tight pr-2">
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

                      {/* Task Description */}
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Bottom Row - Priority Badge and Assignee */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          className={`text-xs px-2 py-1 rounded-md ${
                            item.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-green-100 text-green-800 border-green-200'
                          }`}
                          variant="outline"
                        >
                          {item.priority.toUpperCase()}
                        </Badge>

                        {/* Move Dropdown */}
                        <Select onValueChange={(value) => handleMoveWorkItem(item.id, value)}>
                          <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-accent">
                            <ArrowRight size={12} />
                          </SelectTrigger>
                          <SelectContent>
                            {(columns || []).filter(col => col.id !== column.id).map((col) => (
                              <SelectItem key={col.id} value={col.id}>
                                Move to {col.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Assignee Row */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <User size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{item.assignee}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
        </>
      )}

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

export default KanbanBoard
