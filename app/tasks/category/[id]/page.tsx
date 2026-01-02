"use client"

import { use, useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTasks } from "@/hooks/use-tasks"
import { useCategories } from "@/hooks/use-categories"
import { useCache } from "@/lib/cache-context"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Table as TableIcon, Calendar as CalendarIcon, Search, Grid, User, CheckCircle2, MoreVertical, Edit2, Trash2, X } from "lucide-react"
import { BottomNav } from "@/components/ui/bottom-nav"
import { TableView } from "@/components/tasks/table-view"
import { CalendarView } from "@/components/tasks/calendar-view"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"
import { TaskDetailModal } from "@/components/tasks/task-detail-modal"
import { Input } from "@/components/ui/input"
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
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { cn } from "@/lib/utils"
import type { Page } from "@/lib/tasks/supabase-categories"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const cache = useCache()
    const { tasks, properties, loading: tasksLoading, addTask, editTask, removeTask, updateProperty } = useTasks(id)
    const { categories, loading: categoriesLoading, removeCategory } = useCategories()
    const category = useMemo(() => categories.find(c => c.id === id), [categories, id])
    const loading = tasksLoading || categoriesLoading
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [view, setView] = useState<"table" | "calendar">("table")
    const [propertyValues, setPropertyValues] = useState<Record<string, Record<string, any>>>({})
    const [recurringTasks, setRecurringTasks] = useState<Record<string, any>>({})
    const [selectedTask, setSelectedTask] = useState<Page | null>(null)
    const [showTaskDetail, setShowTaskDetail] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
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
                if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                    e.preventDefault()
                    setIsSearchOpen(true)
                    // Focus will be handled by autoFocus on input
                }
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    // Fetch property values and recurring status for all tasks
    const fetchAllData = async () => {
        const cacheKey = `category-${id}-data`

        // Check cache first
        const cached = cache.get<{
            propertyValues: Record<string, Record<string, any>>
            recurringTasks: Record<string, any>
        }>(cacheKey)

        if (cached) {
            setPropertyValues(cached.propertyValues)
            setRecurringTasks(cached.recurringTasks)
            return
        }

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

        // Cache the data
        cache.set(cacheKey, {
            propertyValues: values,
            recurringTasks: recurring
        })
    }

    // Wrapper for updateProperty that also updates local state
    const handleUpdateProperty = async (pageId: string, propertyId: string, value: any) => {
        const result = await updateProperty(pageId, propertyId, value)

        // Update local state immediately for instant UI feedback
        if (!result.error) {
            setPropertyValues(prev => ({
                ...prev,
                [pageId]: {
                    ...(prev[pageId] || {}),
                    [propertyId]: value
                }
            }))

            // Invalidate cache for real-time updates
            cache.invalidate(`category-${id}-data`)
            cache.invalidate('all-tasks-data')
            cache.invalidate('home-stats')
        }

        return result
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

    // Apply search query filter
    const searchedTasks = useMemo(() => {
        if (!searchQuery.trim()) return filteredTasks
        const query = searchQuery.toLowerCase()
        return filteredTasks.filter(task => {
            if (task.title.toLowerCase().includes(query)) return true
            const taskProps = propertyValues[task.id] || {}
            return Object.values(taskProps).some(val =>
                String(val).toLowerCase().includes(query)
            )
        })
    }, [filteredTasks, searchQuery, propertyValues])

    const sortedTasks = sortTasks(searchedTasks, sort, propertyValues, properties)

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
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")} className="gap-2 text-muted-foreground hover:text-foreground p-0 h-auto">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="text-base">Back</span>
                        </Button>

                        <div className="flex items-center gap-1 relative">
                            {/* Mobile Search Icon */}
                            {!isSearchOpen ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSearchOpen(true)}
                                    className="h-9 w-9 p-0"
                                >
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            ) : (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center animate-in fade-in slide-in-from-right-5 duration-200">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search tasks..."
                                            className="h-9 w-[calc(100vw-180px)] md:w-64 pl-9 pr-9 bg-background/95 backdrop-blur border shadow-lg rounded-full"
                                            autoFocus
                                            onBlur={() => !searchQuery && setIsSearchOpen(false)}
                                        />
                                        {searchQuery && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSearchQuery("")}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-background/50"
                                            >
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsSearchOpen(false)
                                            setSearchQuery("")
                                        }}
                                        className="ml-2 h-9 w-9 p-0 rounded-full hover:bg-muted"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            )}

                            {category && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            if (confirm("Are you sure you want to delete this category and all its tasks?")) {
                                                removeCategory(category.id).then(() => router.push("/tasks"))
                                            }
                                        }} className="text-red-500 focus:text-red-500">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Category
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-2 sm:gap-4">
                            {category?.icon && (
                                <div className={cn(
                                    "h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg animate-scale-in flex-shrink-0",
                                    category.gradient ? `gradient-${category.gradient}` : "bg-muted"
                                )}>
                                    {category.icon}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className={cn(
                                    "text-3xl sm:text-4xl font-bold mb-0.5 truncate",
                                    category?.gradient ? `gradient-text` : ""
                                )}>
                                    {category?.name || "Tasks"}
                                </h1>
                                <p className="text-sm text-muted-foreground truncate">
                                    {category?.description || `${sortedTasks.length} tasks`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 relative">
                            {/* Actions removed - moved to Header Actions and FAB */}
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
                        onUpdateProperty={handleUpdateProperty}
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
                    gradient={category?.gradient || undefined}
                />

                {/* Task Detail Modal */}
                <TaskDetailModal
                    open={showTaskDetail}
                    onOpenChange={setShowTaskDetail}
                    task={selectedTask}
                    onUpdate={editTask}
                />

                {/* Global Search */}

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

                {/* Floating Action Button (Mobile) */}
                <FloatingActionButton
                    icon={Plus}
                    onClick={() => setShowAddDialog(true)}
                    position="bottom-right"
                    gradient={category?.gradient as any || "primary"}
                    label="Add"
                    className="mb-20"
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
