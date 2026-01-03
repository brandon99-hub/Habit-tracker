"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const PRIORITIES = ['urgent', 'high', 'medium', 'low']

export function QuickAddDialog({ open, onOpenChange, onAdd, categories }: Props) {
    const [input, setInput] = useState("")
    const [parsed, setParsed] = useState<any>(null)
    const [selectedCategory, setSelectedCategory] = useState("")
    const [recentInputs, setRecentInputs] = useState<string[]>([])

    // Autocomplete state
    const [showAutocomplete, setShowAutocomplete] = useState(false)
    const [autocompleteType, setAutocompleteType] = useState<'category' | 'priority' | null>(null)
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([])
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

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

    // Parse input and check for autocomplete
    useEffect(() => {
        if (input.trim()) {
            const result = parseTaskInput(input, categories)
            setParsed(result)
            if (result.category) {
                setSelectedCategory(result.category)
            }

            // Check for autocomplete triggers
            const cursorPos = inputRef.current?.selectionStart || input.length
            const textBeforeCursor = input.substring(0, cursorPos)

            // Category autocomplete (@)
            const categoryMatch = textBeforeCursor.match(/@([\w\s-]*)$/)
            if (categoryMatch) {
                const searchTerm = categoryMatch[1].toLowerCase()
                const matches = categories
                    .filter(c => c.name.toLowerCase().includes(searchTerm))
                    .map(c => c.name)
                    .slice(0, 5)

                if (matches.length > 0) {
                    setAutocompleteSuggestions(matches)
                    setAutocompleteType('category')
                    setShowAutocomplete(true)
                    setSelectedSuggestionIndex(0)
                    return
                }
            }

            // Priority autocomplete (!)
            const priorityMatch = textBeforeCursor.match(/!(\w*)$/)
            if (priorityMatch) {
                const searchTerm = priorityMatch[1].toLowerCase()
                const matches = PRIORITIES.filter(p => p.startsWith(searchTerm))

                if (matches.length > 0) {
                    setAutocompleteSuggestions(matches)
                    setAutocompleteType('priority')
                    setShowAutocomplete(true)
                    setSelectedSuggestionIndex(0)
                    return
                }
            }

            setShowAutocomplete(false)
        } else {
            setParsed(null)
            setShowAutocomplete(false)
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

    const applySuggestion = (suggestion: string) => {
        const cursorPos = inputRef.current?.selectionStart || input.length
        const textBeforeCursor = input.substring(0, cursorPos)
        const textAfterCursor = input.substring(cursorPos)

        let newInput = ""
        if (autocompleteType === 'category') {
            newInput = textBeforeCursor.replace(/@[\w\s-]*$/, `@${suggestion} `) + textAfterCursor
        } else if (autocompleteType === 'priority') {
            newInput = textBeforeCursor.replace(/!\w*$/, `!${suggestion} `) + textAfterCursor
        }

        setInput(newInput)
        setShowAutocomplete(false)

        // Focus back on input
        setTimeout(() => inputRef.current?.focus(), 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showAutocomplete) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedSuggestionIndex((prev) =>
                    prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
                )
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedSuggestionIndex((prev) => prev > 0 ? prev - 1 : prev)
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                if (autocompleteSuggestions.length > 0) {
                    e.preventDefault()
                    applySuggestion(autocompleteSuggestions[selectedSuggestionIndex])
                }
            } else if (e.key === 'Escape') {
                setShowAutocomplete(false)
            }
        } else if (e.key === 'Enter' && parsed?.title && parsed?.category) {
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
                    {/* Smart Input with Autocomplete */}
                    <div className="space-y-2">
                        <Label htmlFor="task-input" className="text-base">Type your task...</Label>
                        <div className="relative">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                                ref={inputRef}
                                id="task-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Meeting tomorrow at 2pm @Work !high"
                                className="text-base pl-10 h-12"
                                autoFocus
                            />

                            {/* Autocomplete Dropdown */}
                            {showAutocomplete && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                    <div className="p-2 space-y-1">
                                        {autocompleteSuggestions.map((suggestion, index) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => applySuggestion(suggestion)}
                                                className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${index === selectedSuggestionIndex
                                                        ? 'bg-accent text-accent-foreground'
                                                        : 'hover:bg-accent/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {autocompleteType === 'category' ? (
                                                        <Folder className="h-3 w-3 text-muted-foreground" />
                                                    ) : (
                                                        <Flag className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                    <span className="capitalize">{suggestion}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
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
                            className="flex-1 gradient-primary text-white border-0 hover:opacity-90 gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            Add Task
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
