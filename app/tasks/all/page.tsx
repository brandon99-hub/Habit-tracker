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
import { getPropertyValues } from "@/lib/tasks/supabase-categories"
import { getRecurringTask } from "@/lib/tasks/recurring-service"
import { filterTasks, sortTasks } from "@/lib/tasks/filter-sort-utils"
import type { Page } from "@/lib/tasks/supabase-categories"
import { supabase } from "@/lib/supabase"

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
    }, [user])

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
                            return (
                                <Card
                                    key={task.id}
                                    className="p-4 hover-lift cursor-pointer"
                                    onClick={() => router.push(`/tasks/category/${task.category_id}`)}
                                >
                                    <div className="flex items-start gap-3">
                                        <TaskIcon iconName={task.icon} className="text-primary mt-1" />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-foreground mb-1">
                                                {task.title}
                                            </h3>
                                            {category && (
                                                <p className="text-xs text-muted-foreground">
                                                    {category.icon} {category.name}
                                                </p>
                                            )}
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
