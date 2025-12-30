"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type EditHabitDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    habit: {
        id: string
        name: string
        type: "binary" | "numeric"
        unit?: string
        category?: string
        scheduledDays?: number[]
        scheduledTime?: string
    }
    onSave: (
        habitId: string,
        name: string,
        type: "binary" | "numeric",
        unit?: string,
        category?: string,
        scheduledDays?: number[],
        scheduledTime?: string
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

export function EditHabitDialog({ open, onOpenChange, habit, onSave }: EditHabitDialogProps) {
    const [name, setName] = useState(habit.name)
    const [type, setType] = useState<"binary" | "numeric">(habit.type)
    const [unit, setUnit] = useState(habit.unit || "")
    const [category, setCategory] = useState<string>(habit.category || "")
    const [scheduledDays, setScheduledDays] = useState<number[]>(habit.scheduledDays || [])
    const [scheduledTime, setScheduledTime] = useState<string>(habit.scheduledTime || "")
    const [showTypeWarning, setShowTypeWarning] = useState(false)

    // Reset form when habit changes
    useEffect(() => {
        setName(habit.name)
        setType(habit.type)
        setUnit(habit.unit || "")
        setCategory(habit.category || "")
        setScheduledDays(habit.scheduledDays || [])
        setScheduledTime(habit.scheduledTime || "")
        setShowTypeWarning(false)
    }, [habit])

    const handleTypeChange = (newType: "binary" | "numeric") => {
        if (newType !== habit.type) {
            setShowTypeWarning(true)
        } else {
            setShowTypeWarning(false)
        }
        setType(newType)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onSave(
                habit.id,
                name,
                type,
                type === "numeric" ? unit : undefined,
                category || undefined,
                scheduledDays.length > 0 ? scheduledDays : undefined,
                scheduledTime || undefined
            )
            onOpenChange(false)
        }
    }

    const toggleDay = (day: number) => {
        setScheduledDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Edit Habit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-sm font-medium">
                            Habit Name
                        </Label>
                        <Input
                            id="edit-name"
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
                                onClick={() => handleTypeChange("binary")}
                                className="h-11 flex-1"
                            >
                                Done/Not Done
                            </Button>
                            <Button
                                type="button"
                                variant={type === "numeric" ? "default" : "outline"}
                                onClick={() => handleTypeChange("numeric")}
                                className="h-11 flex-1"
                            >
                                Track Value
                            </Button>
                        </div>
                    </div>

                    {showTypeWarning && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Changing the habit type will affect how your existing data is displayed. Numeric values will be lost if
                                switching to binary.
                            </AlertDescription>
                        </Alert>
                    )}

                    {type === "numeric" && (
                        <div className="space-y-2">
                            <Label htmlFor="edit-unit" className="text-sm font-medium">
                                Unit
                            </Label>
                            <Input
                                id="edit-unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="e.g., pages, min, reps"
                                className="h-11"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="edit-category" className="text-sm font-medium">
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
                            <Label htmlFor="edit-time" className="text-xs text-muted-foreground">
                                Preferred time (optional):
                            </Label>
                            <div className="relative">
                                <Input
                                    id="edit-time"
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="h-11"
                                    placeholder="Not set"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="h-11 flex-1 text-base font-medium">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
