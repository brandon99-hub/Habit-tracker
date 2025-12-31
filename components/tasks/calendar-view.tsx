"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Page, Property } from "@/lib/tasks/supabase-categories"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO, isSameDay, addMonths, subMonths } from "date-fns"
import { TaskIcon } from "./task-icon"
import { TaskFilters, type FilterOptions } from "./task-filters"
import { TaskSort, type SortOption } from "./task-sort"
import { filterTasks, sortTasks } from "@/lib/tasks/filter-sort-utils"
import { shouldShowRecurringTask } from "@/lib/tasks/recurring-utils"

type Props = {
    tasks: Page[]
    properties: Property[]
    propertyValues: Record<string, Record<string, any>>
    recurringTasks: Record<string, any>
    onTaskClick: (taskId: string) => void
}

export function CalendarView({ tasks, properties, propertyValues, recurringTasks, onTaskClick }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [filters, setFilters] = useState<FilterOptions>({
        status: [],
        priority: [],
        dueDate: "all",
        recurring: "all",
    })
    const [sort, setSort] = useState<SortOption>({
        field: "dueDate",
        direction: "asc",
    })

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get due date property
    const dueDateProp = properties.find((p) => p.name === "Due Date")

    // Helper to get all tasks for a date (including recurring)
    const getTasksForDate = (date: Date) => {
        if (!dueDateProp) return []

        const tasksOnDate: Page[] = []

        tasks.forEach((task) => {
            const dueDate = propertyValues[task.id]?.[dueDateProp.id]
            const recurring = recurringTasks[task.id]

            if (dueDate && isSameDay(parseISO(dueDate), date)) {
                tasksOnDate.push(task)
            } else if (recurring) {
                // Check if this date matches the recurring pattern
                if (shouldShowRecurringTask(date, dueDate, recurring)) {
                    tasksOnDate.push(task)
                }
            }
        })

        return tasksOnDate
    }

    // Get tasks for selected date
    const tasksForSelectedDate = getTasksForDate(selectedDate)

    // Apply filters and sorting to selected date's tasks
    const filteredTasks = filterTasks(tasksForSelectedDate, filters, propertyValues, properties, recurringTasks)
    const sortedTasks = sortTasks(filteredTasks, sort, propertyValues, properties)

    // Check if a date has tasks
    const dateHasTasks = (date: Date) => {
        return getTasksForDate(date).length > 0
    }

    const handleToday = () => {
        const today = new Date()
        setCurrentMonth(today)
        setSelectedDate(today)
    }

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToday}
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                    {days.map((day) => {
                        const isSelected = isSameDay(day, selectedDate)
                        const isCurrentDay = isToday(day)
                        const hasTasks = dateHasTasks(day)

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    aspect-square p-2 rounded-lg border text-center transition-all
                                    hover:bg-accent hover:scale-105
                                    ${isSelected ? 'border-primary bg-primary/10 scale-105' : 'border-border'}
                                    ${isCurrentDay ? 'font-bold' : ''}
                                `}
                            >
                                <div className="text-sm">
                                    {format(day, 'd')}
                                </div>
                                {hasTasks && (
                                    <div className="w-1 h-1 rounded-full bg-primary mx-auto mt-1" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </Card>

            {/* Selected Date Tasks */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                        Tasks for {format(selectedDate, "MMMM d, yyyy")}
                    </h3>
                    <div className="flex items-center gap-2">
                        <TaskFilters filters={filters} onFilterChange={setFilters} />
                        <TaskSort sort={sort} onSortChange={setSort} />
                    </div>
                </div>

                {sortedTasks.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-muted-foreground">
                            No tasks for this date
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {sortedTasks.map((task) => {
                            const statusProp = properties.find((p) => p.name === "Status")
                            const priorityProp = properties.find((p) => p.name === "Priority")
                            const status = statusProp ? (propertyValues[task.id]?.[statusProp.id] || "Not Started") : "Not Started"
                            const priority = priorityProp ? (propertyValues[task.id]?.[priorityProp.id] || "Medium") : "Medium"

                            const priorityColors = {
                                Urgent: "bg-red-500",
                                High: "bg-orange-500",
                                Medium: "bg-yellow-500",
                                Low: "bg-green-500",
                            }

                            return (
                                <Card
                                    key={task.id}
                                    className="p-4 hover-lift cursor-pointer"
                                    onClick={() => onTaskClick(task.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`h-2 w-2 rounded-full mt-2 ${priorityColors[priority as keyof typeof priorityColors] || priorityColors.Medium}`} />
                                        <TaskIcon iconName={task.icon} className="text-primary mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate">{task.title}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span>Status: {status}</span>
                                                <span>•</span>
                                                <span>Priority: {priority}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
