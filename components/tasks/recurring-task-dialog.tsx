"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { createRecurringTask, updateRecurringTask } from "@/lib/tasks/recurring-service"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    taskId: string
    existingRecurring?: any
    onSuccess?: () => void
}

export function RecurringTaskDialog({ open, onOpenChange, taskId, existingRecurring, onSuccess }: Props) {
    const { toast } = useToast()
    const [pattern, setPattern] = useState(existingRecurring?.pattern || "daily")
    const [interval, setInterval] = useState(existingRecurring?.interval || 1)
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existingRecurring?.days_of_week || [])
    const [endDate, setEndDate] = useState(existingRecurring?.end_date || "")

    // Update state when existingRecurring changes (e.g., after data load)
    // Update state when existingRecurring changes (e.g., after data load)
    useEffect(() => {
        if (open) {
            if (existingRecurring) {
                console.log("Loading recurring settings:", existingRecurring)
                setPattern(existingRecurring.pattern || "daily")
                setInterval(existingRecurring.interval || 1)
                setDaysOfWeek(existingRecurring.days_of_week || [])

                // Format date for input "YYYY-MM-DD"
                // Handle cases where it might be full ISO string
                let formattedDate = ""
                if (existingRecurring.end_date) {
                    try {
                        formattedDate = existingRecurring.end_date.split('T')[0]
                    } catch (e) {
                        formattedDate = existingRecurring.end_date
                    }
                }
                setEndDate(formattedDate)
            } else {
                // Reset to defaults if no existing recurring data
                setPattern("daily")
                setInterval(1)
                setDaysOfWeek([])
                setEndDate("")
            }
        }
    }, [open, existingRecurring])

    const weekDays = [
        { label: "Sun", value: 0 },
        { label: "Mon", value: 1 },
        { label: "Tue", value: 2 },
        { label: "Wed", value: 3 },
        { label: "Thu", value: 4 },
        { label: "Fri", value: 5 },
        { label: "Sat", value: 6 },
    ]

    const handleSave = async () => {
        try {
            const recurringData = {
                page_id: taskId,
                pattern,
                interval,
                days_of_week: pattern === "weekly" ? daysOfWeek : null,
                end_date: endDate || null,
            }

            console.log("Saving recurring task with data:", recurringData)

            // First, check if a recurring task already exists for this page
            const { data: existingData } = await supabase
                .from("task_recurring")
                .select("*")
                .eq("page_id", taskId)
                .maybeSingle()

            let result
            if (existingData) {
                // Update existing recurring task
                console.log("Updating existing recurring task:", existingData.id)
                result = await updateRecurringTask(existingData.id, recurringData)
            } else {
                // Create new recurring task
                console.log("Creating new recurring task")
                result = await createRecurringTask(recurringData)
            }

            console.log("Result:", result)

            if (result.error) {
                console.error("Error saving recurring task:", result.error)
                toast({
                    title: "Error",
                    description: result.error.message || "Failed to save recurring task",
                    variant: "destructive",
                })
                return
            }

            toast({
                title: "Success",
                description: existingData ? "Recurring task updated successfully" : "Recurring task created successfully",
            })

            onOpenChange(false)

            // Trigger refresh
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess()
                }, 500) // Small delay to ensure toast shows
            }
        } catch (error: any) {
            console.error("Exception saving recurring task:", error)
            toast({
                title: "Error",
                description: error?.message || "Failed to save recurring task",
                variant: "destructive",
            })
        }
    }

    const toggleDay = (day: number) => {
        setDaysOfWeek(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl gradient-text">Set Recurring Task</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Pattern */}
                    <div className="space-y-2">
                        <Label>Repeat Pattern</Label>
                        <Select value={pattern} onValueChange={setPattern}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Interval */}
                    {(pattern === "daily" || pattern === "weekly" || pattern === "monthly") && (
                        <div className="space-y-2">
                            <Label>Every</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    value={interval}
                                    onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                                    className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">
                                    {pattern === "daily" && "day(s)"}
                                    {pattern === "weekly" && "week(s)"}
                                    {pattern === "monthly" && "month(s)"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Days of Week */}
                    {pattern === "weekly" && (
                        <div className="space-y-2">
                            <Label>Repeat On</Label>
                            <div className="flex gap-2">
                                {weekDays.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`
                                            px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium
                                            ${daysOfWeek.includes(day.value)
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"}
                                        `}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* End Date */}
                    <div className="space-y-2">
                        <Label>End Date (optional)</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="gradient-primary text-white border-0 hover:opacity-90"
                    >
                        Save Recurring
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
