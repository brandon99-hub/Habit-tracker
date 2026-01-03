"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCategories } from "@/hooks/use-categories"
import { useCache } from "@/lib/cache-context"
import { useToast } from "@/hooks/use-toast"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { formatDate, formatTime } from "@/lib/utils/date-format"
import { useInvalidateTaskCaches } from "@/hooks/use-invalidate-caches"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/ui/bottom-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Plus, Grid, Calendar, User, CheckCircle2, ArrowLeft, Filter, Search, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { TaskIcon } from "@/components/tasks/task-icon"
import { TaskFilters, type FilterOptions } from "@/components/tasks/task-filters"
import { TaskSort, type SortOption } from "@/components/tasks/task-sort"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"
import { getPages, getProperties, getPropertyValues, type Page, type Property, deletePage } from "@/lib/tasks/supabase-categories"
import { setPropertyValue } from "@/lib/tasks/supabase-categories"
import { createPage } from "@/lib/tasks/supabase-tasks"
import { getRecurringTask } from "@/lib/tasks/recurring-service"
import { filterTasks, sortTasks } from "@/lib/tasks/filter-sort-utils"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Clock } from "lucide-react"
import { SwipeableTaskCard } from "@/components/tasks/swipeable-task-card"

export default function AllTasksPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { categories } = useCategories()
    const cache = useCache()
    const { toast } = useToast()
    const { preferences } = useUserPreferences()
    const { invalidateAll } = useInvalidateTaskCaches()
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [allTasks, setAllTasks] = useState<Page[]>([])
    const [properties, setProperties] = useState<any[]>([])
    const [propertyValues, setPropertyValues] = useState<Record<string, Record<string, any>>>({})
    const [recurringTasks, setRecurringTasks] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)

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
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        async function fetchAllTasks() {
            if (!user) return

            const cacheKey = 'all-tasks-data'

            // Check cache first synchronously
            const cached = cache.get<{
                tasks: Page[]
                properties: any[]
                propertyValues: Record<string, Record<string, any>>
                recurringTasks: Record<string, any>
            }>(cacheKey)

            if (cached) {
                // Use cached data immediately - no loading state
                setAllTasks(cached.tasks)
                setProperties(cached.properties)
                setPropertyValues(cached.propertyValues)
                setRecurringTasks(cached.recurringTasks)
                setLoading(false)
                return
            }

            // No cache - fetch from database
            const { data, error } = await supabase
                .from("task_pages")
                .select("*")
                .order("created_at", { ascending: false })

            if (data && !error) {
                setAllTasks(data)

                // Fetch properties
                const { data: propsData } = await supabase
                    .from("task_properties")
                    .select("*")

                if (propsData) {
                    setProperties(propsData)
                }

                // Fetch property values and recurring status for all tasks
                const values: Record<string, Record<string, any>> = {}
                const recurring: Record<string, any> = {}

                for (const task of data) {
                    const { data: pvData } = await getPropertyValues(task.id)
                    if (pvData) {
                        const taskValues: Record<string, any> = {}
                        pvData.forEach((pv: any) => {
                            taskValues[pv.property_id] = pv.value
                        })
                        values[task.id] = taskValues
                    }

                    const { data: recurringData } = await getRecurringTask(task.id)
                    if (recurringData) {
                        recurring[task.id] = recurringData
                    }
                }

                setPropertyValues(values)
                setRecurringTasks(recurring)

                // Cache the data
                cache.set(cacheKey, {
                    tasks: data,
                    properties: propsData || [],
                    propertyValues: values,
                    recurringTasks: recurring
                })
            }

            setLoading(false)
        }

        fetchAllTasks()
    }, [user, cache])

    // Function to update a property value
    const updateProperty = async (taskId: string, propertyId: string, value: any) => {
        const { error } = await setPropertyValue(taskId, propertyId, value)
        if (!error) {
            // Update local state
            setPropertyValues(prev => ({
                ...prev,
                [taskId]: {
                    ...(prev[taskId] || {}),
                    [propertyId]: value
                }
            }))

            // Invalidate cache for real-time updates across pages
            cache.invalidate('all-tasks-data')
            cache.invalidate('home-stats')
        }
    }

    // Function to delete a task
    const deleteTask = async (taskId: string) => {
        const task = allTasks.find(t => t.id === taskId)
        const { error } = await deletePage(taskId)

        if (!error) {
            // Remove from local state
            setAllTasks(prev => prev.filter(t => t.id !== taskId))

            // Comprehensive cache invalidation
            invalidateAll(task?.category_id)

            // Show success toast
            toast({
                title: "Task deleted",
                description: task?.title ? `"${task.title}" has been deleted` : "Task has been deleted",
            })
        } else {
            // Show error toast
            toast({
                title: "Error",
                description: "Failed to delete task. Please try again.",
                variant: "destructive"
            })
        }
    }

    // Function to add a new task
    const handleAddTask = async (
        title: string,
        icon?: string,
        status?: string,
        priority?: string,
        dueDate?: Date,
        reminderOffset?: number,
        categoryId?: string
    ) => {
        if (!categoryId) return

        try {
            // Create the task
            const { data: newTask, error } = await createPage(categoryId, title, icon || "📝")

            if (error || !newTask) {
                console.error("Error creating task:", error)
                return
            }

            // Get properties for this category
            const { data: categoryProperties } = await supabase
                .from("task_properties")
                .select("*")
                .eq("database_id", categoryId)

            if (categoryProperties) {
                // Set status
                if (status) {
                    const statusProp = categoryProperties.find(p => p.name === "Status")
                    if (statusProp) {
                        await setPropertyValue(newTask.id, statusProp.id, status)
                    }
                }

                // Set priority
                if (priority) {
                    const priorityProp = categoryProperties.find(p => p.name === "Priority")
                    if (priorityProp) {
                        await setPropertyValue(newTask.id, priorityProp.id, priority)
                    }
                }

                // Set due date
                if (dueDate) {
                    const dueDateProp = categoryProperties.find(p => p.name === "Due Date")
                    if (dueDateProp) {
                        await setPropertyValue(newTask.id, dueDateProp.id, dueDate.toISOString())
                    }
                }
            }

            // Refresh tasks
            setAllTasks(prev => [newTask, ...prev])
            setShowAddDialog(false)

            // Comprehensive cache invalidation
            invalidateAll(categoryId)
        } catch (error) {
            console.error("Error in handleAddTask:", error)
        }
    }

    // Apply category filter first
    const categoryFilteredTasks = selectedCategory === "all"
        ? allTasks
        : allTasks.filter(task => task.category_id === selectedCategory)

    // Apply search filter
    const searchFilteredTasks = searchQuery.trim()
        ? categoryFilteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : categoryFilteredTasks

    // Then apply other filters and sorting
    const filteredTasks = filterTasks(searchFilteredTasks, filters, propertyValues, properties, recurringTasks)
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
        <div className="min-h-screen bg-background pb-24">
            <div className="mx-auto max-w-7xl px-4 py-6">
                {/* Header */}
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/tasks")}
                            className="gap-2 text-muted-foreground hover:text-foreground p-0 h-auto"
                        >
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
                        </div>
                    </div>
                </header>

                {/* Title Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between gap-4 mb-1">
                        <h1 className="text-3xl font-bold gradient-text">All Tasks</h1>
                        <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full whitespace-nowrap">
                            {sortedTasks.length} of {allTasks.length}
                        </span>
                    </div>
                </div>


                {/* Filters and Sort */}
                <div className="mb-6 space-y-3">
                    {/* Category Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.icon} {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Task Filters and Sort */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <TaskFilters filters={filters} onFilterChange={setFilters} />
                        <TaskSort sort={sort} onSortChange={setSort} />
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                    {sortedTasks.length === 0 ? (
                        <Card className="p-12 text-center">
                            <p className="text-muted-foreground">
                                {selectedCategory === "all"
                                    ? "No tasks yet. Create your first task to get started!"
                                    : "No tasks match your filters."}
                            </p>
                        </Card>
                    ) : (
                        sortedTasks.map((task) => {
                            const category = categories.find(c => c.id === task.category_id)
                            const taskValues = propertyValues[task.id] || {}

                            // Find specific properties FOR THIS CATEGORY
                            const statusProp = properties.find(p =>
                                p.name === "Status" && p.category_id === task.category_id
                            )
                            const priorityProp = properties.find(p =>
                                p.name === "Priority" && p.category_id === task.category_id
                            )
                            const dueDateProp = properties.find(p =>
                                p.name === "Due Date" && p.category_id === task.category_id
                            )

                            const statusVal = statusProp ? (taskValues[statusProp.id] || "Not Started") : "Not Started"
                            const priorityVal = priorityProp ? (taskValues[priorityProp.id] || "Medium") : "Medium"
                            const dueDateVal = dueDateProp ? taskValues[dueDateProp.id] : null
                            const isOverdue = dueDateVal && statusVal !== "Completed" && new Date(dueDateVal) < new Date()

                            return (
                                <SwipeableTaskCard
                                    key={task.id}
                                    taskId={task.id}
                                    onSwipeLeft={deleteTask}
                                    onSwipeRight={(taskId) => {
                                        if (statusProp) {
                                            updateProperty(taskId, statusProp.id, "Completed")
                                        }
                                    }}
                                    onClick={() => router.push(`/tasks/category/${task.category_id}`)}
                                    className="p-4 transition-all hover:bg-accent/5 cursor-pointer border border-border/50 group"
                                >
                                    <div className="flex gap-4 items-start">
                                        {/* Icon & Category Indicator */}
                                        <div className="relative">
                                            <TaskIcon iconName={task.icon} className="h-8 w-8 text-primary" />
                                            {category && (
                                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full border border-border p-0.5 text-[8px]" title={category.name}>
                                                    {category.icon || "📁"}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            {/* Top Line: Title & Category */}
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                                                        {task.title}
                                                    </h3>
                                                    {category && (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-sm">{category.icon}</span>
                                                            <span className={cn(
                                                                "text-[10px] uppercase tracking-wider font-bold",
                                                                category.gradient ? `text-${category.gradient === 'primary' ? 'purple-500' :
                                                                    category.gradient === 'success' ? 'green-500' :
                                                                        category.gradient === 'warning' ? 'orange-500' : 'blue-500'}` : "text-muted-foreground/70"
                                                            )}>
                                                                {category.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Detail Badges */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Status Badge */}
                                                {statusVal && (
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                                        statusVal === 'Completed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                            statusVal === 'In Progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                                "bg-muted text-muted-foreground border-border"
                                                    )}>
                                                        {statusVal}
                                                    </div>
                                                )}

                                                {/* Priority Badge */}
                                                {priorityVal && (
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                                        priorityVal === 'Urgent' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                            priorityVal === 'High' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                                "bg-muted text-muted-foreground border-border"
                                                    )}>
                                                        {priorityVal}
                                                    </div>
                                                )}

                                                {/* Date/Time Display */}
                                                {dueDateVal && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 rounded-full text-[10px] text-muted-foreground border border-border/50">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {(() => {
                                                                try {
                                                                    const date = new Date(dueDateVal)
                                                                    if (isNaN(date.getTime())) return dueDateVal.split('T')[0]

                                                                    // If it contains a real time (not 00:00:00 or 23:59:00 etc)
                                                                    const hasTime = dueDateVal.includes('T') && !dueDateVal.endsWith('00:00:00.000Z') && !dueDateVal.endsWith('23:59:00.000Z')

                                                                    if (hasTime) {
                                                                        return format(date, "MMM d, h:mm a")
                                                                    }
                                                                    return format(date, "MMM d, yyyy")
                                                                } catch (e) {
                                                                    return dueDateVal
                                                                }
                                                            })()}
                                                        </span>
                                                        {/* Overdue Indicator - Red Dot */}
                                                        {isOverdue && (
                                                            <div
                                                                className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                                                                title="Overdue"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chevron Indicator */}
                                        <div className="pt-2">
                                            <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                                        </div>
                                    </div>
                                </SwipeableTaskCard>
                            )
                        })
                    )}
                </div>

                {/* FAB for Adding Tasks */}
                <FloatingActionButton
                    icon={Plus}
                    onClick={() => setShowAddDialog(true)}
                    position="bottom-right"
                    gradient="primary"
                    label="Add Task"
                    className="mb-20"
                />

                {/* Add Task Dialog */}
                <AddTaskDialog
                    open={showAddDialog}
                    onOpenChange={setShowAddDialog}
                    onAdd={handleAddTask}
                    properties={properties}
                    showCategorySelector={true}
                    categories={categories}
                />

                {/* Bottom Navigation */}
                <BottomNav
                    items={[
                        { icon: Grid, label: 'Home', href: '/tasks' },
                        { icon: CheckCircle2, label: 'Tasks', href: '/tasks/all' },
                        { icon: Calendar, label: 'Calendar', href: '/tasks/calendar' },
                        { icon: User, label: 'Profile', href: '/tasks/profile' },
                    ]}
                />
            </div>
        </div>
    )
}
