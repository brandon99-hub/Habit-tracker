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
import type { Page, Property } from "@/lib/tasks/supabase-categories"
import { getPropertyValues } from "@/lib/tasks/supabase-categories"
import { TaskIcon } from "./task-icon"

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

    return (
        <Card className="p-4">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <TaskIcon iconName={task.icon} className="text-primary" />

                {/* Content */}
                <div className="flex-1 space-y-3">
                    {/* Title */}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
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
                                className="flex-1"
                            />
                            <Button size="sm" variant="ghost" onClick={handleSaveTitle}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setTitle(task.title)
                                    setIsEditing(false)
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <h3
                            className="font-medium text-foreground cursor-pointer hover:text-primary"
                            onClick={() => setIsEditing(true)}
                        >
                            {task.title}
                        </h3>
                    )}

                    {/* Properties */}
                    <div className="flex flex-wrap gap-3 text-sm">
                        {/* Status */}
                        {statusProperty && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Status:</span>
                                <Select
                                    value={propertyValues[statusProperty.id] || "Not Started"}
                                    onValueChange={(value) => handlePropertyChange(statusProperty.id, value)}
                                >
                                    <SelectTrigger className="w-[150px] h-8">
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
                            </div>
                        )}

                        {/* Priority */}
                        {priorityProperty && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Priority:</span>
                                <Select
                                    value={propertyValues[priorityProperty.id] || "Medium"}
                                    onValueChange={(value) => handlePropertyChange(priorityProperty.id, value)}
                                >
                                    <SelectTrigger className="w-[120px] h-8">
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
                            </div>
                        )}

                        {/* Due Date */}
                        {dueDateProperty && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Due:</span>
                                <Input
                                    type="date"
                                    value={propertyValues[dueDateProperty.id] || ""}
                                    onChange={(e) => handlePropertyChange(dueDateProperty.id, e.target.value)}
                                    className="w-[150px] h-8"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            // Open recurring dialog
                            const event = new CustomEvent("openRecurring", { detail: { taskId: task.id } })
                            window.dispatchEvent(event)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Repeat className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            // Open reminder dialog
                            const event = new CustomEvent("openReminder", { detail: { taskId: task.id, dueDate: propertyValues[dueDateProperty?.id || ""] } })
                            window.dispatchEvent(event)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Bell className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(task.id)}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
