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
    const [interval, setInterval] = useState(existingRecurring?.config?.interval || existingRecurring?.interval || 1)
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existingRecurring?.config?.days || existingRecurring?.days_of_week || [])

    // New state for advanced options
    const [skipWeekends, setSkipWeekends] = useState(existingRecurring?.skip_weekends || false)
    const [monthPosition, setMonthPosition] = useState<"start" | "end" | "specific">(existingRecurring?.month_position || "specific")
    const [dayOfMonth, setDayOfMonth] = useState(existingRecurring?.day_of_month || 1)
    const [endType, setEndType] = useState<"never" | "date" | "count">("never")
    const [endDate, setEndDate] = useState("")
    const [occurrenceCount, setOccurrenceCount] = useState(10)

    // Update state when existingRecurring changes (e.g., after data load)
    // Update state when existingRecurring changes (e.g., after data load)
    useEffect(() => {
        if (open) {
            if (existingRecurring) {
                console.log("Loading recurring settings:", existingRecurring)
                setPattern(existingRecurring.pattern || "daily")
                setInterval(existingRecurring.config?.interval || existingRecurring.interval || 1)
                setDaysOfWeek(existingRecurring.config?.days || existingRecurring.days_of_week || [])
                setSkipWeekends(existingRecurring.skip_weekends || false)
                setMonthPosition(existingRecurring.month_position || "specific")
                setDayOfMonth(existingRecurring.day_of_month || 1)
                setOccurrenceCount(existingRecurring.occurrence_count || 10)

                // Format date for input "YYYY-MM-DD"
                let formattedDate = ""
                if (existingRecurring.end_date) {
                    try {
                        formattedDate = existingRecurring.end_date.split('T')[0]
                        setEndType("date")
                    } catch (e) {
                        formattedDate = existingRecurring.end_date
                        setEndType("date")
                    }
                } else if (existingRecurring.occurrence_count) {
                    setEndType("count")
                } else {
                    setEndType("never")
                }
                setEndDate(formattedDate)
            } else {
                // Reset to defaults if no existing recurring data
                setPattern("daily")
                setInterval(1)
                setDaysOfWeek([])
                setSkipWeekends(false)
                setMonthPosition("specific")
                setDayOfMonth(1)
                setEndType("never")
                setEndDate("")
                setOccurrenceCount(10)
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
            const recurringData: any = {
                page_id: taskId,
                pattern,
                interval,
                days_of_week: pattern === "weekly" ? daysOfWeek : null,
                skip_weekends: skipWeekends,
                month_position: pattern === "monthly" ? monthPosition : null,
                day_of_month: pattern === "monthly" && monthPosition === "specific" ? dayOfMonth : null,
                end_date: endType === "date" ? endDate : null,
                occurrence_count: endType === "count" ? occurrenceCount : null,
            }

            console.log("Saving recurring task with data:", recurringData)

            // First, check if a recurring task already exists for this page
            const { data: existingData } = await supabase
                .from("recurring_tasks")
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

            // Trigger immediate refresh
            if (onSuccess) {
                onSuccess()
            }

            // Force page refresh to show updated recurring info
            window.location.reload()
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

                    {/* Monthly Options */}
                    {pattern === "monthly" && (
                        <div className="space-y-2">
                            <Label>On</Label>
                            <Select value={monthPosition} onValueChange={(val: any) => setMonthPosition(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="start">First day of month</SelectItem>
                                    <SelectItem value="end">Last day of month</SelectItem>
                                    <SelectItem value="specific">Specific day</SelectItem>
                                </SelectContent>
                            </Select>


                            {monthPosition === "specific" && (
                                <div className="space-y-2 mt-4">
                                    <Label>Select day of month</Label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => setDayOfMonth(day)}
                                                className={`
                                                    h-10 w-full rounded-lg border-2 transition-all text-sm font-medium
                                                    ${dayOfMonth === day
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border hover:border-primary/50 hover:bg-accent"}
                                                `}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Selected: Day {dayOfMonth} of each month
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Advanced Options Divider */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3">Advanced Options</h4>
                    </div>

                    {/* Skip Weekends */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="skip-weekends"
                            checked={skipWeekends}
                            onCheckedChange={(checked) => setSkipWeekends(checked as boolean)}
                        />
                        <div className="flex-1">
                            <Label htmlFor="skip-weekends" className="cursor-pointer">
                                Skip weekends
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Move to Monday if falls on Saturday or Sunday
                            </p>
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <Label>Ends</Label>
                        <Select value={endType} onValueChange={(val: any) => setEndType(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="never">Never</SelectItem>
                                <SelectItem value="date">On date</SelectItem>
                                <SelectItem value="count">After occurrences</SelectItem>
                            </SelectContent>
                        </Select>

                        {endType === "date" && (
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-2"
                            />
                        )}

                        {endType === "count" && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-muted-foreground">After</span>
                                <Input
                                    type="number"
                                    min="1"
                                    value={occurrenceCount}
                                    onChange={(e) => setOccurrenceCount(parseInt(e.target.value) || 1)}
                                    className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">occurrences</span>
                            </div>
                        )}
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
        </Dialog >
    )
}
