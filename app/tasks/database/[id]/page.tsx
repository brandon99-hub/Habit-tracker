"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTasks } from "@/hooks/use-tasks"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Table as TableIcon, Calendar as CalendarIcon, Search } from "lucide-react"
import { TableView } from "@/components/tasks/table-view"
import { CalendarView } from "@/components/tasks/calendar-view"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"
import { TaskDetailModal } from "@/components/tasks/task-detail-modal"
import { GlobalSearch } from "@/components/tasks/global-search"
import { TaskFilters, type FilterOptions } from "@/components/tasks/task-filters"
import { TaskSort, type SortOption } from "@/components/tasks/task-sort"
import { getPropertyValues } from "@/lib/tasks/supabase-tasks"
import { getRecurringTask } from "@/lib/tasks/recurring-service"
import { filterTasks, sortTasks } from "@/lib/tasks/filter-sort-utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Page } from "@/lib/tasks/supabase-categories"


export default function DatabasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { tasks, properties, loading, addTask, editTask, removeTask, updateProperty } = useTasks(id)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [view, setView] = useState<"table" | "calendar">("table")
  const [propertyValues, setPropertyValues] = useState<Record<string, Record<string, any>>>({})
  const [recurringTasks, setRecurringTasks] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<Page | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

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
  useEffect(() => {
    const fetchAllData = async () => {
      const values: Record<string, Record<string, any>> = {}
      const recurring = new Set<string>()

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
          recurring.add(task.id)
        }
      }

      setPropertyValues(values)
      setRecurringTasks(recurring)
    }

    if (tasks.length > 0) {
      fetchAllData()
    }
  }, [tasks])

  const handleAddTask = async (title: string, icon?: string) => {
    await addTask(title, icon)
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
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/tasks")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {sortedTasks.length} of {tasks.length} tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(true)}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Search
                <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center justify-between mb-4">
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
      </div>
    </div>
  )
}
