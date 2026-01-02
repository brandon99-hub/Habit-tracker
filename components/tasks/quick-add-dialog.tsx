"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Zap, Calendar, Flag, Folder, Sparkles, Clock } from "lucide-react"
import { parseTaskInput } from "@/lib/tasks/nlp-parser"
import { format } from "date-fns"

type Category = {
    id: string
    name: string
    icon?: string | null
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (title: string, categoryId: string, priority?: string, dueDate?: Date) => void
    categories: Category[]
}

export function QuickAddDialog({ open, onOpenChange, onAdd, categories }: Props) {
    const [input, setInput] = useState("")
    const [parsed, setParsed] = useState<any>(null)
    const [selectedCategory, setSelectedCategory] = useState("")
    const [recentInputs, setRecentInputs] = useState<string[]>([])

    // Load recent inputs from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('quickAddRecentInputs')
        if (stored) {
            try {
                setRecentInputs(JSON.parse(stored))
            } catch (e) {
                console.error('Error loading recent inputs:', e)
            }
        }
    }, [])

    useEffect(() => {
        if (input.trim()) {
            const result = parseTaskInput(input, categories)
            setParsed(result)
            if (result.category) {
                setSelectedCategory(result.category)
            }
        } else {
            setParsed(null)
        }
    }, [input, categories])

    const handleSubmit = () => {
        if (!parsed?.title || !parsed?.category) return

        // Save to recent inputs (max 3)
        const newRecentInputs = [input, ...recentInputs.filter(i => i !== input)].slice(0, 3)
        setRecentInputs(newRecentInputs)
        localStorage.setItem('quickAddRecentInputs', JSON.stringify(newRecentInputs))

        onAdd(
            parsed.title,
            parsed.category,
            parsed.priority,
            parsed.dueDate
        )

        // Reset
        setInput("")
        setParsed(null)
        setSelectedCategory("")
        onOpenChange(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && parsed?.title && parsed?.category) {
            e.preventDefault()
            handleSubmit()
        } else if (e.key === 'Escape') {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Zap className="h-6 w-6 text-amber-500" />
                        Quick Add Task
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Smart Input */}
                    <div className="space-y-2">
                        <Label htmlFor="task-input" className="text-base">Type your task...</Label>
                        <div className="relative">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="task-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Meeting tomorrow at 2pm @Work !high"
                                className="text-base pl-10 h-12"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            💡 <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-muted rounded">@category</code>, <code className="px-1 py-0.5 bg-muted rounded">!priority</code>, "monday", "tomorrow", "at 2pm"
                        </p>
                    </div>

                    {/* Preview */}
                    {parsed && parsed.title && (
                        <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                                <Sparkles className="h-3 w-3" />
                                PARSED TASK
                            </div>
                            <div className="flex items-start gap-2 flex-wrap">
                                <span className="font-semibold text-base text-foreground">{parsed.title}</span>
                                {parsed.priority && (
                                    <Badge
                                        variant="secondary"
                                        className={`gap-1 ${parsed.priority === 'Urgent' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                            parsed.priority === 'High' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                                'bg-muted'
                                            }`}
                                    >
                                        <Flag className="h-3 w-3" />
                                        {parsed.priority}
                                    </Badge>
                                )}
                                {parsed.dueDate && (
                                    <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                        <Calendar className="h-3 w-3" />
                                        {format(parsed.dueDate, 'MMM d, h:mm a')}
                                    </Badge>
                                )}
                                {parsed.category && (
                                    <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                                        <Folder className="h-3 w-3" />
                                        {categories.find(c => c.id === parsed.category)?.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Inputs */}
                    {recentInputs.length > 0 && !input && (
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="recent" className="border-none">
                                <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Recent Inputs ({recentInputs.length})</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pt-2">
                                        {recentInputs.map((recentInput, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setInput(recentInput)}
                                                className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/5 transition-all group"
                                            >
                                                <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {recentInput}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}

                    {/* Error State */}
                    {input && !parsed?.title && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive font-medium">
                                ⚠️ Please enter a task title
                            </p>
                        </div>
                    )}

                    {/* Category Required Warning */}
                    {parsed?.title && !parsed?.category && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-sm text-amber-600 font-medium">
                                💡 Add a category using @categoryname (e.g., @Work, @Personal)
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!parsed?.title || !parsed?.category}
                            className="flex-1 gradient-primary text-white border-0 hover:opacity-90 shadow-md"
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
