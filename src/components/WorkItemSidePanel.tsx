import { useState, useEffect } from "react"
import { X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface WorkItem {
  id: string
  title: string
  description: string
  assignee: string
  priority: "low" | "medium" | "high"
  type: "research" | "design" | "prototype" | "testing"
}

interface WorkItemSidePanelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Omit<WorkItem, "id"> | WorkItem) => void
  editingItem?: WorkItem | null
  columnId?: string
}

export default function WorkItemSidePanel({ 
  isOpen, 
  onClose, 
  onSave, 
  editingItem, 
  columnId 
}: WorkItemSidePanelProps) {
  const [formData, setFormData] = useState<{
    title: string
    description: string
    assignee: string
    priority: "low" | "medium" | "high"
    type: "research" | "design" | "prototype" | "testing"
  }>({
    title: "",
    description: "",
    assignee: "",
    priority: "medium",
    type: "design",
  })

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description,
        assignee: editingItem.assignee,
        priority: editingItem.priority,
        type: editingItem.type,
      })
    } else {
      setFormData({
        title: "",
        description: "",
        assignee: "",
        priority: "medium",
        type: "design",
      })
    }
  }, [editingItem, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    if (editingItem) {
      onSave({ ...editingItem, ...formData })
    } else {
      onSave(formData)
    }
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96 sm:w-96">
        <SheetHeader>
          <SheetTitle>
            {editingItem ? "Edit Work Item" : "Create Work Item"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter work item title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Input
              id="assignee"
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              placeholder="Enter assignee name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: "low" | "medium" | "high") => 
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "research" | "design" | "prototype" | "testing") => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="prototype">Prototype</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingItem ? "Update" : "Create"} Work Item
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}