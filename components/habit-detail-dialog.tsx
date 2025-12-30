"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Check, Flame, TrendingUp, Calendar } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"

type Habit = {
  id: string
  name: string
  type: "binary" | "numeric"
  unit?: string
  currentStreak: number
  longestStreak: number
  history: { date: string; completed: boolean; value?: number }[]
  category?: string
}

type Completion = {
  id: string
  habitId: string
  habitName: string
  timestamp: Date
  value?: number
  unit?: string
  note?: string
}

type HabitDetailDialogProps = {
  habit: Habit
  completions: Completion[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HabitDetailDialog({ habit, completions, open, onOpenChange }: HabitDetailDialogProps) {
  const totalCompletions = habit.history.filter((h) => h.completed).length
  const avgValue =
    habit.type === "numeric"
      ? Math.round(
        habit.history.filter((h) => h.completed && h.value).reduce((sum, h) => sum + (h.value || 0), 0) /
        totalCompletions || 0,
      )
      : null

  // Generate calendar heatmap for current month
  const currentDate = new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getCompletionIntensity = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    const completion = habit.history.find((h) => h.date.startsWith(dateStr))
    if (!completion?.completed) return 0
    if (habit.type === "numeric" && completion.value) {
      // Intensity based on value (higher value = more intense)
      const maxValue = Math.max(...habit.history.filter((h) => h.value).map((h) => h.value || 0))
      return Math.ceil((completion.value / maxValue) * 4)
    }
    return 4 // Full intensity for binary habits
  }

  const sortedCompletions = [...completions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {habit.name}
            {habit.category && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-normal text-muted-foreground">
                {habit.category}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4" />
                <span className="text-xs">Current</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{habit.currentStreak}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Best</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{habit.longestStreak}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4" />
                <span className="text-xs">Total</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{totalCompletions}</p>
              <p className="text-xs text-muted-foreground">completions</p>
            </Card>
          </div>

          {avgValue !== null && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Average Value</p>
              <p className="mt-1 text-xl font-semibold">
                {avgValue} {habit.unit}
              </p>
            </Card>
          )}

          {/* Calendar Heatmap */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs text-muted-foreground">
                  {day}
                </div>
              ))}
              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Calendar days */}
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
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
