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
    color: string
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
            color: "from-blue-500 to-blue-600",
        },
        {
            icon: Flame,
            label: "Current Streak",
            value: `${currentStreak} days`,
            color: "from-orange-500 to-orange-600",
        },
        {
            icon: TrendingUp,
            label: "7-Day Rate",
            value: `${sevenDayRate}%`,
            color: "from-green-500 to-green-600",
        },
        // Set B (3-5)
        {
            icon: Star,
            label: "Perfect Days",
            value: perfectDays,
            color: "from-yellow-500 to-yellow-600",
        },
        {
            icon: Dumbbell,
            label: "30-Day Consistency",
            value: `${thirtyDayConsistency}%`,
            color: "from-purple-500 to-purple-600",
        },
        {
            icon: Trophy,
            label: "Best Habit",
            value: bestHabit,
            color: "from-amber-500 to-amber-600",
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
                            <Card className="p-6 relative overflow-hidden">
                                {/* Gradient background */}
                                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", card.color)} />

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <Icon className={cn("h-8 w-8 bg-gradient-to-br bg-clip-text text-transparent", card.color)} />
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                                    <p className="text-3xl font-bold">{card.value}</p>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
