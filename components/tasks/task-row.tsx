"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Check, X, Bell, Repeat, CheckCircle2, Calendar, Clock } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useSwipeable } from "react-swipeable"
import type { Page, Property } from "@/lib/tasks/supabase-categories"
import { getPropertyValues } from "@/lib/tasks/supabase-categories"
import { TaskIcon } from "./task-icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

type Props = {
    task: Page
    properties: Property[]
    onEdit: (id: string, updates: Partial<Page>) => Promise<any>
    onDelete: (id: string) => Promise<any>
    onUpdateProperty: (pageId: string, propertyId: string, value: any) => Promise<any>
}

export function TaskRow({ task, properties, onEdit, onDelete, onUpdateProperty }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(task.title)
    const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})
    const [dragOffset, setDragOffset] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null)
    const [recurringInfo, setRecurringInfo] = useState<any>(null)
    const [reminderInfo, setReminderInfo] = useState<any>(null)

    const DIRECTION_THRESHOLD = 15 // pixels to determine direction

    useEffect(() => {
        // Fetch property values for this task
        getPropertyValues(task.id).then(({ data }) => {
            if (data) {
                const values: Record<string, any> = {}
                data.forEach((pv: any) => {
                    values[pv.property_id] = pv.value
                })
                setPropertyValues(values)
            }
        })

        // Fetch recurring info
        supabase
            .from("recurring_tasks")
            .select("*")
            .eq("page_id", task.id)
            .single()
            .then(({ data }) => {
                if (data) setRecurringInfo(data)
            })

        // Fetch reminder info
        supabase
            .from("task_reminders")
            .select("*")
            .eq("page_id", task.id)
            .single()
            .then(({ data }) => {
                if (data) setReminderInfo(data)
            })
    }, [task.id])

    const handleSaveTitle = async () => {
        if (title.trim() && title !== task.title) {
            await onEdit(task.id, { title })
        }
        setIsEditing(false)
    }

    const handlePropertyChange = async (propertyId: string, value: any) => {
        await onUpdateProperty(task.id, propertyId, value)
        setPropertyValues((prev) => ({ ...prev, [propertyId]: value }))
    }

    const statusProperty = properties.find((p) => p.name === "Status")
    const priorityProperty = properties.find((p) => p.name === "Priority")
    const dueDateProperty = properties.find((p) => p.name === "Due Date")

    // Swipe handler for mobile
    const swipeHandlers = useSwipeable({
        onSwiping: (eventData) => {
            // Determine swipe direction on first movement
            if (!swipeDirection) {
                const absX = Math.abs(eventData.deltaX)
                const absY = Math.abs(eventData.deltaY)

                // Only lock direction after threshold is reached
                if (absX > DIRECTION_THRESHOLD || absY > DIRECTION_THRESHOLD) {
                    if (absX > absY * 1.5) {
                        // More horizontal than vertical (with 1.5x bias)
                        setSwipeDirection('horizontal')
                    } else {
                        // More vertical - let scroll happen
                        setSwipeDirection('vertical')
                        return
                    }
                }
            }

            // Only handle horizontal swipes
            if (swipeDirection === 'horizontal') {
                setIsSwiping(true)
                const offset = Math.max(-200, Math.min(200, eventData.deltaX))
                setDragOffset(offset)
            }
        },
        onSwiped: (eventData) => {
            // Only process if it was a horizontal swipe
            if (swipeDirection === 'horizontal') {
                const cardWidth = 300
                const swipeDistance = Math.abs(eventData.deltaX)
                const swipePercentage = swipeDistance / cardWidth

                if (swipePercentage >= 0.4) {
                    if (eventData.deltaX < 0) {
                        // Swiped left - delete
                        onDelete(task.id)
                    } else if (statusProperty) {
                        // Swiped right - complete
                        handlePropertyChange(statusProperty.id, "Completed")
                    }
                }
            }

            // Reset position and direction
            setDragOffset(0)
            setIsSwiping(false)
            setSwipeDirection(null)
        },
        trackMouse: false,
        preventScrollOnSwipe: false, // Changed to false to allow vertical scroll
        delta: DIRECTION_THRESHOLD, // Minimum distance before swipe is detected
    })

    const getBackgroundOpacity = () => {
        return Math.min(Math.abs(dragOffset) / 150, 1)
    }

    // Format recurring info for display
    const getRecurringText = () => {
        if (!recurringInfo) return null

        const pattern = recurringInfo.pattern
        const days = recurringInfo.days_of_week || []

        if (pattern === 'daily') {
            return 'Daily'
        } else if (pattern === 'weekly') {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            const selectedDays = days.map((d: number) => dayNames[d]).join(', ')
            return `Weekly on ${selectedDays}`
        } else if (pattern === 'monthly') {
            const day = recurringInfo.day_of_month
            if (day) {
                return `Monthly on day ${day}`
            }
            return 'Monthly'
        }
        return pattern.charAt(0).toUpperCase() + pattern.slice(1)
    }

    // Format reminder info for display
    const getReminderText = () => {
        if (!reminderInfo) return null

        try {
            const remindAt = new Date(reminderInfo.remind_at)
            const dueDate = dueDateProperty ? propertyValues[dueDateProperty.id] : null

            if (dueDate) {
                const due = new Date(dueDate)
                const diffMinutes = Math.round((due.getTime() - remindAt.getTime()) / (1000 * 60))

                if (diffMinutes > 0) {
                    return `${diffMinutes} min before (${format(remindAt, 'h:mm a')})`
                }
            }

            return `At ${format(remindAt, 'MMM d, h:mm a')}`
        } catch (e) {
            return 'Reminder set'
        }
    }

    const hasTaskDetails = recurringInfo || reminderInfo

    return (
        <div className="relative overflow-hidden rounded-lg">
            {/* Background indicators */}
            <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                {/* Complete indicator (right swipe) */}
                <div
                    className="flex items-center gap-2 text-green-500 transition-opacity"
                    style={{ opacity: dragOffset > 0 ? getBackgroundOpacity() : 0 }}
                >
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold text-sm">Complete</span>
                </div>

                {/* Delete indicator (left swipe) */}
                <div
                    className="flex items-center gap-2 text-red-500 transition-opacity ml-auto"
                    style={{ opacity: dragOffset < 0 ? getBackgroundOpacity() : 0 }}
                >
                    <span className="font-semibold text-sm">Delete</span>
                    <Trash2 className="h-5 w-5" />
                </div>
            </div>

            <Card
                {...swipeHandlers}
                className="p-3 sm:p-4 transition-all hover:bg-accent/5"
                style={{
                    transform: `translateX(${dragOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <div className="flex gap-3 items-start">
                    {/* Icon Column - Fixed width */}
                    <div className="pt-1 flex-shrink-0">
                        <TaskIcon iconName={task.icon} className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    {/* Main Content Column */}
                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Header Row: Title + Actions */}
                        <div className="flex justify-between items-start gap-2">
                            {/* Title Section */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveTitle()
                                                if (e.key === "Escape") {
                                                    setTitle(task.title)
                                                    setIsEditing(false)
                                                }
                                            }}
                                            autoFocus
                                            className="h-8 text-sm"
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveTitle}>
                                            <Check className="h-4 w-4 text-green-500" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => {
                                                setTitle(task.title)
                                                setIsEditing(false)
                                            }}
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ) : (
                                    <h3
                                        className="font-medium text-base leading-tight cursor-pointer hover:text-primary transition-colors break-words"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {task.title}
                                    </h3>
                                )}
                            </div>

                            {/* Actions Context Menu (Desktop: Row, Mobile: Compact) */}
                            <div className="flex items-center gap-0.5 flex-shrink-0 -mr-2 sm:mr-0">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                        const event = new CustomEvent("openRecurring", { detail: { taskId: task.id } })
                                        window.dispatchEvent(event)
                                    }}
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    title="Recurring"
                                >
                                    <Repeat className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                        const event = new CustomEvent("openReminder", { detail: { taskId: task.id, dueDate: propertyValues[dueDateProperty?.id || ""] } })
                                        window.dispatchEvent(event)
                                    }}
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    title="Reminders"
                                >
                                    <Bell className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onDelete(task.id)}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Properties Row - Wraps naturally */}
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            {/* Status */}
                            {statusProperty && (
                                <Select
                                    value={propertyValues[statusProperty.id] || "Not Started"}
                                    onValueChange={(value) => handlePropertyChange(statusProperty.id, value)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-7 w-[130px] text-xs border-dashed bg-transparent hover:bg-accent/50",
                                        propertyValues[statusProperty.id] === 'Completed' && "text-green-600 font-medium"
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusProperty.config?.options?.map((option: string) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Priority */}
                            {priorityProperty && (
                                <Select
                                    value={propertyValues[priorityProperty.id] || "Medium"}
                                    onValueChange={(value) => handlePropertyChange(priorityProperty.id, value)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-7 w-[100px] text-xs border-dashed bg-transparent hover:bg-accent/50",
                                        propertyValues[priorityProperty.id] === 'High' && "text-orange-500 font-medium",
                                        propertyValues[priorityProperty.id] === 'Urgent' && "text-red-500 font-bold"
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorityProperty.config?.options?.map((option: string) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Due Date & Time Group */}
                            {dueDateProperty && (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1 bg-accent/10 rounded-md p-0.5 px-2 border border-border/50">
                                        <Input
                                            type="date"
                                            value={propertyValues[dueDateProperty.id]?.split('T')[0] || ""}
                                            onChange={(e) => {
                                                const dateStr = e.target.value
                                                const currentIso = propertyValues[dueDateProperty.id]

                                                if (currentIso && dateStr) {
                                                    const timePart = currentIso.split('T')[1] || '00:00:00.000Z'
                                                    const newIso = `${dateStr}T${timePart}`
                                                    handlePropertyChange(dueDateProperty.id, newIso)
                                                } else {
                                                    handlePropertyChange(dueDateProperty.id, dateStr)
                                                }
                                            }}
                                            className="h-6 w-auto min-w-[110px] border-0 bg-transparent p-0 text-xs focus-visible:ring-0 shadow-none cursor-pointer"
                                        />

                                        <div className="w-[1px] h-4 bg-border/50 mx-1" />

                                        <input
                                            type="time"
                                            value={(() => {
                                                const iso = propertyValues[dueDateProperty.id]
                                                if (!iso || !iso.includes('T')) return ""
                                                const date = new Date(iso)
                                                if (isNaN(date.getTime())) return ""
                                                return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                                            })()}
                                            onChange={(e) => {
                                                const newTime = e.target.value
                                                if (!newTime) return

                                                const currentIso = propertyValues[dueDateProperty.id]
                                                if (!currentIso) return

                                                const datePart = currentIso.split('T')[0]
                                                const [hours, minutes] = newTime.split(':')
                                                const dateObj = new Date(currentIso.includes('T') ? currentIso : `${datePart}T00:00:00`)
                                                dateObj.setHours(parseInt(hours))
                                                dateObj.setMinutes(parseInt(minutes))

                                                handlePropertyChange(dueDateProperty.id, dateObj.toISOString())
                                            }}
                                            className="h-8 px-2 text-sm border rounded bg-background hover:bg-muted/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    {/* Overdue Indicator - Red Dot (outside container, hidden when completed) */}
                                    {propertyValues[dueDateProperty.id] &&
                                        statusProperty &&
                                        propertyValues[statusProperty.id] !== 'Completed' &&
                                        new Date(propertyValues[dueDateProperty.id]) < new Date() && (
                                            <div
                                                className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"
                                                title="Overdue"
                                            />
                                        )}
                                </div>
                            )}
                        </div>

                        {/* Task Details Accordion */}
                        {hasTaskDetails && (
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-0">
                                    <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            <span>Task Details</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-2 pt-1">
                                        <div className="flex flex-wrap gap-3 text-xs">
                                            {getRecurringText() && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
                                                    <Repeat className="h-3 w-3" />
                                                    <span className="font-medium">{getRecurringText()}</span>
                                                </div>
                                            )}
                                            {getReminderText() && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20">
                                                    <Bell className="h-3 w-3" />
                                                    <span className="font-medium">{getReminderText()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
