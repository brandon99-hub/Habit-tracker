"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AddHabitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (
    name: string,
    type: "binary" | "numeric",
    unit?: string,
    category?: string,
    scheduledDays?: number[],
    scheduledTime?: string,
  ) => void
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

export function AddHabitDialog({ open, onOpenChange, onAdd }: AddHabitDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"binary" | "numeric">("binary")
  const [unit, setUnit] = useState("")
  const [category, setCategory] = useState<string>("")
  const [scheduledDays, setScheduledDays] = useState<number[]>([])
  const [scheduledTime, setScheduledTime] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(
        name,
        type,
        type === "numeric" ? unit : undefined,
        category || undefined,
        scheduledDays.length > 0 ? scheduledDays : undefined,
        scheduledTime || undefined,
      )
      setName("")
      setType("binary")
      setUnit("")
      setCategory("")
      setScheduledDays([])
      setScheduledTime("")
    }
  }

  const toggleDay = (day: number) => {
    setScheduledDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Habit Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Run"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "binary" ? "default" : "outline"}
                onClick={() => setType("binary")}
                className="h-11 flex-1"
              >
                Done/Not Done
              </Button>
              <Button
                type="button"
                variant={type === "numeric" ? "default" : "outline"}
                onClick={() => setType("numeric")}
                className="h-11 flex-1"
              >
                Track Value
              </Button>
            </div>
          </div>

          {type === "numeric" && (
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium">
                Unit
              </Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., pages, min, reps"
                className="h-11"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Physical">Physical</SelectItem>
                <SelectItem value="Mental">Mental</SelectItem>
                <SelectItem value="Creative">Creative</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <Label className="text-sm font-medium">
              Schedule <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Repeat on:</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`h-9 rounded-lg border px-3 text-sm font-medium transition-all ${scheduledDays.includes(day.value)
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {scheduledDays.length === 0 && <p className="text-xs text-muted-foreground">Daily by default</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs text-muted-foreground">
                Preferred time (optional):
              </Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-11"
                  placeholder="Not set"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="h-11 w-full text-base font-medium">
            Add Habit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
