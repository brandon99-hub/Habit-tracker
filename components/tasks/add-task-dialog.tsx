"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
    type LucideIcon
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (title: string, icon?: string, status?: string, priority?: string, dueDate?: Date) => void
    properties: any[]
    onUpdateProperty?: (taskId: string, propertyId: string, value: any) => void
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

    const statusProp = properties.find((p) => p.name === "Status")
    const priorityProp = properties.find((p) => p.name === "Priority")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (title.trim()) {
            onAdd(title, selectedIcon || undefined, status, priority, dueDate)
            // Reset form
            setTitle("")
            setSelectedIcon("")
            setStatus("Not Started")
            setPriority("Medium")
            setDueDate(undefined)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl gradient-text">Add Task</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Task Title */}
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

                    {/* Icon Selection */}
                    <div className="space-y-2">
                        <Label>Icon (optional)</Label>
                        <div className="grid grid-cols-8 gap-2">
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

                    {/* Due Date */}
                    <div className="space-y-2">
                        <Label>Due Date (optional)</Label>
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
                                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
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

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
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
