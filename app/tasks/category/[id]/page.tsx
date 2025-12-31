"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTasks } from "@/hooks/use-tasks"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Table as TableIcon, Calendar as CalendarIcon, Search, Grid, User, CheckCircle2 } from "lucide-react"
import { BottomNav } from "@/components/ui/bottom-nav"
import { TableView } from "@/components/tasks/table-view"
import { CalendarView } from "@/components/tasks/calendar-view"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"
import { TaskDetailModal } from "@/components/tasks/task-detail-modal"
import { GlobalSearch } from "@/components/tasks/global-search"
import { TaskFilters, type FilterOptions } from "@/components/tasks/task-filters"
import { TaskSort, type SortOption } from "@/components/tasks/task-sort"
import { RecurringTaskDialog } from "@/components/tasks/recurring-task-dialog"
import { ReminderDialog } from "@/components/tasks/reminder-dialog"
import { getPropertyValues } from "@/lib/tasks/supabase-categories"
import { getRecurringTask } from "@/lib/tasks/recurring-service"
import { createReminder } from "@/lib/tasks/reminder-service"
import { useAuth } from "@/lib/auth-context"
import { filterTasks, sortTasks } from "@/lib/tasks/filter-sort-utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { Page } from "@/lib/tasks/supabase-categories"

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const { tasks, properties, loading, addTask, editTask, removeTask, updateProperty } = useTasks(id)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [view, setView] = useState<"table" | "calendar">("table")
    const [propertyValues, setPropertyValues] = useState<Record<string, Record<string, any>>>({})
    const [recurringTasks, setRecurringTasks] = useState<Record<string, any>>({})
    const [selectedTask, setSelectedTask] = useState<Page | null>(null)
    const [showTaskDetail, setShowTaskDetail] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showRecurringDialog, setShowRecurringDialog] = useState(false)
    const [showReminderDialog, setShowReminderDialog] = useState(false)
    const [recurringTaskId, setRecurringTaskId] = useState<string>("")
    const [reminderTaskId, setReminderTaskId] = useState<string>("")
    const [reminderDueDate, setReminderDueDate] = useState<string | null>(null)
    const { toast } = useToast()

    // Filters and sorting
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

    // Keyboard shortcut for search (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setShowSearch(true)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    // Fetch property values and recurring status for all tasks
    const fetchAllData = async () => {
        const values: Record<string, Record<string, any>> = {}
        const recurring: Record<string, any> = {}

        for (const task of tasks) {
            // Fetch property values
            const { data } = await getPropertyValues(task.id)
            if (data) {
                const taskValues: Record<string, any> = {}
                data.forEach((pv: any) => {
                    taskValues[pv.property_id] = pv.value
                })
                values[task.id] = taskValues
            }

            // Check if recurring
            const { data: recurringData } = await getRecurringTask(task.id)
            if (recurringData) {
                recurring[task.id] = recurringData
            }
        }

        setPropertyValues(values)
        setRecurringTasks(recurring)
    }

    useEffect(() => {
        if (tasks.length > 0) {
            fetchAllData()
        }

        // Listen for recurring dialog events
        const handleOpenRecurring = (e: any) => {
            setRecurringTaskId(e.detail.taskId)
            setShowRecurringDialog(true)
        }

        // Listen for reminder dialog events
        const handleOpenReminder = (e: any) => {
            setReminderTaskId(e.detail.taskId)
            setReminderDueDate(e.detail.dueDate || null)
            setShowReminderDialog(true)
        }

        window.addEventListener("openRecurring", handleOpenRecurring)
        window.addEventListener("openReminder", handleOpenReminder)

        return () => {
            window.removeEventListener("openRecurring", handleOpenRecurring)
            window.removeEventListener("openReminder", handleOpenReminder)
        }
    }, [tasks])

    const handleDeleteTask = async (id: string) => {
        await removeTask(id)
        toast({
            title: "Success",
            description: "Task deleted successfully",
        })
        setShowTaskDetail(false)
    }
    const handleAddTask = async (
        title: string,
        icon?: string,
        status?: string,
        priority?: string,
        dueDate?: Date,
        reminderOffset?: number
    ) => {
        const result = await addTask(title, icon)

        // Save property values if task was created successfully
        if (result.data && properties.length > 0) {
            const statusProp = properties.find((p) => p.name === "Status")
            const priorityProp = properties.find((p) => p.name === "Priority")
            const dueDateProp = properties.find((p) => p.name === "Due Date")

            // Save status
            if (statusProp && status) {
                await updateProperty(result.data.id, statusProp.id, status)
            }

            // Save priority
            if (priorityProp && priority) {
                await updateProperty(result.data.id, priorityProp.id, priority)
            }

            // Save due date
            let localDateString = ""
            if (dueDateProp && dueDate) {
                // Save ISO string for complete date+time accuracy
                // But for the property (datepicker), we might want just YYYY-MM-DD
                // The current implementation seemed to save YYYY-MM-DD
                // Let's stick to ISO string if it includes time, or verify how property handles it.
                // Reverting to previous logic but using ISO for reminder

                // For Property (Legacy Date Picker comp): YYYY-MM-DD
                // For Reminder: ISO String

                const year = dueDate.getFullYear()
                const month = String(dueDate.getMonth() + 1).padStart(2, '0')
                const day = String(dueDate.getDate()).padStart(2, '0')
                const hours = String(dueDate.getHours()).padStart(2, '0')
                const minutes = String(dueDate.getMinutes()).padStart(2, '0')

                // If time is set (not 00:00 or 23:59 default), maybe include specific format?
                // For now, let's save the ISO string to the property as well if possible, 
                // but if the field is 'date' type, it might expect YYYY-MM-DD.
                // Keeping YYYY-MM-DD for the basic property to be safe with existing filters
                localDateString = `${year}-${month}-${day}`

                // Check if the property type allows full datetime. 
                // If it's just 'date' type in DB, it might truncate. 
                // Assuming it stores string.
                // Let's store YYYY-MM-DDTHH:mm:ss for better precision if supported
                const isoString = dueDate.toISOString()
                await updateProperty(result.data.id, dueDateProp.id, isoString)
            }

            // Create Reminder if offset is provided
            if (reminderOffset !== undefined && dueDate && user) {
                await createReminder(
                    result.data.id,
                    user.id,
                    dueDate.toISOString(),
                    reminderOffset
                )
            }

            toast({
                title: "Success",
                description: "Task created successfully",
            })
        } else if (result.error) {
            toast({
                title: "Error",
                description: "Failed to create task",
                variant: "destructive",
            })
        }

        setShowAddDialog(false)
    }

    const handleTaskClick = (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId)
        if (task) {
            setSelectedTask(task)
            setShowTaskDetail(true)
        }
    }

    // Apply filters and sorting
    const filteredTasks = filterTasks(tasks, filters, propertyValues, properties, recurringTasks)
    const sortedTasks = sortTasks(filteredTasks, sort, propertyValues, properties)

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading tasks...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-8">
            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Header */}
                <header className="mb-8 animate-slide-in">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")} className="mb-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Categories
                    </Button>

                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold gradient-text">Tasks</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {sortedTasks.length} of {tasks.length} tasks
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSearch(true)}
                                className="gap-2 hidden md:flex"
                            >
                                <Search className="h-4 w-4" />
                                Search
                                <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </Button>
                            <Button
                                onClick={() => setShowAddDialog(true)}
                                className="gap-2 gradient-primary text-white border-0 hover:opacity-90"
                            >
                                <Plus className="h-4 w-4" />
                                Add Task
                            </Button>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "calendar")}>
                            <TabsList>
                                <TabsTrigger value="table" className="gap-2">
                                    <TableIcon className="h-4 w-4" />
                                    Table
                                </TabsTrigger>
                                <TabsTrigger value="calendar" className="gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Calendar
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Filters and Sort */}
                        <div className="flex items-center gap-2">
                            <TaskFilters filters={filters} onFilterChange={setFilters} />
                            <TaskSort sort={sort} onSortChange={setSort} />
                        </div>
                    </div>
                </header>

                {/* Views */}
                {view === "table" ? (
                    <TableView
                        tasks={sortedTasks}
                        properties={properties}
                        onEditTask={editTask}
                        onDeleteTask={removeTask}
                        onUpdateProperty={updateProperty}
                    />
                ) : (
                    <CalendarView
                        tasks={sortedTasks}
                        properties={properties}
                        propertyValues={propertyValues}
                        recurringTasks={recurringTasks}
                        onTaskClick={handleTaskClick}
                    />
                )}

                {/* Add Task Dialog */}
                <AddTaskDialog
                    open={showAddDialog}
                    onOpenChange={setShowAddDialog}
                    onAdd={handleAddTask}
                    properties={properties}
                />

                {/* Task Detail Modal */}
                <TaskDetailModal
                    open={showTaskDetail}
                    onOpenChange={setShowTaskDetail}
                    task={selectedTask}
                    onUpdate={editTask}
                />

                {/* Global Search */}
                <GlobalSearch
                    open={showSearch}
                    onOpenChange={setShowSearch}
                    tasks={tasks}
                    properties={properties}
                    propertyValues={propertyValues}
                    onTaskClick={handleTaskClick}
                />

                {/* Recurring Task Dialog */}
                <RecurringTaskDialog
                    open={showRecurringDialog}
                    onOpenChange={setShowRecurringDialog}
                    taskId={recurringTaskId}
                    existingRecurring={recurringTasks[recurringTaskId]}
                    onSuccess={async () => {
                        // Refetch recurring tasks instead of full page reload
                        console.log("Recurring task saved, refetching data...")
                        if (tasks.length > 0) {
                            await fetchAllData()
                        }
                    }}
                />

                {/* Reminder Dialog */}
                <ReminderDialog
                    open={showReminderDialog}
                    onOpenChange={setShowReminderDialog}
                    taskId={reminderTaskId}
                    dueDate={reminderDueDate}
                />

                {/* Bottom Navigation */}
                <BottomNav
                    items={[
                        { icon: Grid, label: 'Home', href: '/tasks' },
                        { icon: CheckCircle2, label: 'Tasks', href: '/tasks/all' },
                        { icon: CalendarIcon, label: 'Calendar', href: '/tasks/calendar' },
                        { icon: User, label: 'Profile', href: '/tasks/profile' },
                    ]}
                />
            </div>
        </div>
    )
}
