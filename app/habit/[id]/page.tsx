"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GradientCard } from "@/components/ui/gradient-card"
import { getStreakBadge } from "@/components/streak-badge"
import { SwipeableEditableHabitCard } from "@/components/swipeable-editable-habit-card"
import { HabitIcon } from "@/components/habit-icon"
import { ArrowLeft, Check, Flame, TrendingUp, Calendar as CalendarIcon } from "lucide-react"
import { useHabits } from "@/hooks/use-habits"
import { calculateConsistency } from "@/lib/habit-service"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { MobileNav } from "@/components/mobile-nav"

const DAYS = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
]

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const { habits, updateHabit, deleteHabit, toggleHabit, loading } = useHabits()

    const habit = habits.find((h) => h.id === resolvedParams.id)

    // Use habit history instead of completions
    const habitCompletions = habit?.history
        .filter((h) => h.completed)
        .map((h) => ({
            id: h.date,
            timestamp: new Date(h.date),
            value: h.value,
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) || []

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pb-24">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (!habit) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pb-24">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Habit not found</p>
                    <Button onClick={() => router.push("/")}>Go Home</Button>
                </div>
            </div>
        )
    }

    const handleDelete = async () => {
        if (confirm(`Delete "${habit.name}"? This cannot be undone.`)) {
            await deleteHabit(habit.id)
            router.push("/")
        }
    }

    const handleToggle = async () => {
        await toggleHabit(habit.id, habit.type === "numeric" ? habit.value : undefined)
    }

    const totalCompletions = habit.history.filter((h) => h.completed).length
    const avgValue =
        habit.type === "numeric"
            ? Math.round(
                habit.history.filter((h) => h.completed && h.value).reduce((sum, h) => sum + (h.value || 0), 0) /
                totalCompletions || 0
            )
            : null

    // Calendar heatmap data
    const currentDate = new Date()
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const getCompletionIntensity = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const completion = habit.history.find((h) => h.date.startsWith(dateStr))
        if (!completion?.completed) return 0
        if (habit.type === "numeric" && completion.value) {
            const maxValue = Math.max(...habit.history.filter((h) => h.value).map((h) => h.value || 0))
            return Math.ceil((completion.value / maxValue) * 4)
        }
        return 4
    }

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8">
            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Badge variant="outline" className="text-sm">{habit.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600">
                            <HabitIcon name={(habit.icon || 'Sparkles') as any} className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Detail:</p>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{habit.name}</h1>
                        </div>
                    </div>
                </div>

                <SwipeableEditableHabitCard
                    habitName={habit.name}
                    habitIcon={habit.icon || 'Sparkles'}
                    category={habit.category || ""}
                    scheduledDays={habit.scheduled_days || []}
                    scheduledTime={habit.scheduled_time || ""}
                    currentStreak={habit.currentStreak}
                    onNameChange={(name) => updateHabit(habit.id, { name })}
                    onCategoryChange={(category) => updateHabit(habit.id, { category })}
                    onScheduledDaysChange={(days) => updateHabit(habit.id, { scheduled_days: days })}
                    onScheduledTimeChange={(time) => updateHabit(habit.id, { scheduled_time: time })}
                    onDelete={handleDelete}
                    onComplete={handleToggle}
                    isCompleted={habit.completedToday}
                />

                {/* Stats Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold mb-4">Progress Overview</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Flame className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Current</span>
                            </div>
                            <p className="text-3xl font-bold">{habit.currentStreak}</p>
                            <p className="text-xs text-muted-foreground mt-1">day streak</p>
                        </Card>

                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Best</span>
                            </div>
                            <p className="text-3xl font-bold">{habit.longestStreak}</p>
                            <p className="text-xs text-muted-foreground mt-1">day streak</p>
                        </Card>

                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Check className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Total</span>
                            </div>
                            <p className="text-3xl font-bold">{totalCompletions}</p>
                            <p className="text-xs text-muted-foreground mt-1">completions</p>
                        </Card>
                    </div>
                </div>

                {avgValue !== null && (
                    <Card className="p-4 mb-6">
                        <p className="text-sm text-muted-foreground">Average Value</p>
                        <p className="mt-1 text-xl font-semibold">
                            {avgValue} {habit.unit}
                        </p>
                    </Card>
                )}

                {/* Calendar Section */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold mb-4">Activity Calendar</h2>
                    <Card className="p-6">
                        <div className="grid grid-cols-7 gap-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div key={day} className="text-center text-xs text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {daysInMonth.map((day) => {
                                const intensity = getCompletionIntensity(day)
                                const isToday = isSameDay(day, new Date())
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`relative aspect-square rounded border transition-all hover:ring-2 hover:ring-primary/50 ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                                            } ${intensity === 0 ? "border-border bg-muted/30" : "border-transparent"}`}
                                        style={{
                                            backgroundColor:
                                                intensity === 0
                                                    ? undefined
                                                    : intensity === 1
                                                        ? "#0e4429"
                                                        : intensity === 2
                                                            ? "#006d32"
                                                            : intensity === 3
                                                                ? "#26a641"
                                                                : "#39d353",
                                        }}
                                    >
                                        <span
                                            className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${intensity > 0 ? "text-white" : "text-muted-foreground"
                                                }`}
                                        >
                                            {format(day, "d")}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="h-3 w-3 rounded border border-border bg-muted/30" />
                                <div className="h-3 w-3 rounded" style={{ backgroundColor: "#0e4429" }} />
                                <div className="h-3 w-3 rounded" style={{ backgroundColor: "#006d32" }} />
                                <div className="h-3 w-3 rounded" style={{ backgroundColor: "#26a641" }} />
                                <div className="h-3 w-3 rounded" style={{ backgroundColor: "#39d353" }} />
                            </div>
                            <span>More</span>
                        </div>
                    </Card>
                </div>

                {/* Recent Activity Section */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                    <Card className="p-6">
                        {habitCompletions.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                                    <Check className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">No completions yet</p>
                                <p className="text-xs text-muted-foreground mt-1">Start building your streak!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {habitCompletions.slice(0, 10).map((completion: any, index: number) => (
                                    <div key={completion.id} className="group relative">
                                        <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/50 transition-all hover:shadow-sm">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Check className="h-5 w-5 text-primary" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{format(new Date(completion.timestamp), "EEEE, MMM dd")}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(completion.timestamp), "yyyy")}</p>
                                            </div>
                                            {completion.value && (
                                                <Badge variant="secondary" className="font-semibold">
                                                    {completion.value} {habit.unit}
                                                </Badge>
                                            )}
                                        </div>
                                        {index < habitCompletions.slice(0, 10).length - 1 && (
                                            <div className="absolute left-[18px] top-[60px] w-0.5 h-3 bg-border" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    )
}
