"use client"

import { useHabits } from "@/hooks/use-habits"
import { HabitStats } from "@/components/habit-stats"
import { HabitLineGraph } from "@/components/habit-line-graph"
import { RotatingStatCards } from "@/components/rotating-stat-cards"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { useMemo } from "react"

export default function StatsPage() {
    const router = useRouter()
    const { habits, loading } = useHabits()

    const activeHabits = habits.filter((h) => !h.archived)

    // Calculate stats for rotating cards - MUST be before any early returns
    const stats = useMemo(() => {
        const totalHabits = activeHabits.length
        const currentStreak = Math.max(...activeHabits.map(h => h.currentStreak), 0)

        // 7-day completion rate
        const last7Days = activeHabits.reduce((sum, habit) => {
            const completedLast7 = habit.history.filter(h => {
                const date = new Date(h.date)
                const daysDiff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
                return daysDiff < 7 && h.completed
            }).length
            return sum + completedLast7
        }, 0)
        const sevenDayRate = totalHabits > 0 ? Math.round((last7Days / (totalHabits * 7)) * 100) : 0

        // Perfect days (all habits completed)
        const perfectDays = 0 // TODO: Calculate from history

        // 30-day consistency
        const last30Days = activeHabits.reduce((sum, habit) => {
            const completedLast30 = habit.history.filter(h => {
                const date = new Date(h.date)
                const daysDiff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
                return daysDiff < 30 && h.completed
            }).length
            return sum + completedLast30
        }, 0)
        const thirtyDayConsistency = totalHabits > 0 ? Math.round((last30Days / (totalHabits * 30)) * 100) : 0

        // Best performing habit
        const bestHabit = activeHabits.reduce((best, habit) => {
            return habit.currentStreak > (best?.currentStreak || 0) ? habit : best
        }, activeHabits[0])

        return {
            totalHabits,
            currentStreak,
            sevenDayRate,
            perfectDays,
            thirtyDayConsistency,
            bestHabit: bestHabit?.name || "None"
        }
    }, [activeHabits])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading stats...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Your Progress</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track your habits and celebrate wins
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                {/* Rotating Stat Cards */}
                <div className="mb-8">
                    <RotatingStatCards
                        totalHabits={stats.totalHabits}
                        currentStreak={stats.currentStreak}
                        sevenDayRate={stats.sevenDayRate}
                        perfectDays={stats.perfectDays}
                        thirtyDayConsistency={stats.thirtyDayConsistency}
                        bestHabit={stats.bestHabit}
                    />
                </div>

                {/* Line Graph */}
                <div className="mb-8">
                    <HabitLineGraph habits={activeHabits} />
                </div>

                {/* Existing Stats Component */}
                <HabitStats habits={activeHabits} />
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    )
}
