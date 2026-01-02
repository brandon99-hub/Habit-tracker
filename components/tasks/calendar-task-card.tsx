"use client"

import { Card } from "@/components/ui/card"
import { TaskIcon } from "./task-icon"
import { Clock, Calendar, Repeat } from "lucide-react"
import { format, parseISO } from "date-fns"
import { SwipeableTaskCard } from "./swipeable-task-card"
import type { Page, Property } from "@/lib/tasks/supabase-categories"

interface CalendarTaskCardProps {
    task: Page
    properties: Property[]
    propertyValues: Record<string, any>
    categoryName?: string
    categoryIcon?: string
    isRecurring?: boolean
    onSwipeLeft?: (taskId: string) => void
    onSwipeRight?: (taskId: string) => void
    onClick: () => void
}

export function CalendarTaskCard({
    task,
    properties,
    propertyValues,
    categoryName,
    categoryIcon,
    isRecurring = false,
    onSwipeLeft,
    onSwipeRight,
    onClick,
}: CalendarTaskCardProps) {
    // Find properties FOR THIS TASK'S CATEGORY
    const statusProp = properties.find((p) =>
        p.name === "Status" && p.category_id === task.category_id
    )
    const priorityProp = properties.find((p) =>
        p.name === "Priority" && p.category_id === task.category_id
    )
    const dueDateProp = properties.find((p) =>
        p.name === "Due Date" && p.category_id === task.category_id
    )

    const status = statusProp ? (propertyValues[statusProp.id] || "Not Started") : "Not Started"
    const priority = priorityProp ? (propertyValues[priorityProp.id] || "Medium") : "Medium"
    const dueDate = dueDateProp ? propertyValues[dueDateProp.id] : null

    const isOverdue = dueDate && status !== "Completed" && new Date(dueDate) < new Date()

    const priorityColors = {
        Urgent: "text-red-500",
        High: "text-orange-500",
        Medium: "text-yellow-500",
        Low: "text-green-500",
    }

    const statusColors = {
        "Completed": "text-green-500",
        "In Progress": "text-blue-500",
        "Not Started": "text-muted-foreground",
    }

    const cardContent = (
        <div className="flex items-start gap-3">
            {/* Priority Dot */}
            <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${priority === "Urgent" ? "bg-red-500" :
                priority === "High" ? "bg-orange-500" :
                    priority === "Medium" ? "bg-yellow-500" : "bg-green-500"
                }`} />

            {/* Task Icon */}
            <TaskIcon iconName={task.icon} className="text-primary mt-0.5 flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    {isOverdue && (
                        <div
                            className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0 mt-1.5"
                            title="Overdue"
                        />
                    )}
                </div>

                {/* Details Row */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {/* Status Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-accent/50 ${statusColors[status as keyof typeof statusColors] || statusColors["Not Started"]}`}>
                        {status}
                    </span>

                    {/* Priority Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-accent/50 font-medium ${priorityColors[priority as keyof typeof priorityColors] || priorityColors.Medium}`}>
                        {priority}
                    </span>

                    {/* Due Time */}
                    {dueDate && dueDate.includes('T') && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{format(parseISO(dueDate), "h:mm a")}</span>
                        </div>
                    )}

                    {/* Category Badge */}
                    {categoryName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {categoryIcon && <span>{categoryIcon}</span>}
                            <span>{categoryName}</span>
                        </div>
                    )}

                    {/* Recurring Badge */}
                    {isRecurring && (
                        <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                            <Repeat className="h-3 w-3" />
                            <span>Recurring</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    // If swipe handlers provided, use SwipeableTaskCard
    if (onSwipeLeft && onSwipeRight) {
        return (
            <SwipeableTaskCard
                taskId={task.id}
                onSwipeLeft={onSwipeLeft}
                onSwipeRight={onSwipeRight}
                onClick={onClick}
                className="p-4 hover:bg-accent/5 transition-colors"
            >
                {cardContent}
            </SwipeableTaskCard>
        )
    }

    // Otherwise, regular card
    return (
        <Card
            className="p-4 hover:bg-accent/5 transition-colors cursor-pointer"
            onClick={onClick}
        >
            {cardContent}
        </Card>
    )
}
