import { useState, useEffect } from "react"
import { useKV } from "@github/spark/hooks"
import { Plus, PencilSimple, Trash, User, ArrowRight, Database, DotsThree, CaretUp, CaretDown, ArrowUp, ArrowDown, X, MagnifyingGlass } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import WorkItemSidePanel from "./WorkItemSidePanel"

interface KanbanBoardProps {
  createWorkItemTrigger: boolean
  onCreateWorkItemHandled: () => void
}

type ViewMode = "current" | "backlog" | "capacity" | "about-ux"

interface WorkItem {
  id: string
  title: string
  description: string
  assignee: string
  priority: "low" | "medium" | "high"
  type: "research" | "design" | "prototype" | "testing"
  status: "new" | "in-progress" | "done" | "upcoming" | "potential" | "other"
  specLink?: string
  pmOwner?: string
  dueDate?: string
  devDate?: string
  quarter?: "Q1" | "Q2" | "Q3" | "Q4"
  size?: "S" | "M" | "L" | "XL"
}

// Static column definitions - never change
const CURRENT_WORK_COLUMNS = [
  { id: "new", title: "New" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" }
]

const BACKLOG_COLUMNS = [
  { id: "upcoming", title: "Official Q2 Backlog" },
  { id: "potential", title: "UX Request" },
  { id: "other", title: "Other" }
]

// Initial work items
const initialWorkItems: WorkItem[] = [
  {
    id: "sample-1",
    title: "Define Goals and Objectives",
    description: "Clearly outline the purpose of the website, target audience, and project goals",
    assignee: "UI Team",
    priority: "high",
    type: "research",
    status: "new"
  },
  {
    id: "sample-2", 
    title: "Create User Personas",
    description: "Develop fictional representations of your ideal users to understand their needs",
    assignee: "UI Team",
    priority: "medium",
    type: "research",
    status: "new"
  },
  {
    id: "sample-3",
    title: "Conduct Market Research", 
    description: "Analyze competitors, market trends, and industry standards to inform decisions",
    assignee: "UI Team",
    priority: "medium",
    type: "research",
    status: "in-progress"
  },
  {
    id: "sample-4",
    title: "Design System Updates",
    description: "Update button components and color palette for consistency",
    assignee: "Design Team",
    priority: "high",
    type: "design",
    status: "in-progress"
  },
  {
    id: "sample-5",
    title: "Voice Interface Design",
    description: "Design voice commands and responses for hands-free interaction",
    assignee: "UX Team",
    priority: "low",
    type: "design",
    status: "done"
  },
  {
    id: "backlog-1",
    title: "User Testing Session",
    description: "Plan and conduct user testing for the new dashboard interface",
    assignee: "Research Team",
    priority: "high",
    type: "testing",
    status: "upcoming"
  },
  {
    id: "backlog-2",
    title: "Mobile App Prototype",
    description: "Create interactive prototype for mobile application",
    assignee: "Design Team",
    priority: "medium",
    type: "prototype",
    status: "upcoming"
  },
  {
    id: "backlog-3",
    title: "AR Integration Concept",
    description: "Explore augmented reality features for product visualization",
    assignee: "Innovation Team",
    priority: "low",
    type: "research",
    status: "potential"
  },
  {
    id: "backlog-4",
    title: "Accessibility Audit",
    description: "Comprehensive review of accessibility standards compliance",
    assignee: "QA Team",
    priority: "high",
    type: "testing",
    status: "potential"
  }
]

function KanbanBoard({ createWorkItemTrigger, onCreateWorkItemHandled }: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("current")
  const [workItems, setWorkItems] = useKV<WorkItem[]>("work-items", initialWorkItems)
  
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [targetStatus, setTargetStatus] = useState<WorkItem["status"]>("new")
  
  // Filter state for backlog
  const [filterText, setFilterText] = useState("")
  
  // Capacity planning state
  const [capacityPlanningMode, setCapacityPlanningMode] = useState(false)
  const [selectedCapacityItem, setSelectedCapacityItem] = useState<WorkItem | null>(null)
  const [capacityBlocks, setCapacityBlocks] = useKV<{[key: string]: {item: WorkItem, dates: number[]}}>("capacity-blocks-v2", {
    // Test entries for September 2025 (month 8) - multiple test cases
    "test-1__8__2025": {
      item: {
        id: "test-1",
        title: "Design Review",
        description: "Review UI mockups",
        assignee: "Maggie",
        priority: "high" as const,
        type: "design" as const,
        status: "upcoming" as const
      },
      dates: [15, 16, 17]
    },
    "test-2__8__2025": {
      item: {
        id: "test-2", 
        title: "User Research",
        description: "Conduct user interviews",
        assignee: "Lenny",
        priority: "medium" as const,
        type: "research" as const,
        status: "upcoming" as const
      },
      dates: [18, 19]
    }
  })
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Day panel state for viewing work items for a specific day
  const [dayPanelOpen, setDayPanelOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Handle create work item trigger from parent
  useEffect(() => {
    if (createWorkItemTrigger) {
      handleCreateWorkItem()
      onCreateWorkItemHandled()
    }
  }, [createWorkItemTrigger, onCreateWorkItemHandled])

  // Debug capacity blocks changes
  useEffect(() => {
    console.log('📊 Capacity blocks updated:', capacityBlocks)
  }, [capacityBlocks])

  const handleCreateWorkItem = (status?: WorkItem["status"]) => {
    setEditingItem(null)
    setTargetStatus(status || "upcoming") // Default to upcoming (backlog) instead of potential
    setSidePanelOpen(true)
  }

  const handleEditWorkItem = (item: WorkItem) => {
    setEditingItem(item)
    setSidePanelOpen(true)
  }

  const handleDeleteWorkItem = (itemId: string) => {
    setWorkItems((prev = []) => prev.filter(item => item.id !== itemId))
    toast.success("Work item deleted")
  }

  const handleMoveWorkItem = (itemId: string, newStatus: WorkItem["status"]) => {
    setWorkItems((prev = []) => 
      prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    )
    toast.success("Work item moved")
  }

  const handleAddCapacityRange = () => {
    console.log('🔄 handleAddCapacityRange called')
    console.log('Selected item:', selectedCapacityItem)
    console.log('Start date:', startDate)
    console.log('End date:', endDate)
    console.log('Current month/year:', currentMonth, currentYear)
    
    if (!selectedCapacityItem || !startDate || !endDate || !capacityBlocks) {
      console.log('❌ Missing required data')
      return
    }
    
    // Parse dates more explicitly to avoid timezone issues
    const startParts = startDate.split('-').map(Number)
    const endParts = endDate.split('-').map(Number)
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]) // Month is 0-indexed
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]) // Month is 0-indexed
    
    console.log('Start date object:', start)
    console.log('End date object:', end)
    
    if (start > end) {
      toast.error("Start date must be before end date")
      console.log('❌ Start date after end date')
      return
    }
    
    // Generate all dates between start and end
    const dates: number[] = []
    const current = new Date(start)
    
    console.log('Generating dates...')
    while (current <= end) {
      console.log(`Checking date: ${current.getDate()}/${current.getMonth()}/${current.getFullYear()}`)
      console.log(`Against calendar: month=${currentMonth}, year=${currentYear}`)
      
      // Only add dates that are in the current calendar month/year
      if (current.getMonth() === currentMonth && current.getFullYear() === currentYear) {
        dates.push(current.getDate())
        console.log(`✅ Added date: ${current.getDate()}`)
      } else {
        console.log(`❌ Date not in current month/year`)
      }
      current.setDate(current.getDate() + 1)
    }
    
    console.log('Final dates array:', dates)
    
    if (dates.length === 0) {
      toast.error("No dates in the selected range fall within the current calendar month")
      console.log('❌ No valid dates found')
      return
    }
    
    const blockKey = `${selectedCapacityItem.id}__${currentMonth}__${currentYear}`
    console.log('Block key:', blockKey)
    
    // Use functional update to ensure we have the latest state
    setCapacityBlocks(prevBlocks => {
      if (!prevBlocks) return {}
      
      const existingBlock = prevBlocks[blockKey]
      console.log('Existing block:', existingBlock)
      
      let newBlocks
      if (existingBlock) {
        // Merge with existing dates
        const newDates = [...new Set([...existingBlock.dates, ...dates])].sort((a, b) => a - b)
        console.log('Merging with existing dates. New dates:', newDates)
        
        newBlocks = {
          ...prevBlocks,
          [blockKey]: {
            ...existingBlock,
            dates: newDates
          }
        }
      } else {
        // Create new capacity block
        console.log('Creating new capacity block')
        newBlocks = {
          ...prevBlocks,
          [blockKey]: {
            item: selectedCapacityItem,
            dates: dates.sort((a, b) => a - b)
          }
        }
      }
      
      console.log('New capacity blocks object:', newBlocks)
      return newBlocks
    })
    
    toast.success(`Added ${selectedCapacityItem.title} to calendar for ${dates.length} day${dates.length > 1 ? 's' : ''}`)
    
    // Reset form
    setSelectedCapacityItem(null)
    setStartDate("")
    setEndDate("")
    setCapacityPlanningMode(false)
  }

  const handleAddCapacity = (day: number) => {
    if (!selectedCapacityItem || !capacityBlocks) return
    
    const blockKey = `${selectedCapacityItem.id}__${currentMonth}__${currentYear}`
    const existingBlock = capacityBlocks[blockKey]
    
    if (existingBlock) {
      // Add day to existing block if not already included
      if (!existingBlock.dates.includes(day)) {
        setCapacityBlocks({
          ...capacityBlocks,
          [blockKey]: {
            ...existingBlock,
            dates: [...existingBlock.dates, day].sort((a, b) => a - b)
          }
        })
      }
    } else {
      // Create new capacity block
      setCapacityBlocks({
        ...capacityBlocks,
        [blockKey]: {
          item: selectedCapacityItem,
          dates: [day]
        }
      })
    }
    
    toast.success(`Added ${selectedCapacityItem.title} to ${currentMonth + 1}/${day}`)
  }

  const handleSaveWorkItem = (itemData: Omit<WorkItem, "id">) => {
    if (editingItem) {
      setWorkItems((prev = []) =>
        prev.map((item) => 
          item.id === editingItem.id ? { ...item, ...itemData } : item
        )
      )
      toast.success("Work item updated")
    } else {
      const newItem: WorkItem = {
        id: Date.now().toString(),
        ...itemData,
        status: targetStatus,
      }
      setWorkItems((prev = []) => [...prev, newItem])
      
      // Check if the item is being added to backlog (upcoming or potential)
      if (targetStatus === "upcoming" || targetStatus === "potential") {
        toast.success("Work item created and added to backlog")
        // Switch to backlog view if not already there
        if (viewMode !== "backlog") {
          setViewMode("backlog")
        }
      } else {
        toast.success("Work item created")
      }
    }
  }

  // Handle clicking on a day with work items to open day panel
  const handleDayClick = (day: number) => {
    setSelectedDay(day)
    setDayPanelOpen(true)
  }

  // Handle editing a work item's time range
  const handleEditWorkItemTime = (capacityKey: string) => {
    const [itemId, blockMonth, blockYear] = capacityKey.split('__')
    const workItem = workItems?.find(item => item.id === itemId)
    
    if (workItem && capacityBlocks && capacityBlocks[capacityKey]) {
      // Set up for editing time range
      setSelectedCapacityItem(workItem)
      const block = capacityBlocks[capacityKey]
      // Calculate start and end dates from the block data
      const dates = block.dates.sort((a, b) => a - b)
      const startDateStr = new Date(parseInt(blockYear), parseInt(blockMonth), dates[0]).toISOString().split('T')[0]
      const endDateStr = new Date(parseInt(blockYear), parseInt(blockMonth), dates[dates.length - 1]).toISOString().split('T')[0]
      setStartDate(startDateStr)
      setEndDate(endDateStr)
      setCapacityPlanningMode(true)
      setDayPanelOpen(false)
    }
  }

  // Handle deleting a work item from capacity
  const handleDeleteWorkItemFromCapacity = (capacityKey: string) => {
    setCapacityBlocks(prev => {
      if (!prev) return {}
      const newBlocks = { ...prev }
      delete newBlocks[capacityKey]
      return newBlocks
    })
    toast.success("Work item removed from calendar")
  }

  // Handle adding a new work item to a specific day
  const handleAddWorkItemToDay = (day: number) => {
    // Pre-select dates for the chosen day
    const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
    setStartDate(dateStr)
    setEndDate(dateStr)
    setCapacityPlanningMode(true)
    setDayPanelOpen(false)
  }

  // Utility function to truncate text for calendar display
  const truncateText = (text: string, maxLength: number = 12): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  // Get capacity blocks for a specific day
  const getCapacityForDay = (day: number): Array<{item: WorkItem, key: string}> => {
    if (!capacityBlocks) {
      return []
    }
    
    const dayCapacity: Array<{item: WorkItem, key: string}> = []
    Object.entries(capacityBlocks).forEach(([blockKey, block]) => {
      const [itemId, blockMonth, blockYear] = blockKey.split('__')
      const blockMonthNum = parseInt(blockMonth)
      const blockYearNum = parseInt(blockYear)
      
      if (blockMonthNum === currentMonth && blockYearNum === currentYear && block.dates.includes(day)) {
        dayCapacity.push({ item: block.item, key: blockKey })
        console.log(`✓ Day ${day}: Found "${block.item.title}" assigned to "${block.item.assignee}"`)
      }
    })
    return dayCapacity
  }

  // Filter function for backlog items
  const filterWorkItems = (items: WorkItem[]) => {
    if (!filterText.trim()) return items
    
    const searchText = filterText.toLowerCase()
    return items.filter(item => {
      const assigneeText = Array.isArray(item.assignee) 
        ? item.assignee.join(' ').toLowerCase()
        : (item.assignee || '').toLowerCase()
      
      return (
        item.title.toLowerCase().includes(searchText) ||
        item.description.toLowerCase().includes(searchText) ||
        assigneeText.includes(searchText) ||
        (item.pmOwner || '').toLowerCase().includes(searchText)
      )
    })
  }

  const renderCapacityView = () => {
    const currentDate = new Date()
    
    console.log('=== CALENDAR DEBUG ===')
    console.log('Current viewing month:', currentMonth, 'year:', currentYear)
    console.log('Today is month:', currentDate.getMonth(), 'year:', currentDate.getFullYear())
    console.log('Capacity blocks:', capacityBlocks)
    
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
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11)
                  setCurrentYear(currentYear - 1)
                } else {
                  setCurrentMonth(currentMonth - 1)
                }
              }}
            >
              ←
            </Button>
            <h3 className="text-2xl font-semibold text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0)
                  setCurrentYear(currentYear + 1)
                } else {
                  setCurrentMonth(currentMonth + 1)
                }
              }}
            >
              →
            </Button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <p className="text-muted-foreground">Team capacity and scheduling</p>
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-2 py-1 rounded-full">
              UX Team Use Only - Do Not Edit
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setCapacityPlanningMode(!capacityPlanningMode)}
            className="text-sm"
          >
            {capacityPlanningMode ? "Cancel" : "Add Capacity"}
          </Button>
        </div>
        
        <div className={`${capacityPlanningMode ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
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
                  onClick={() => {
                    if (day) {
                      if (capacityPlanningMode && selectedCapacityItem) {
                        handleAddCapacity(day)
                      } else {
                        // Open day panel to view work items for this day
                        handleDayClick(day)
                      }
                    }
                  }}
                  className={`
                    min-h-[100px] p-2 border border-border/30 rounded-md relative
                    ${day === null ? 'bg-muted/30' : 'bg-card hover:bg-muted/50 transition-colors cursor-pointer'}
                    ${capacityPlanningMode && selectedCapacityItem && day ? 'hover:bg-accent/20' : ''}
                    ${day === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear() 
                      ? 'ring-2 ring-accent' : ''}
                  `}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-foreground mb-1">{day}</div>
                      {getCapacityForDay(day).length > 0 && (
                        <div className="space-y-1">
                          {getCapacityForDay(day).map((capacity, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-1 py-0.5 rounded text-center truncate cursor-pointer hover:opacity-80 transition-opacity ${
                                capacity.item.priority === "high" ? "bg-red-200 text-red-900" :
                                capacity.item.priority === "medium" ? "bg-yellow-200 text-yellow-900" :
                                "bg-green-200 text-green-900"
                              }`}
                              title={`${capacity.item.title} - ${capacity.item.assignee || "Unassigned"}`}
                              onClick={() => handleDayClick(day)}
                            >
                              {truncateText(capacity.item.title)}
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

          {/* Capacity Planning Panel */}
          {capacityPlanningMode && (
            <Card className="p-6">
              <h4 className="font-semibold text-lg mb-4">Add Work Item to Calendar</h4>
              
              {/* Work Item Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Work Item</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {workItems?.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCapacityItem(item)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          selectedCapacityItem?.id === item.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {item.description}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge 
                            className={`text-xs px-2 py-0.5 ${
                              item.priority === 'high' ? 'bg-red-100 text-red-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                            variant="outline"
                          >
                            {item.priority.toUpperCase()}
                          </Badge>
                          {item.assignee && (
                            <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700" variant="outline">
                              {item.assignee}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCapacityItem && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-sm mb-4">Selected: {selectedCapacityItem.title}</h5>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="startDate" className="text-xs font-medium mb-1 block">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate" className="text-xs font-medium mb-1 block">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Select a date range to schedule this work item on the calendar
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddCapacityRange}
                          disabled={!startDate || !endDate}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCapacityItem(null)
                            setStartDate("")
                            setEndDate("")
                            setCapacityPlanningMode(false)
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  const renderAboutUXView = () => {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-card rounded-lg border p-12">
          <h3 className="text-3xl font-semibold text-foreground mb-4">
            About UX
          </h3>
          <p className="text-xl text-muted-foreground">
            Coming Soon
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            This section will contain UX guidelines, best practices, and design resources.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background relative">
      {/* Developed by Maggie Tag */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-transparent border-2 border-dashed border-lime-500 text-lime-600 text-xs px-3 py-1.5 rounded-full shadow-lg opacity-60 hover:opacity-90 transition-opacity duration-200 backdrop-blur-sm">
          developed and designed by maggie
        </div>
      </div>

      {/* Header with View Toggle */}
      <div className="mb-8">
        {/* Dark Header Container */}
        <div className="rounded-2xl px-6 py-2 mb-6 shadow-lg shadow-slate-900/50" style={{backgroundColor: 'rgb(23, 23, 54)'}}>
          <div className="flex items-center justify-between">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("current")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "current"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-white hover:text-gray-200"
                }`}
              >
                Current Work
              </button>
              <button
                onClick={() => setViewMode("backlog")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "backlog"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-white hover:text-gray-200"
                }`}
              >
                Backlog
              </button>
              <button
                onClick={() => setViewMode("capacity")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "capacity"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-white hover:text-gray-200"
                }`}
              >
                Capacity
              </button>
              <button
                onClick={() => setViewMode("about-ux")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "about-ux"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-white hover:text-gray-200"
                }`}
              >
                About UX
              </button>
            </div>

            {/* Filter and Auto-saved */}
            <div className="flex items-center gap-4">
              {(viewMode === "backlog" || viewMode === "current") && (
                <div className="relative w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlass className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Filter by PM owner, title, or description..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-10 pr-10 text-sm bg-white"
                  />
                  {filterText && (
                    <button
                      onClick={() => setFilterText("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {/* Auto-saved indicator */}
              <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/20 rounded-full px-3 py-1.5">
                <Database size={14} />
                <span>Auto-saved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content based on view mode */}
      <div className="pt-8">
        {viewMode === "capacity" ? renderCapacityView() : 
         viewMode === "about-ux" ? renderAboutUXView() : (
          <>
            {viewMode === "backlog" ? (
              /* Backlog View - Three Columns */
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto">
              {BACKLOG_COLUMNS.map((column) => (
                <div key={column.id} className="space-y-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-lg text-foreground">{column.title}</h3>
                      {column.id === "upcoming" && (
                        <p className="text-xs text-muted-foreground mt-1">October - December | ordered by priority</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreateWorkItem(column.id as WorkItem["status"])}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 min-h-[400px]">
                    {filterWorkItems(workItems?.filter(item => item.status === column.id) || []).map((item) => (
                      <Card 
                        key={item.id} 
                        className="group hover:shadow-md transition-all duration-200 border border-border/50 cursor-pointer"
                        onClick={() => handleEditWorkItem(item)}
                      >
                    <CardContent className="p-4">
                      {/* Task Title */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm text-card-foreground leading-tight pr-2">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {/* Priority Arrows */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={(e) => { e.stopPropagation(); /* handleMoveCardUp(item.id, item.status) */ }}
                          >
                            <ArrowUp size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={(e) => { e.stopPropagation(); /* handleMoveCardDown(item.id, item.status) */ }}
                          >
                            <ArrowDown size={12} />
                          </Button>
                          {/* More Options */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DotsThree size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditWorkItem(item); }}>
                              <PencilSimple size={14} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveWorkItem(item.id, "new"); }}>
                              <ArrowRight size={14} className="mr-2" />
                              Move to Current Work
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); handleDeleteWorkItem(item.id); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash size={14} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Task Description */}
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Bottom Row - Priority Badge and Assignee */}
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {item.assignee && (
                          <Badge 
                            className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 border-gray-200"
                            variant="outline"
                          >
                            {item.assignee}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
          ) : (
            /* Current Work View - Kanban Columns */
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto">
              {CURRENT_WORK_COLUMNS.map((column) => (
                <div key={column.id} className="space-y-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-lg text-foreground">{column.title}</h3>
                      {column.id === "new" && (
                        <p className="text-xs text-muted-foreground mt-1">(ordered by priority)</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreateWorkItem(column.id as WorkItem["status"])}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 min-h-[400px]">
                    {filterWorkItems(workItems?.filter(item => item.status === column.id) || []).map((item) => (
                      <Card 
                        key={item.id} 
                        className="group hover:shadow-md transition-all duration-200 border border-border/50 cursor-pointer"
                        onClick={() => handleEditWorkItem(item)}
                      >
                        <CardContent className="p-4">
                          {/* Task Title */}
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm text-card-foreground leading-tight pr-2">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {/* Priority Arrows */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-100"
                                onClick={(e) => { e.stopPropagation(); /* handleMoveCardUp(item.id, item.status) */ }}
                              >
                                <ArrowUp size={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-100"
                                onClick={(e) => { e.stopPropagation(); /* handleMoveCardDown(item.id, item.status) */ }}
                              >
                                <ArrowDown size={12} />
                              </Button>
                              {/* More Options */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DotsThree size={14} />
                                  </Button>
                                </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditWorkItem(item); }}>
                                  <PencilSimple size={14} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {CURRENT_WORK_COLUMNS.filter(col => col.id !== column.id).map((col) => (
                                  <DropdownMenuItem 
                                    key={col.id}
                                    onClick={(e) => { e.stopPropagation(); handleMoveWorkItem(item.id, col.id as WorkItem["status"]); }}
                                  >
                                    <ArrowRight size={14} className="mr-2" />
                                    Move to {col.title}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMoveWorkItem(item.id, "upcoming"); }}>
                                  <ArrowRight size={14} className="mr-2" />
                                  Move to Backlog
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteWorkItem(item.id); }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Task Description */}
                          <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Bottom Row - Priority Badge and Assignee */}
                          <div className="flex items-center gap-2 flex-wrap">
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
                            {item.assignee && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 border-gray-200"
                                variant="outline"
                              >
                                {item.assignee}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>

      <WorkItemSidePanel
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        onSave={handleSaveWorkItem}
        editingItem={editingItem}
        status={targetStatus}
      />

      {/* Day Panel for viewing work items on a specific day */}
      {dayPanelOpen && selectedDay && (
        <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border z-50 overflow-hidden flex flex-col shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">
              Work Items for Day {selectedDay}
            </h2>
            <button
              onClick={() => setDayPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {getCapacityForDay(selectedDay).map((capacity, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-lg p-3 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-foreground">
                        {capacity.item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {capacity.item.assignee || "Unassigned"} • {capacity.item.priority} priority
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit time range"
                        onClick={() => handleEditWorkItemTime(capacity.key)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      <button
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete work item"
                        onClick={() => handleDeleteWorkItemFromCapacity(capacity.key)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {getCapacityForDay(selectedDay).length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>No work items scheduled for this day</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <button 
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
                onClick={() => selectedDay && handleAddWorkItemToDay(selectedDay)}
              >
                Add Work Item to This Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KanbanBoard
