"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCache } from "@/lib/cache-context"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Grid, Calendar as CalendarIcon, User, CheckCircle2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, isSameDay, parseISO } from "date-fns"
import { supabase } from "@/lib/supabase"
import { getPropertyValues } from "@/lib/tasks/supabase-categories"
import { getRecurringTask } from "@/lib/tasks/recurring-service"
import { TaskIcon } from "@/components/tasks/task-icon"
import type { Page } from "@/lib/tasks/supabase-categories"
import { CalendarTaskCard } from "@/components/tasks/calendar-task-card"
import { setPropertyValue } from "@/lib/tasks/supabase-categories"

export default function CalendarPage() {
    const router = useRouter()
    const { user } = useAuth()
    const cache = useCache()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [allTasks, setAllTasks] = useState<Page[]>([])
    const [properties, setProperties] = useState<any[]>([])
    const [propertyValues, setPropertyValues] = useState<Record<string, Record<string, any>>>({})
    const [recurringTasks, setRecurringTasks] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    useEffect(() => {
        async function fetchData() {
            if (!user) return

            const cacheKey = 'calendar-data'

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

            console.log("[CALENDAR] Fetching all tasks...")

            // No cache - fetch from database
            const { data: tasksData, error: tasksError } = await supabase
                .from("task_pages")
                .select("*")
                .order("created_at", { ascending: false })

            if (tasksError) {
                console.error("[CALENDAR] Error fetching tasks:", tasksError)
                setLoading(false)
                return
            }

            console.log("[CALENDAR] Loaded tasks:", tasksData?.length || 0)

            if (tasksData) {
                setAllTasks(tasksData)

                // Fetch properties
                const { data: propsData } = await supabase
                    .from("task_properties")
                    .select("*")

                if (propsData) {
                    setProperties(propsData)
                    console.log("[CALENDAR] Loaded properties:", propsData.length)
                }

                // Fetch property values and recurring info for all tasks
                const values: Record<string, Record<string, any>> = {}
                const recurring: Record<string, any> = {}

                for (const task of tasksData) {
                    const { data: pvData } = await getPropertyValues(task.id)
                    if (pvData) {
                        const taskValues: Record<string, any> = {}
                        pvData.forEach((pv: any) => {
                            taskValues[pv.property_id] = pv.value
                        })
                        values[task.id] = taskValues
                    }

                    // Fetch recurring data
                    const { data: recurringData, error: recurringError } = await getRecurringTask(task.id)
                    if (recurringError && recurringError.code !== 'PGRST116') {
                        console.error("[CALENDAR] Error fetching recurring for task:", task.id, recurringError)
                    }
                    if (recurringData) {
                        recurring[task.id] = recurringData
                        console.log("[CALENDAR] Task", task.title, "is recurring:", recurringData.pattern)
                    }
                }

                console.log("[CALENDAR] Total recurring tasks:", Object.keys(recurring).length)
                setPropertyValues(values)
                setRecurringTasks(recurring)

                // Cache the data
                cache.set(cacheKey, {
                    tasks: tasksData,
                    properties: propsData || [],
                    propertyValues: values,
                    recurringTasks: recurring
                })
            }

            setLoading(false)
        }

        fetchData()
    }, [user, cache])

    // Check if a date has tasks (including recurring occurrences)
    const getTasksForDate = (date: Date) => {
        const tasksOnDate: Page[] = []

        allTasks.forEach((task) => {
            // Find Due Date property FOR THIS TASK'S CATEGORY
            const dueDateProp = properties.find((p) =>
                p.name === "Due Date" && p.category_id === task.category_id
            )

            if (!dueDateProp) return // Skip if no due date property for this category

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

    // Determine if a recurring task should show on a given date
    const shouldShowRecurringTask = (date: Date, originalDueDate: string, recurring: any) => {
        if (!originalDueDate) return false

        const originalDate = parseISO(originalDueDate)
        const pattern = recurring.pattern

        // Task should only appear on or after the original due date
        if (date < originalDate) return false

        switch (pattern) {
            case "daily":
                return true // Show every day after start date

            case "weekdays":
                const day = date.getDay()
                return day >= 1 && day <= 5 // Monday-Friday

            case "weekly":
                const config = recurring.config || {}
                const daysOfWeek = config.days || [originalDate.getDay()]
                return daysOfWeek.includes(date.getDay())

            case "monthly":
                // Show on the same day of every month
                return date.getDate() === originalDate.getDate()

            default:
                return false
        }
    }

    const handleToday = () => {
        const today = new Date()
        setCurrentMonth(today)
        setSelectedDate(today)
    }

    const tasksForSelectedDate = getTasksForDate(selectedDate)

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading calendar...</p>
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

                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold gradient-text">Calendar</h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium min-w-[120px] text-center">
                                {format(currentMonth, "MMMM yyyy")}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Calendar Grid */}
                <Card className="p-4">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((day) => {
                            const tasksOnDay = getTasksForDate(day)
                            const isSelected = isSameDay(day, selectedDate)
                            const isCurrentDay = isToday(day)

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
                                    {(() => {
                                        const taskCount = tasksOnDay.length
                                        if (taskCount === 0) return null
                                        if (taskCount === 1) {
                                            return <div className="w-1 h-1 rounded-full bg-primary" />
                                        }
                                        // Show multiple dots for 2-3 tasks
                                        if (taskCount <= 3) {
                                            return (
                                                <div className="flex justify-center gap-0.5 mt-1">
                                                    {tasksOnDay.slice(0, 3).map((_, i) => (
                                                        <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                                                    ))}
                                                </div>
                                            )
                                        }
                                        // Show count for 4+ tasks
                                        return (
                                            <div className="text-[8px] font-bold text-primary mt-0.5">
                                                {taskCount}
                                            </div>
                                        )
                                    })()}
                                </button>
                            )
                        })}
                    </div>
                </Card>

                {/* Tasks for Selected Date */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Tasks for {format(selectedDate, "MMMM d, yyyy")}
                    </h3>
                    {tasksForSelectedDate.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">No tasks for this date</p>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {tasksForSelectedDate.map((task) => (
                                <CalendarTaskCard
                                    key={task.id}
                                    task={task}
                                    properties={properties}
                                    propertyValues={propertyValues[task.id] || {}}
                                    isRecurring={!!recurringTasks[task.id]}
                                    onSwipeLeft={async (taskId) => {
                                        // Delete task
                                        await supabase.from("task_pages").delete().eq("id", taskId)
                                        setAllTasks(prev => prev.filter(t => t.id !== taskId))
                                    }}
                                    onSwipeRight={async (taskId) => {
                                        // Mark as complete
                                        const task = allTasks.find(t => t.id === taskId)
                                        if (!task) return

                                        const statusProp = properties.find(p =>
                                            p.name === "Status" && p.category_id === task.category_id
                                        )
                                        if (statusProp) {
                                            await setPropertyValue(taskId, statusProp.id, "Completed")
                                            setPropertyValues(prev => ({
                                                ...prev,
                                                [taskId]: { ...(prev[taskId] || {}), [statusProp.id]: "Completed" }
                                            }))
                                        }
                                    }}
                                    onClick={() => router.push(`/tasks/category/${task.category_id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>

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
