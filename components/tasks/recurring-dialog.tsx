"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Repeat, Trash2 } from "lucide-react"
import {
  createRecurringTask,
  getRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  type RecurringTask,
} from "@/lib/tasks/recurring-service"
import { useToast } from "@/hooks/use-toast"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
}

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]

export function RecurringDialog({ open, onOpenChange, taskId }: Props) {
  const { toast } = useToast()
  const [recurring, setRecurring] = useState<RecurringTask | null>(null)
  const [pattern, setPattern] = useState<"daily" | "weekdays" | "weekly" | "custom">("daily")
  const [time, setTime] = useState("09:00")
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Weekdays default
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && taskId) {
      fetchRecurring()
    }
  }, [open, taskId])

  const fetchRecurring = async () => {
    const { data } = await getRecurringTask(taskId)
    if (data) {
      setRecurring(data)
      setPattern(data.pattern)
      setTime(data.config.time || "09:00")
      setSelectedDays(data.config.days || [1, 2, 3, 4, 5])
    }
  }

  const handleSave = async () => {
    setLoading(true)

    const config = {
      time,
      days: pattern === "custom" ? selectedDays : undefined,
    }

    let error
    if (recurring) {
      const result = await updateRecurringTask(recurring.id, {
        pattern,
        days_of_week: pattern === "custom" ? selectedDays : undefined,
      })
      error = result.error
    } else {
      const result = await createRecurringTask({
        page_id: taskId,
        pattern,
        days_of_week: pattern === "custom" ? selectedDays : undefined,
      })
      error = result.error
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save recurring task",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Recurring task saved",
      })
      onOpenChange(false)
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!recurring) return

    setLoading(true)
    const { error } = await deleteRecurringTask(recurring.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Recurring task removed",
      })
      setRecurring(null)
      onOpenChange(false)
    }

    setLoading(false)
  }

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day))
    } else {
      setSelectedDays([...selectedDays, day].sort())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recurring Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pattern Selection */}
          <div>
            <Label>Repeat Pattern</Label>
            <Select value={pattern} onValueChange={(v: any) => setPattern(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Days Selection */}
          {pattern === "custom" && (
            <div>
              <Label>Select Days</Label>
              <div className="flex gap-2 mt-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${selectedDays.includes(day.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                      }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Selection */}
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Info */}
          {recurring && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Next occurrence: {new Date(recurring.next_occurrence).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {recurring && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Recurrence
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
