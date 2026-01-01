"use client"

import { useSwipeable } from "react-swipeable"
import { Card } from "@/components/ui/card"
import { ReactNode, useState } from "react"
import { Trash2, CheckCircle2 } from "lucide-react"

interface SwipeableTaskCardProps {
    taskId: string
    onSwipeLeft: (taskId: string) => void
    onSwipeRight: (taskId: string) => void
    onClick: () => void
    className?: string
    children: ReactNode
}

export function SwipeableTaskCard({
    taskId,
    onSwipeLeft,
    onSwipeRight,
    onClick,
    className,
    children,
}: SwipeableTaskCardProps) {
    const [dragOffset, setDragOffset] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)

    const SWIPE_THRESHOLD = 0.4 // 40% of card width

    const swipeHandlers = useSwipeable({
        onSwiping: (eventData) => {
            setIsSwiping(true)
            // Limit drag to reasonable bounds
            const offset = Math.max(-200, Math.min(200, eventData.deltaX))
            setDragOffset(offset)
        },
        onSwiped: (eventData) => {
            const cardWidth = 300 // Approximate card width
            const swipeDistance = Math.abs(eventData.deltaX)
            const swipePercentage = swipeDistance / cardWidth

            if (swipePercentage >= SWIPE_THRESHOLD) {
                // Trigger action
                if (eventData.deltaX < 0) {
                    // Swiped left - delete
                    onSwipeLeft(taskId)
                } else {
                    // Swiped right - complete
                    onSwipeRight(taskId)
                }
            }

            // Reset position
            setDragOffset(0)
            setIsSwiping(false)
        },
        trackMouse: false,
        preventScrollOnSwipe: true,
    })

    const handleClick = (e: React.MouseEvent) => {
        if (!isSwiping && dragOffset === 0) {
            onClick()
        }
    }

    // Calculate opacity based on drag distance
    const getBackgroundOpacity = () => {
        return Math.min(Math.abs(dragOffset) / 150, 1)
    }

    return (
        <div className="relative overflow-hidden rounded-lg">
            {/* Background indicators */}
            <div className="absolute inset-0 flex items-center justify-between px-6">
                {/* Complete indicator (right swipe) */}
                <div
                    className="flex items-center gap-2 text-green-500 transition-opacity"
                    style={{ opacity: dragOffset > 0 ? getBackgroundOpacity() : 0 }}
                >
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="font-semibold">Complete</span>
                </div>

                {/* Delete indicator (left swipe) */}
                <div
                    className="flex items-center gap-2 text-red-500 transition-opacity ml-auto"
                    style={{ opacity: dragOffset < 0 ? getBackgroundOpacity() : 0 }}
                >
                    <span className="font-semibold">Delete</span>
                    <Trash2 className="h-6 w-6" />
                </div>
            </div>

            {/* Card */}
            <Card
                {...swipeHandlers}
                className={className}
                onClick={handleClick}
                style={{
                    transform: `translateX(${dragOffset}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {children}
            </Card>
        </div>
    )
}
