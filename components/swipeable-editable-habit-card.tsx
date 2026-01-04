"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, Sparkles } from "lucide-react"
import { HabitIcon } from "@/components/habit-icon"
import { cn } from "@/lib/utils"

const DAYS = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
]

type SwipeableEditableHabitCardProps = {
    habitName: string
    habitIcon: string
    category: string
    scheduledDays: number[]
    scheduledTime: string
    onNameChange: (name: string) => void
    onCategoryChange: (category: string) => void
    onScheduledDaysChange: (days: number[]) => void
    onScheduledTimeChange: (time: string) => void
    onDelete: () => void
    onComplete: () => void
    isCompleted?: boolean
    currentStreak?: number
}

export function SwipeableEditableHabitCard({
    habitName,
    habitIcon,
    category,
    scheduledDays,
    scheduledTime,
    onNameChange,
    onCategoryChange,
    onScheduledDaysChange,
    onScheduledTimeChange,
    onDelete,
    onComplete,
    isCompleted = false,
    currentStreak = 0,
}: SwipeableEditableHabitCardProps) {
    const [name, setName] = useState(habitName)
    const [startX, setStartX] = useState(0)
    const [currentX, setCurrentX] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)

    const handleNameBlur = () => {
        if (name !== habitName) {
            onNameChange(name)
        }
    }

    const toggleDay = (day: number) => {
        const newDays = scheduledDays.includes(day)
            ? scheduledDays.filter((d) => d !== day)
            : [...scheduledDays, day].sort()
        onScheduledDaysChange(newDays)
    }

    // Swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isCompleted) return
        setStartX(e.touches[0].clientX)
        setIsSwiping(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping || isCompleted) return
        const diff = e.touches[0].clientX - startX
        if (diff > 0) {
            setCurrentX(diff)
        }
    }

    const handleTouchEnd = () => {
        if (!isSwiping || isCompleted) return
        if (currentX > 100) {
            onComplete()
        }
        setCurrentX(0)
        setIsSwiping(false)
    }

    return (
        <div
            className="relative overflow-hidden rounded-xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Swipe background indicator */}
            {!isCompleted && (
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 flex items-center px-8 transition-all backdrop-blur-sm"
                    style={{ width: `${Math.min(currentX, 300)}px` }}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-green-400" />
                        <span className="text-green-100 font-semibold text-lg">Complete</span>
                    </div>
                </div>
            )}

            {/* Main card */}
            <Card
                className={cn(
                    "relative overflow-hidden border-2 transition-all duration-300",
                    isCompleted ? "border-green-500/50" : "border-primary/50"
                )}
                style={{ transform: `translateX(${currentX}px)` }}
            >
                {/* Header - Simple */}
                <div className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            {/* Habit Icon */}
                            <div className="p-2 rounded-lg bg-primary/10">
                                <HabitIcon name={habitIcon} className="h-5 w-5 text-primary" />
                            </div>

                            {/* Editable name - smaller */}
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={handleNameBlur}
                                className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent shadow-none flex-1"
                                placeholder="Habit name"
                            />
                        </div>

                        {/* Delete button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 bg-card">
                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-primary flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            Category
                        </Label>
                        <Select value={category} onValueChange={onCategoryChange}>
                            <SelectTrigger className="h-12 bg-background/50">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Physical">💪 Physical</SelectItem>
                                <SelectItem value="Mental">🧠 Mental</SelectItem>
                                <SelectItem value="Creative">🎨 Creative</SelectItem>
                                <SelectItem value="Social">👥 Social</SelectItem>
                                <SelectItem value="Work">💼 Work</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Schedule accordion */}
                    <Accordion type="single" collapsible className="border rounded-lg bg-background/50">
                        <AccordionItem value="schedule" className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Schedule
                                    <Badge variant="secondary" className="ml-2">
                                        {scheduledDays.length} {scheduledDays.length === 1 ? "day" : "days"}
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                                {/* Days */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Repeat on:</Label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {DAYS.map((day) => (
                                            <Button
                                                key={day.value}
                                                type="button"
                                                variant={scheduledDays.includes(day.value) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => toggleDay(day.value)}
                                                className="h-10 font-medium"
                                            >
                                                {day.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Preferred time:</Label>
                                    <Input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => onScheduledTimeChange(e.target.value)}
                                        className="h-10 bg-background"
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </Card>
        </div>
    )
}
