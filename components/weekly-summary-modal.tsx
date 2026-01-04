"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Trophy, Star, TrendingUp, X } from "lucide-react"
import Confetti from "react-confetti"
import { useWindowSize } from "@/hooks/use-window-size"

type WeeklySummaryData = {
    totalCompletions: number
    completionRate: number
    longestStreak: number
    longestStreakHabit: string
    perfectDays: number
    mostConsistentHabit: string
    mostConsistentRate: number
}

type WeeklySummaryModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: WeeklySummaryData
}

export function WeeklySummaryModal({ open, onOpenChange, data }: WeeklySummaryModalProps) {
    const [currentCard, setCurrentCard] = useState(0)
    const { width, height } = useWindowSize()
    const [showConfetti, setShowConfetti] = useState(true)

    const cards = [
        {
            icon: Sparkles,
            title: "You completed",
            value: data.totalCompletions,
            subtitle: "habits",
            description: `this week! That's ${data.completionRate}% of your goals.`,
            color: "from-purple-500 to-pink-500",
        },
        {
            icon: Trophy,
            title: "🔥 Your longest streak:",
            value: data.longestStreak,
            subtitle: "days",
            description: `on ${data.longestStreakHabit}`,
            color: "from-orange-500 to-red-500",
        },
        {
            icon: Star,
            title: "⭐ You had",
            value: data.perfectDays,
            subtitle: "perfect days",
            description: "where you completed ALL your habits!",
            color: "from-yellow-500 to-amber-500",
        },
        {
            icon: TrendingUp,
            title: "🏆 Most consistent habit:",
            value: data.mostConsistentHabit,
            subtitle: "",
            description: `Completed ${data.mostConsistentRate}% of the time`,
            color: "from-green-500 to-emerald-500",
        },
    ]

    const handleNext = () => {
        if (currentCard < cards.length - 1) {
            setCurrentCard(currentCard + 1)
        } else {
            onOpenChange(false)
        }
    }

    const handlePrevious = () => {
        if (currentCard > 0) {
            setCurrentCard(currentCard - 1)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                {showConfetti && (
                    <Confetti
                        width={width}
                        height={height}
                        recycle={false}
                        numberOfPieces={200}
                        onConfettiComplete={() => setShowConfetti(false)}
                    />
                )}

                <div className="relative">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 z-10 h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center text-white">
                        <h2 className="text-3xl font-bold mb-2">🎉 Your Week in Habits 🎉</h2>
                        <p className="text-sm opacity-90">Keep up the amazing work!</p>
                    </div>

                    {/* Card carousel */}
                    <div className="p-8 min-h-[400px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentCard}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <Card className={`p-8 text-center relative overflow-hidden`}>
                                    {/* Gradient background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${cards[currentCard].color} opacity-10`} />

                                    {/* Content */}
                                    <div className="relative z-10 space-y-4">
                                        <p className="text-lg text-muted-foreground">{cards[currentCard].title}</p>
                                        <div>
                                            <p className="text-6xl font-bold gradient-text mb-2">
                                                {cards[currentCard].value}
                                            </p>
                                            {cards[currentCard].subtitle && (
                                                <p className="text-xl text-muted-foreground">{cards[currentCard].subtitle}</p>
                                            )}
                                        </div>
                                        <p className="text-base text-muted-foreground">{cards[currentCard].description}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="p-6 flex items-center justify-between border-t">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentCard === 0}
                        >
                            Previous
                        </Button>

                        {/* Progress dots */}
                        <div className="flex gap-2">
                            {cards.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full transition-all ${i === currentCard ? "bg-primary w-6" : "bg-muted"
                                        }`}
                                />
                            ))}
                        </div>

                        <Button onClick={handleNext}>
                            {currentCard === cards.length - 1 ? "Finish" : "Next"}
                        </Button>
                    </div>

                    {/* Footer message */}
                    {currentCard === cards.length - 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-8 pb-6 text-center"
                        >
                            <p className="text-2xl font-bold gradient-text">Keep up the amazing work! 💪</p>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
