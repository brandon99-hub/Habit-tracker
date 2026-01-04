"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format, subDays, getDaysInMonth } from "date-fns"
import { Check } from "lucide-react"

type Habit = {
    id: string
    name: string
    history: { date: string; completed: boolean; value?: number }[]
}

type ViewMode = "daily" | "individual" | "cumulative"

const HABIT_COLORS = [
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // orange
    "#10b981", // green
    "#3b82f6", // blue
    "#ef4444", // red
    "#14b8a6", // teal
    "#f97316", // orange-red
]

export function HabitLineGraph({ habits }: { habits: Habit[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>("daily")

    // Generate data for current month
    const generateChartData = () => {
        const daysInMonth = getDaysInMonth(new Date())
        const data = []

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(new Date().getFullYear(), new Date().getMonth(), day)
            const dateStr = format(date, "yyyy-MM-dd")

            const entry: any = {
                day,
                date: format(date, "MMM dd"),
                total: 0,
                habits: [],
            }

            // Calculate data based on view mode
            if (viewMode === "daily") {
                // Count total completions for this day
                habits.forEach((habit) => {
                    const completion = habit.history.find((h) => h.date === dateStr && h.completed)
                    if (completion) {
                        entry.total++
                        entry.habits.push({ id: habit.id, name: habit.name })
                    }
                })
            } else if (viewMode === "individual") {
                // Individual line for each habit
                habits.forEach((habit) => {
                    const completion = habit.history.find((h) => h.date === dateStr)
                    entry[habit.id] = completion?.completed ? 1 : 0
                })
            } else if (viewMode === "cumulative") {
                // Running total
                const previousTotal = data.length > 0 ? data[data.length - 1].cumulative : 0
                let dayTotal = 0
                habits.forEach((habit) => {
                    const completion = habit.history.find((h) => h.date === dateStr && h.completed)
                    if (completion) dayTotal++
                })
                entry.cumulative = previousTotal + dayTotal
            }

            data.push(entry)
        }

        return data
    }

    const chartData = generateChartData()

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length || !payload[0]) return null

        const data = payload[0].payload
        if (!data) return null

        return (
            <Card className="p-3">
                <p className="font-semibold mb-2">{label}</p>
                {viewMode === "daily" && (
                    <>
                        <p className="text-lg font-bold text-primary mb-2">{data.total || 0} completions</p>
                        {data.habits && data.habits.length > 0 && (
                            <div className="space-y-1">
                                {data.habits.map((h: any) => (
                                    <div key={h.id} className="flex items-center gap-2 text-sm">
                                        <Check className="h-3 w-3 text-green-500" />
                                        <span>{h.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
                {viewMode === "individual" && (
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => {
                            const habit = habits.find((h) => h.id === entry.dataKey)
                            if (!habit) return null
                            return (
                                <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span>{habit.name}: {entry.value ? "✓" : "✗"}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
                {viewMode === "cumulative" && (
                    <p className="text-lg font-bold text-primary">{data.cumulative || 0} total completions</p>
                )}
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold">Completion Trends</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
                </div>
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily Total</SelectItem>
                        <SelectItem value="individual">By Habit</SelectItem>
                        <SelectItem value="cumulative">Cumulative</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                    <XAxis
                        dataKey="day"
                        label={{ value: "Day of Month", position: "insideBottom", offset: -5 }}
                        stroke="#888"
                    />
                    <YAxis
                        label={{ value: "Completions", angle: -90, position: "insideLeft" }}
                        stroke="#888"
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {viewMode === "daily" && (
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={{ fill: "#8b5cf6", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}

                    {viewMode === "individual" && (
                        <>
                            <Legend />
                            {habits.map((habit, i) => (
                                <Line
                                    key={habit.id}
                                    type="monotone"
                                    dataKey={habit.id}
                                    name={habit.name}
                                    stroke={HABIT_COLORS[i % HABIT_COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            ))}
                        </>
                    )}

                    {viewMode === "cumulative" && (
                        <Line
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: "#10b981", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 text-xs text-muted-foreground">
                {viewMode === "daily" && "Shows total number of habits completed each day"}
                {viewMode === "individual" && "Shows completion status for each habit (1 = completed, 0 = not completed)"}
                {viewMode === "cumulative" && "Shows running total of all completions over time"}
            </div>
        </Card>
    )
}
