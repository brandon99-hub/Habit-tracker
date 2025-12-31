import type { Page } from "./supabase-categories"
import type { FilterOptions } from "@/components/tasks/task-filters"
import type { SortOption } from "@/components/tasks/task-sort"
import { parseISO, isToday, isThisWeek, isBefore, startOfDay } from "date-fns"

export function filterTasks(
    tasks: Page[],
    filters: FilterOptions,
    propertyValues: Record<string, Record<string, any>>,
    properties: any[],
    recurringTasks: Record<string, any>
): Page[] {
    return tasks.filter((task) => {
        const taskProps = propertyValues[task.id] || {}

        // Get property IDs
        const statusProp = properties.find((p) => p.name === "Status")
        const priorityProp = properties.find((p) => p.name === "Priority")
        const dueDateProp = properties.find((p) => p.name === "Due Date")

        // Status filter
        if (filters.status.length > 0) {
            const taskStatus = taskProps[statusProp?.id] || "Not Started"
            if (!filters.status.includes(taskStatus)) return false
        }

        // Priority filter
        if (filters.priority.length > 0) {
            const taskPriority = taskProps[priorityProp?.id] || "Medium"
            if (!filters.priority.includes(taskPriority)) return false
        }

        // Due date filter
        if (filters.dueDate !== "all") {
            const dueDate = taskProps[dueDateProp?.id]

            if (filters.dueDate === "no-date") {
                if (dueDate) return false
            } else if (!dueDate) {
                return false
            } else {
                const due = parseISO(dueDate)
                const now = startOfDay(new Date())

                switch (filters.dueDate) {
                    case "today":
                        if (!isToday(due)) return false
                        break
                    case "week":
                        if (!isThisWeek(due, { weekStartsOn: 1 })) return false
                        break
                    case "overdue":
                        if (!isBefore(due, now)) return false
                        break
                }
            }
        }

        // Recurring filter
        if (filters.recurring !== "all") {
            const isRecurring = !!recurringTasks[task.id]
            if (filters.recurring === "recurring" && !isRecurring) return false
            if (filters.recurring === "one-time" && isRecurring) return false
        }

        return true
    })
}

export function sortTasks(
    tasks: Page[],
    sort: SortOption,
    propertyValues: Record<string, Record<string, any>>,
    properties: any[]
): Page[] {
    const sorted = [...tasks]

    const statusProp = properties.find((p) => p.name === "Status")
    const priorityProp = properties.find((p) => p.name === "Priority")
    const dueDateProp = properties.find((p) => p.name === "Due Date")

    const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 }
    const statusOrder = {
        "Not Started": 1,
        "In Progress": 2,
        "On Hold": 3,
        Completed: 4,
        Cancelled: 5,
    }

    sorted.sort((a, b) => {
        let comparison = 0

        switch (sort.field) {
            case "dueDate": {
                const aDate = propertyValues[a.id]?.[dueDateProp?.id]
                const bDate = propertyValues[b.id]?.[dueDateProp?.id]

                if (!aDate && !bDate) comparison = 0
                else if (!aDate) comparison = 1
                else if (!bDate) comparison = -1
                else comparison = new Date(aDate).getTime() - new Date(bDate).getTime()
                break
            }

            case "priority": {
                const aPriority = propertyValues[a.id]?.[priorityProp?.id] || "Medium"
                const bPriority = propertyValues[b.id]?.[priorityProp?.id] || "Medium"
                comparison = (priorityOrder[bPriority as keyof typeof priorityOrder] || 2) -
                    (priorityOrder[aPriority as keyof typeof priorityOrder] || 2)
                break
            }

            case "status": {
                const aStatus = propertyValues[a.id]?.[statusProp?.id] || "Not Started"
                const bStatus = propertyValues[b.id]?.[statusProp?.id] || "Not Started"
                comparison = (statusOrder[aStatus as keyof typeof statusOrder] || 1) -
                    (statusOrder[bStatus as keyof typeof statusOrder] || 1)
                break
            }

            case "title":
                comparison = a.title.localeCompare(b.title)
                break

            case "created":
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                break
        }

        return sort.direction === "asc" ? comparison : -comparison
    })

    return sorted
}
