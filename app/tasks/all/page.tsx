"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/ui/bottom-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Plus, Grid, Calendar, User, CheckCircle2, ArrowLeft, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { TaskIcon } from "@/components/tasks/task-icon"
import { TaskFilters, type FilterOptions } from "@/components/tasks/task-filters"
import { TaskSort, type SortOption } from "@/components/tasks/task-sort"
import { getPages, getProperties, getPropertyValues, type Page, type Property } from "@/lib/tasks/supabase-categories"
import { setPropertyValue } from "@/lib/tasks/supabase-categories"
import { getRecurringTask } from "@/lib/tasks/recurring-service"
import { filterTasks, sortTasks } from "@/lib/tasks/filter-sort-utils"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useSwipeable } from "react-swipeable"
import { Clock } from "lucide-react"

export default function AllTasksPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { categories } = useCategories()
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

    useEffect(() => {
        async function fetchAllTasks() {
            if (!user) return

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
            }
            setLoading(false)
        }

        fetchAllTasks()
    }, [categories, selectedCategory])

    // Function to update a property value
    const updateProperty = async (pageId: string, propertyId: string, value: any) => {
        const { error } = await setPropertyValue(pageId, propertyId, value)

        if (!error) {
            // Update local state
            setPropertyValues(prev => ({
                ...prev,
                [pageId]: {
                    ...(prev[pageId] || {}),
                    [propertyId]: value
                }
            }))
        }
    }

    // Apply category filter first
    const categoryFilteredTasks = selectedCategory === "all"
        ? allTasks
        : allTasks.filter(task => task.category_id === selectedCategory)

    // Then apply other filters and sorting
    const filteredTasks = filterTasks(categoryFilteredTasks, filters, propertyValues, properties, recurringTasks)
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/tasks")}
                        className="mb-4 gap-2 md:hidden"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <h1 className="text-3xl font-bold gradient-text mb-2">All Tasks</h1>
                    <p className="text-sm text-muted-foreground">
                        {sortedTasks.length} of {allTasks.length} tasks
                    </p>
                </header>

                {/* Filters and Sort */}
                <div className="mb-6 space-y-4">
                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[200px]">
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
                    <div className="flex items-center gap-2 flex-wrap">
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

                            // Find specific properties
                            const statusProp = properties.find(p => p.name === "Status")
                            const priorityProp = properties.find(p => p.name === "Priority")
                            const dueDateProp = properties.find(p => p.name === "Due Date")

                            const statusVal = statusProp ? taskValues[statusProp.id] : null
                            const priorityVal = priorityProp ? taskValues[priorityProp.id] : null
                            const dueDateVal = dueDateProp ? taskValues[dueDateProp.id] : null

                            // Swipe handler for mobile - swipe right to complete
                            const swipeHandlers = useSwipeable({
                                onSwipedRight: (e) => {
                                    e.event.stopPropagation() // Prevent navigation
                                    if (statusProp) {
                                        updateProperty(task.id, statusProp.id, "Done")
                                    }
                                },
                                trackMouse: false,
                                preventScrollOnSwipe: true,
                            })

                            return (
                                <Card
                                    key={task.id}
                                    {...swipeHandlers}
                                    className="p-4 transition-all hover:bg-accent/5 cursor-pointer border border-border/50 group"
                                    onClick={() => router.push(`/tasks/category/${task.category_id}`)}
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
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
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
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chevron Indicator */}
                                        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                                        </div>
                                    </div>
                                </Card>
                            )
                        })
                    )}
                </div>

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
