"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, X } from "lucide-react"
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
            <DialogContent
                className="fixed top-0 left-0 right-0 translate-x-0 translate-y-0 max-w-none w-full border-x-0 border-t-0 rounded-none p-0 bg-background/95 backdrop-blur-xl shadow-2xl duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top"
                showCloseButton={false}
            >
                <div className="max-w-4xl mx-auto p-4 md:p-8">
                    <DialogTitle className="sr-only">Global Search</DialogTitle>

                    <div className="relative group animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type to search your tasks and properties..."
                            className="h-14 pl-12 text-lg bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-2xl"
                            autoFocus
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-8 overflow-y-auto max-h-[70vh] custom-scrollbar pb-8">
                        {query && results.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground animate-in fade-in zoom-in duration-300">
                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">No tasks found</p>
                                <p className="text-sm opacity-60">Try searching for keywords, status, or priorities</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {results.map((task, index) => (
                                <Card
                                    key={task.id}
                                    className="group p-4 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 rounded-2xl border-muted/50 animate-in fade-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    onClick={() => handleTaskClick(task.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                            <TaskIcon iconName={task.icon} className="text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{task.title}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="bg-muted/50 font-medium text-[10px]">
                                                    {getTaskStatus(task.id)}
                                                </Badge>
                                                <Badge variant="secondary" className="bg-muted/50 font-medium text-[10px]">
                                                    {getTaskPriority(task.id)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {!query && (
                            <div className="text-center py-20 text-muted-foreground animate-in fade-in duration-500">
                                <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="h-10 w-10 opacity-20" />
                                </div>
                                <p className="text-xl font-medium">Global Search</p>
                                <p className="text-sm opacity-60 mt-2">Search across all your categories, status, and properties</p>

                                <div className="mt-8 flex flex-wrap justify-center gap-2">
                                    {["Status", "Priority", "Title", "Description"].map((hint) => (
                                        <span key={hint} className="px-3 py-1 rounded-full bg-muted/50 text-[11px] font-medium border border-muted-foreground/10">
                                            {hint}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
