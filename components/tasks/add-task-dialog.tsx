"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import {
    CalendarIcon,
    CheckCircle2,
    Target,
    Lightbulb,
    Flame,
    Star,
    Pin,
    Rocket,
    FileText,
    Zap,
    Heart,
    Trophy,
    Flag,
    Bookmark,
    Clock,
    Mail,
    type LucideIcon,
    Bell
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TimePicker } from "@/components/ui/time-picker"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (title: string, icon?: string, status?: string, priority?: string, dueDate?: Date, reminderOffset?: number) => void
    properties: any[]
}

type IconOption = {
    name: string
    icon: LucideIcon
}

const iconOptions: IconOption[] = [
    { name: "FileText", icon: FileText },
    { name: "CheckCircle2", icon: CheckCircle2 },
    { name: "Target", icon: Target },
    { name: "Lightbulb", icon: Lightbulb },
    { name: "Flame", icon: Flame },
    { name: "Star", icon: Star },
    { name: "Pin", icon: Pin },
    { name: "Rocket", icon: Rocket },
    { name: "Zap", icon: Zap },
    { name: "Heart", icon: Heart },
    { name: "Trophy", icon: Trophy },
    { name: "Flag", icon: Flag },
    { name: "Bookmark", icon: Bookmark },
    { name: "Clock", icon: Clock },
    { name: "Mail", icon: Mail },
]

export function AddTaskDialog({ open, onOpenChange, onAdd, properties }: Props) {
    const [title, setTitle] = useState("")
    const [selectedIcon, setSelectedIcon] = useState("")
    const [status, setStatus] = useState("Not Started")
    const [priority, setPriority] = useState("Medium")
    const [dueDate, setDueDate] = useState<Date>()
    const [time, setTime] = useState("")
    const [enableReminder, setEnableReminder] = useState(false)
    const [reminderOffset, setReminderOffset] = useState("0") // 0 means at time of event

    const statusProp = properties.find((p) => p.name === "Status")
    const priorityProp = properties.find((p) => p.name === "Priority")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (title.trim()) {
            let finalDate = dueDate

            // If date and time are set, combine them
            if (dueDate && time) {
                const [hours, minutes] = time.split(':').map(Number)
                finalDate = new Date(dueDate)
                finalDate.setHours(hours, minutes)
            } else if (dueDate) {
                // Default to end of day if only date
                finalDate = new Date(dueDate)
                finalDate.setHours(23, 59)
            }

            const offset = enableReminder ? parseInt(reminderOffset) : undefined

            onAdd(
                title,
                selectedIcon || undefined,
                status,
                priority,
                finalDate,
                offset
            )

            // Reset form
            setTitle("")
            setSelectedIcon("")
            setStatus("Not Started")
            setPriority("Medium")
            setDueDate(undefined)
            setTime("")
            setEnableReminder(false)
            setReminderOffset("0")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl gradient-text">Add Task</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Task Title - Always Visible */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            required
                            autoFocus
                            className="text-base"
                        />
                    </div>

                    <Accordion type="single" collapsible defaultValue="details" className="w-full">
                        {/* Details Section */}
                        <AccordionItem value="details">
                            <AccordionTrigger>Task Details</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                {/* Icon Selection */}
                                <div className="space-y-2">
                                    <Label>Icon (optional)</Label>
                                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedIcon("")}
                                            className={cn(
                                                "p-3 rounded-lg border-2 transition-all text-xs font-medium",
                                                !selectedIcon
                                                    ? "border-primary bg-primary/10 scale-105"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            None
                                        </button>
                                        {iconOptions.map((option) => {
                                            const Icon = option.icon
                                            return (
                                                <button
                                                    key={option.name}
                                                    type="button"
                                                    onClick={() => setSelectedIcon(option.name)}
                                                    className={cn(
                                                        "p-3 rounded-lg border-2 transition-all hover:scale-110",
                                                        selectedIcon === option.name
                                                            ? "border-primary bg-primary/10 scale-110"
                                                            : "border-border hover:border-primary/50"
                                                    )}
                                                    title={option.name}
                                                >
                                                    <Icon className="h-5 w-5 mx-auto" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Status */}
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger id="status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusProp?.config?.options?.map((option: string) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                )) || (
                                                        <>
                                                            <SelectItem value="Not Started">Not Started</SelectItem>
                                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                                            <SelectItem value="On Hold">On Hold</SelectItem>
                                                            <SelectItem value="Completed">Completed</SelectItem>
                                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                        </>
                                                    )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger id="priority">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorityProp?.config?.options?.map((option: string) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                )) || (
                                                        <>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="High">High</SelectItem>
                                                            <SelectItem value="Urgent">Urgent</SelectItem>
                                                        </>
                                                    )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Schedule Section */}
                        <AccordionItem value="schedule">
                            <AccordionTrigger>Schedule & Reminders</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                {/* Due Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !dueDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dueDate ? format(dueDate, "PPP") : "Pick date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={dueDate}
                                                    onSelect={setDueDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time (optional)</Label>
                                        <TimePicker
                                            value={time}
                                            onTimeChange={setTime}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="border rounded-lg p-3 space-y-3 bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="reminder-toggle" className="cursor-pointer">Enable Notification</Label>
                                        </div>
                                        <Switch
                                            id="reminder-toggle"
                                            checked={enableReminder}
                                            onCheckedChange={setEnableReminder}
                                            disabled={!dueDate} // Need at least a date
                                        />
                                    </div>

                                    {enableReminder && (
                                        <div className="pt-2 animate-in slide-in-from-top-2 fade-in">
                                            <Label className="text-xs text-muted-foreground mb-1.5 block">Remind me</Label>
                                            <Select value={reminderOffset} onValueChange={setReminderOffset}>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">At time of event</SelectItem>
                                                    <SelectItem value="10">10 minutes before</SelectItem>
                                                    <SelectItem value="30">30 minutes before</SelectItem>
                                                    <SelectItem value="60">1 hour before</SelectItem>
                                                    <SelectItem value="1440">1 day before</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {!time && enableReminder && (
                                                <p className="text-[10px] text-yellow-600 mt-2 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Defaulting to end of day since no time set
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 gradient-primary text-white border-0 hover:opacity-90"
                            disabled={!title.trim()}
                        >
                            Add Task
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
