"use client"

import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, subMonths } from "date-fns"

type HabitHeatmapProps = {
    history: { date: string; completed: boolean; value?: number }[]
    habitName: string
    monthsToShow?: number
}

export function HabitHeatmap({ history, habitName, monthsToShow = 3 }: HabitHeatmapProps) {
    const today = new Date()
    const startDate = startOfMonth(subMonths(today, monthsToShow - 1))
    const endDate = endOfMonth(today)

    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    const getCompletionForDate = (date: Date) => {
        return history.find((h) => isSameDay(new Date(h.date), date))
    }

    const getIntensityClass = (completion: { completed: boolean; value?: number } | undefined) => {
        if (!completion || !completion.completed) {
            return "bg-muted/30 hover:bg-muted/50"
        }

        // For numeric habits, use value to determine intensity
        if (completion.value !== undefined) {
            const maxValue = Math.max(...history.filter(h => h.value).map(h => h.value!), 1)
            const intensity = completion.value / maxValue

            if (intensity >= 0.75) return "bg-green-600 hover:bg-green-700"
            if (intensity >= 0.5) return "bg-green-500 hover:bg-green-600"
            if (intensity >= 0.25) return "bg-green-400 hover:bg-green-500"
            return "bg-green-300 hover:bg-green-400"
        }

        // For binary habits, just show completed
        return "bg-green-500 hover:bg-green-600"
    }

    // Group days by month
    const daysByMonth = allDays.reduce((acc, day) => {
        const monthKey = format(day, "MMM yyyy")
        if (!acc[monthKey]) acc[monthKey] = []
        acc[monthKey].push(day)
        return acc
    }, {} as Record<string, Date[]>)

    return (
        <Card className="p-4">
            <h3 className="mb-4 text-sm font-medium text-foreground">{habitName} Activity</h3>
            <TooltipProvider>
                <div className="space-y-6">
                    {Object.entries(daysByMonth).map(([month, days]) => (
                        <div key={month}>
                            <p className="mb-2 text-xs font-medium text-muted-foreground">{month}</p>
                            <div className="grid grid-cols-7 gap-1.5">
                                {days.map((day) => {
                                    const completion = getCompletionForDate(day)
                                    const intensityClass = getIntensityClass(completion)

                                    return (
                                        <Tooltip key={day.toISOString()}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`aspect-square rounded-sm transition-colors ${intensityClass} cursor-pointer`}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="text-xs">
                                                    <p className="font-medium">{format(day, "MMM d, yyyy")}</p>
                                                    {completion?.completed ? (
                                                        <p className="text-green-400">
                                                            ✓ Completed{completion.value ? ` (${completion.value})` : ""}
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted-foreground">Not completed</p>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </TooltipProvider>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-sm bg-muted/30" />
                    <div className="h-3 w-3 rounded-sm bg-green-300" />
                    <div className="h-3 w-3 rounded-sm bg-green-400" />
                    <div className="h-3 w-3 rounded-sm bg-green-500" />
                    <div className="h-3 w-3 rounded-sm bg-green-600" />
                </div>
                <span>More</span>
            </div>
        </Card>
    )
}
