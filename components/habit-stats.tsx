import { Card } from "@/components/ui/card"
import { TrendingUp, Flame, Target, Award, Calendar, TrendingDown } from "lucide-react"

type Habit = {
  id: string
  name: string
  currentStreak: number
  longestStreak: number
  pausedDays: number
  history: { date: string; completed: boolean; value?: number }[]
  lastCompletedDate?: string
  category?: string
  scheduledTime?: string
}

type HabitStatsProps = {
  habits: Habit[]
}

function calculateConsistency(history: { date: string; completed: boolean }[], days: number): number {
  if (history.length === 0) return 0
  const recentHistory = history.slice(0, Math.min(days, history.length))
  const completed = recentHistory.filter((h) => h.completed).length
  return Math.round((completed / recentHistory.length) * 100)
}

function calculateRecoveryRate(habit: Habit): string | null {
  const missedIndices: number[] = []
  habit.history.forEach((h, i) => {
    if (!h.completed) missedIndices.push(i)
  })

  if (missedIndices.length < 2) return null

  const recoveryTimes = []
  for (let i = 1; i < missedIndices.length; i++) {
    recoveryTimes.push(missedIndices[i] - missedIndices[i - 1])
  }

  if (recoveryTimes.length === 0) return null
  const avgRecovery = Math.round(recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length)
  return `${avgRecovery} days`
}

function detectPatterns(habits: Habit[]): {
  dayPatterns: { habit: string; day: string; skipRate: number }[]
  timePatterns: { habit: string; time: string; consistency: number }[]
  categoryInsights: { category: string; avgConsistency: number }[]
} {
  const dayPatterns: { habit: string; day: string; skipRate: number }[] = []
  const timePatterns: { habit: string; time: string; consistency: number }[] = []
  const categoryMap = new Map<string, { total: number; count: number }>()

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  habits.forEach((habit) => {
    if (habit.history.length < 7) return

    // Day-based pattern detection
    const dayStats = new Map<number, { completed: number; total: number }>()
    habit.history.forEach((h) => {
      const date = new Date(h.date)
      const day = date.getDay()
      const stats = dayStats.get(day) || { completed: 0, total: 0 }
      stats.total++
      if (h.completed) stats.completed++
      dayStats.set(day, stats)
    })

    dayStats.forEach((stats, day) => {
      if (stats.total >= 3) {
        const skipRate = Math.round(((stats.total - stats.completed) / stats.total) * 100)
        if (skipRate > 50) {
          dayPatterns.push({
            habit: habit.name,
            day: dayNames[day],
            skipRate,
          })
        }
      }
    })

    // Time-based consistency for habits with scheduled times
    if (habit.scheduledTime) {
      const consistency = calculateConsistency(habit.history, 30)
      if (consistency > 70) {
        timePatterns.push({
          habit: habit.name,
          time: habit.scheduledTime,
          consistency,
        })
      }
    }

    // Category insights
    if (habit.category) {
      const stats = categoryMap.get(habit.category) || { total: 0, count: 0 }
      stats.total += calculateConsistency(habit.history, 30)
      stats.count++
      categoryMap.set(habit.category, stats)
    }
  })

  const categoryInsights = Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    avgConsistency: Math.round(stats.total / stats.count),
  }))

  return { dayPatterns, timePatterns, categoryInsights }
}

export function HabitStats({ habits }: HabitStatsProps) {
  const totalCompletions = habits.reduce((sum, h) => sum + h.history.filter((x) => x.completed).length, 0)
  const bestStreak = Math.max(...habits.map((h) => h.longestStreak), 0)
  const avgWeeklyConsistency =
    habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + calculateConsistency(h.history, 7), 0) / habits.length)
      : 0
  const avg30DayConsistency =
    habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + calculateConsistency(h.history, 30), 0) / habits.length)
      : 0

  // Recovery View - find habits that were recently missed
  const habitsWithRecovery = habits
    .map((h) => ({
      ...h,
      recovery: calculateRecoveryRate(h),
      daysSinceLastMiss: h.history.findIndex((x) => !x.completed),
    }))
    .filter((h) => h.recovery && h.pausedDays > 0)

  const { dayPatterns, timePatterns, categoryInsights } = detectPatterns(habits)

  const bestHabit =
    habits.length > 0
      ? habits.reduce((best, current) => {
        const currentConsistency = calculateConsistency(current.history, 30)
        const bestConsistency = calculateConsistency(best.history, 30)
        return currentConsistency > bestConsistency ? current : best
      })
      : null

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Your Progress</h2>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Completions</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{totalCompletions}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Best Streak</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{bestStreak} days</p>
            </div>
            <div className="rounded-full bg-orange-500/10 p-2">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">7-Day Consistency</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{avgWeeklyConsistency}%</p>
            </div>
            <div className="rounded-full bg-green-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">30-Day Consistency</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{avg30DayConsistency}%</p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-2">
              <Award className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {bestHabit && calculateConsistency(bestHabit.history, 30) > 60 && (
        <Card className="mb-6 border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Best Performing Habit</h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{bestHabit.name}</span> with{" "}
                {calculateConsistency(bestHabit.history, 30)}% consistency over the last 30 days
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recovery View */}
      {habitsWithRecovery.length > 0 && (
        <Card className="mb-6 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Recovery Insights</h3>
          </div>
          <div className="space-y-2">
            {habitsWithRecovery.map((habit) => (
              <div key={habit.id} className="text-sm">
                <span className="font-medium text-foreground">{habit.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Last time you missed, you resumed within {habit.recovery}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(dayPatterns.length > 0 || timePatterns.length > 0 || categoryInsights.length > 0) && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Honest Insights</h3>
          </div>
          <div className="space-y-3">
            {dayPatterns.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pattern Detection
                </p>
                <div className="space-y-1.5">
                  {dayPatterns.slice(0, 3).map((pattern, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      You tend to skip <span className="font-medium text-foreground">{pattern.habit}</span> on{" "}
                      <span className="font-medium text-foreground">{pattern.day}s</span> ({pattern.skipRate}% skip
                      rate)
                    </p>
                  ))}
                </div>
              </div>
            )}

            {timePatterns.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Time-Based Strength
                </p>
                <div className="space-y-1.5">
                  {timePatterns.slice(0, 2).map((pattern, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{pattern.habit}</span> is strongest at{" "}
                      {pattern.time} ({pattern.consistency}% consistent)
                    </p>
                  ))}
                </div>
              </div>
            )}

            {categoryInsights.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Category Performance
                </p>
                <div className="space-y-1.5">
                  {categoryInsights
                    .sort((a, b) => b.avgConsistency - a.avgConsistency)
                    .map((insight, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{insight.category}</span> habits:{" "}
                        {insight.avgConsistency}% average consistency
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </section>
  )
}
