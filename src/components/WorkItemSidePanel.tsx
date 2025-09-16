import { useState, useEffect } from "react"
import { X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface WorkItem {
  id: string
  title: string
  description: string
  assignee: string | string[]
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

interface WorkItemSidePanelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Omit<WorkItem, "id">) => void
  editingItem?: WorkItem | null
  status?: WorkItem["status"]
}

export default function WorkItemSidePanel({ 
  isOpen, 
  onClose, 
  onSave, 
  editingItem, 
  status 
}: WorkItemSidePanelProps) {
  const [formData, setFormData] = useState<{
    title: string
    description: string
    assignee: string | string[]
    priority: "low" | "medium" | "high"
    type: "research" | "design" | "prototype" | "testing"
    status: "new" | "in-progress" | "done" | "upcoming" | "potential" | "other"
    specLink: string
    pmOwner: string
    dueDate: string
    devDate: string
    quarter: "Q1" | "Q2" | "Q3" | "Q4" | ""
    size: "S" | "M" | "L" | "XL" | ""
  }>({
    title: "",
    description: "",
    assignee: "",
    priority: "medium",
    type: "design",
    status: "other",
    specLink: "",
    pmOwner: "",
    dueDate: "",
    devDate: "",
    quarter: "",
    size: "",
  })

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description,
        assignee: Array.isArray(editingItem.assignee) ? editingItem.assignee.join(", ") : editingItem.assignee,
        priority: editingItem.priority,
        type: editingItem.type,
        status: editingItem.status,
        specLink: editingItem.specLink || "",
        pmOwner: editingItem.pmOwner || "",
        dueDate: editingItem.dueDate || "",
        devDate: editingItem.devDate || "",
        quarter: editingItem.quarter || "",
        size: editingItem.size || "",
      })
    } else {
      setFormData({
        title: "",
        description: "",
        assignee: "",
        priority: "medium",
        type: "design",
        status: status || "other",
        specLink: "",
        pmOwner: "",
        dueDate: "",
        devDate: "",
        quarter: "",
        size: "",
      })
    }
  }, [editingItem, isOpen, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    if (!formData.description.trim()) return
    if (!formData.pmOwner.trim()) return

    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...formData,
      quarter: formData.quarter || undefined,
      size: formData.size || undefined,
    }

    if (editingItem) {
      onSave({ ...editingItem, ...cleanedData })
    } else {
      onSave(cleanedData)
    }
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[500px] p-0 overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-left">
            {editingItem ? "Edit Work Item" : "Create Work Item"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specLink">Spec Link</Label>
            <Input
              id="specLink"
              value={formData.specLink}
              onChange={(e) => setFormData({ ...formData, specLink: e.target.value })}
              placeholder="Enter specification link"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pmOwner">PM Owner *</Label>
            <Input
              id="pmOwner"
              value={formData.pmOwner}
              onChange={(e) => setFormData({ ...formData, pmOwner: e.target.value })}
              placeholder="Enter PM owner name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="devDate">Estimated Dev Start Date</Label>
            <Input
              id="devDate"
              value={formData.devDate}
              onChange={(e) => setFormData({ ...formData, devDate: e.target.value })}
              type="date"
            />
          </div>

          {/* UX Team Only Accordion */}
          <Accordion type="single" collapsible className="border rounded-lg">
            <AccordionItem value="ux-team" className="border-0">
              <AccordionTrigger className="px-4 py-3 text-sm font-medium text-purple-700 hover:text-purple-800">
                For UX Team Only
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={Array.isArray(formData.assignee) ? formData.assignee.join(", ") : formData.assignee}
                    onValueChange={(value: string) => 
                      setFormData({ ...formData, assignee: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                      <SelectItem value="Maggie">Maggie</SelectItem>
                      <SelectItem value="Lenny">Lenny</SelectItem>
                      <SelectItem value="Maggie, Lenny">Maggie & Lenny</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    type="date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <Select
                    value={formData.quarter || undefined}
                    onValueChange={(value: string) => 
                      setFormData({ ...formData, quarter: value === "unset" ? "" : value as "Q1" | "Q2" | "Q3" | "Q4" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Not assigned</SelectItem>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Work Item Size</Label>
                  <Select
                    value={formData.size || undefined}
                    onValueChange={(value: string) => 
                      setFormData({ ...formData, size: value === "unset" ? "" : value as "S" | "M" | "L" | "XL" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Not assigned</SelectItem>
                      <SelectItem value="S">Small (S)</SelectItem>
                      <SelectItem value="M">Medium (M)</SelectItem>
                      <SelectItem value="L">Large (L)</SelectItem>
                      <SelectItem value="XL">Extra Large (XL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-3 pt-6">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
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