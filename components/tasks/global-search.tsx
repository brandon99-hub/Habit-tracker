"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Page, Property } from "@/lib/tasks/supabase-categories"
import { TaskIcon } from "./task-icon"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    tasks: Page[]
    properties: Property[]
    propertyValues: Record<string, Record<string, any>>
    onTaskClick: (taskId: string) => void
}

export function GlobalSearch({ open, onOpenChange, tasks, properties, propertyValues, onTaskClick }: Props) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Page[]>([])

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const searchLower = query.toLowerCase()
        const filtered = tasks.filter((task) => {
            // Search in title
            if (task.title.toLowerCase().includes(searchLower)) return true

            // Search in property values
            const taskProps = propertyValues[task.id] || {}
            for (const propId in taskProps) {
                const value = taskProps[propId]
                if (typeof value === "string" && value.toLowerCase().includes(searchLower)) {
                    return true
                }
            }

            return false
        })

        setResults(filtered)
    }, [query, tasks, propertyValues])

    const handleTaskClick = (taskId: string) => {
        onTaskClick(taskId)
        onOpenChange(false)
        setQuery("")
    }

    const getTaskStatus = (taskId: string) => {
        const statusProp = properties.find((p) => p.name === "Status")
        if (!statusProp) return "Not Started"
        return propertyValues[taskId]?.[statusProp.id] || "Not Started"
    }

    const getTaskPriority = (taskId: string) => {
        const priorityProp = properties.find((p) => p.name === "Priority")
        if (!priorityProp) return "Medium"
        return propertyValues[taskId]?.[priorityProp.id] || "Medium"
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tasks..."
                        className="pl-10"
                        autoFocus
                    />
                </div>

                <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
                    {query && results.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No tasks found</p>
                            <p className="text-sm">Try a different search term</p>
                        </div>
                    )}

                    {results.map((task) => (
                        <Card
                            key={task.id}
                            className="p-3 cursor-pointer hover:border-primary transition-colors"
                            onClick={() => handleTaskClick(task.id)}
                        >
                            <div className="flex items-start gap-3">
                                <TaskIcon iconName={task.icon} className="text-primary" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{task.title}</h4>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span className="px-2 py-0.5 rounded-md bg-muted">
                                            {getTaskStatus(task.id)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-muted">
                                            {getTaskPriority(task.id)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {!query && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Start typing to search</p>
                        <p className="text-sm">Search by title or properties</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
