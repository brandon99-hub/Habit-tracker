"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type FilterOptions = {
    status: string[]
    priority: string[]
    dueDate: "all" | "today" | "week" | "overdue" | "no-date"
    recurring: "all" | "recurring" | "one-time"
}

type Props = {
    filters: FilterOptions
    onFilterChange: (filters: FilterOptions) => void
}

const STATUS_OPTIONS = ["Not Started", "In Progress", "On Hold", "Completed", "Cancelled"]
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"]

export function TaskFilters({ filters, onFilterChange }: Props) {
    const [open, setOpen] = useState(false)

    const activeFilterCount =
        filters.status.length +
        filters.priority.length +
        (filters.dueDate !== "all" ? 1 : 0) +
        (filters.recurring !== "all" ? 1 : 0)

    const toggleStatus = (status: string) => {
        const newStatus = filters.status.includes(status)
            ? filters.status.filter((s) => s !== status)
            : [...filters.status, status]
        onFilterChange({ ...filters, status: newStatus })
    }

    const togglePriority = (priority: string) => {
        const newPriority = filters.priority.includes(priority)
            ? filters.priority.filter((p) => p !== priority)
            : [...filters.priority, priority]
        onFilterChange({ ...filters, priority: newPriority })
    }

    const clearFilters = () => {
        onFilterChange({
            status: [],
            priority: [],
            dueDate: "all",
            recurring: "all",
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Filters</h4>
                        {activeFilterCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                                Clear all
                            </Button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label className="text-xs">Status</Label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => toggleStatus(status)}
                                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${filters.status.includes(status)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background border-border hover:bg-muted"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-2">
                        <Label className="text-xs">Priority</Label>
                        <div className="flex flex-wrap gap-2">
                            {PRIORITY_OPTIONS.map((priority) => (
                                <button
                                    key={priority}
                                    onClick={() => togglePriority(priority)}
                                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${filters.priority.includes(priority)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background border-border hover:bg-muted"
                                        }`}
                                >
                                    {priority}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Due Date Filter */}
                    <div className="space-y-2">
                        <Label className="text-xs">Due Date</Label>
                        <Select
                            value={filters.dueDate}
                            onValueChange={(value: any) => onFilterChange({ ...filters, dueDate: value })}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="today">Due Today</SelectItem>
                                <SelectItem value="week">Due This Week</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="no-date">No Due Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Recurring Filter */}
                    <div className="space-y-2">
                        <Label className="text-xs">Type</Label>
                        <Select
                            value={filters.recurring}
                            onValueChange={(value: any) => onFilterChange({ ...filters, recurring: value })}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tasks</SelectItem>
                                <SelectItem value="recurring">Recurring Only</SelectItem>
                                <SelectItem value="one-time">One-time Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
