"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Check, X, Bell, Repeat } from "lucide-react"
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
import { TimePicker } from "@/components/ui/time-picker"

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
    }, [task.id])

    const handleSaveTitle = async () => {
        if (title.trim() && title !== task.title) {
            await onEdit(task.id, { title })
        }
        setIsEditing(false)
    }

    const handlePropertyChange = async (propertyId: string, value: any) => {
        await onUpdateProperty(task.id, propertyId, value)
        setPropertyValues({ ...propertyValues, [propertyId]: value })
    }

    const statusProperty = properties.find((p) => p.name === "Status")
    const priorityProperty = properties.find((p) => p.name === "Priority")
    const dueDateProperty = properties.find((p) => p.name === "Due Date")

    // Swipe handler for mobile - swipe right to complete
    const swipeHandlers = useSwipeable({
        onSwipedRight: () => {
            if (statusProperty) {
                handlePropertyChange(statusProperty.id, "Done")
            }
        },
        trackMouse: false, // Only track touch, not mouse
        preventScrollOnSwipe: true,
    })

    return (
        <Card {...swipeHandlers} className="p-3 sm:p-4 transition-all hover:bg-accent/5">
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
                                <SelectTrigger className="h-7 w-[130px] text-xs border-dashed bg-transparent hover:bg-accent/50">
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

                                {/* Overdue Indicator - Red Dot */}
                                {new Date(propertyValues[dueDateProperty.id]) < new Date() && (
                                    <div
                                        className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                                        title="Overdue"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
