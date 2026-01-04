"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Target, Flame, TrendingUp, Star, Dumbbell, Trophy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type StatCardData = {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string | number
}

type RotatingStatCardsProps = {
    totalHabits: number
    currentStreak: number
    sevenDayRate: number
    perfectDays: number
    thirtyDayConsistency: number
    bestHabit: string
}

export function RotatingStatCards({
    totalHabits,
    currentStreak,
    sevenDayRate,
    perfectDays,
    thirtyDayConsistency,
    bestHabit,
}: RotatingStatCardsProps) {
    const [currentSet, setCurrentSet] = useState(0)

    const STAT_CARDS: StatCardData[] = [
        // Set A (0-2)
        {
            icon: Target,
            label: "Total Habits",
            value: totalHabits,
        },
        {
            icon: Flame,
            label: "Current Streak",
            value: `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`,
        },
        {
            icon: TrendingUp,
            label: "7-Day Rate",
            value: `${sevenDayRate}%`,
        },
        // Set B (3-5)
        {
            icon: Star,
            label: "Perfect Days",
            value: perfectDays,
        },
        {
            icon: Dumbbell,
            label: "30-Day Consistency",
            value: `${thirtyDayConsistency}%`,
        },
        {
            icon: Trophy,
            label: "Best Habit",
            value: bestHabit,
        },
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSet((prev) => (prev + 1) % 2) // Toggle between 0 and 1
        }, 5000) // 5 seconds

        return () => clearInterval(interval)
    }, [])

    const visibleCards = currentSet === 0 ? STAT_CARDS.slice(0, 3) : STAT_CARDS.slice(3, 6)

    return (
        <div className="grid grid-cols-3 gap-4">
            <AnimatePresence mode="wait">
                {visibleCards.map((card, i) => {
                    const Icon = card.icon
                    return (
                        <motion.div
                            key={`${currentSet}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <Card className="p-2.5 h-32 flex flex-col overflow-hidden">
                                {/* Icon at top left */}
                                <div className="mb-2">
                                    <div className="inline-flex p-2 rounded-lg bg-primary/10">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1 font-medium truncate">{card.label}</p>
                                    <p className="text-xl font-bold text-primary truncate" title={String(card.value)}>{card.value}</p>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
