"use client"

import { useRef, useState, TouchEvent } from "react"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

interface SwipeableHabitCardProps {
    children: React.ReactNode
    onSwipeRight: () => void
    onSwipeLeft?: () => void
    disabled?: boolean
}

export function SwipeableHabitCard({
    children,
    onSwipeRight,
    onSwipeLeft,
    disabled = false,
}: SwipeableHabitCardProps) {
    const [touchStart, setTouchStart] = useState(0)
    const [touchEnd, setTouchEnd] = useState(0)
    const [swipeOffset, setSwipeOffset] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const minSwipeDistance = 100

    const handleTouchStart = (e: TouchEvent) => {
        if (disabled) return
        setTouchEnd(0)
        setTouchStart(e.targetTouches[0].clientX)
        setIsSwiping(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
        if (disabled || !isSwiping) return
        const currentTouch = e.targetTouches[0].clientX
        const offset = currentTouch - touchStart

        // Limit swipe distance
        const maxOffset = 150
        const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset))

        setSwipeOffset(limitedOffset)
        setTouchEnd(currentTouch)
    }

    const handleTouchEnd = () => {
        if (disabled || !isSwiping) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isRightSwipe) {
            // Swipe right - mark as done
            onSwipeRight()
        } else if (isLeftSwipe && onSwipeLeft) {
            // Swipe left - skip/dismiss
            onSwipeLeft()
        }

        // Reset
        setSwipeOffset(0)
        setIsSwiping(false)
    }

    const getBackgroundColor = () => {
        if (swipeOffset > 50) return "bg-green-500/20"
        if (swipeOffset < -50) return "bg-red-500/20"
        return ""
    }

    return (
        <div className="relative overflow-hidden rounded-lg">
            {/* Swipe indicators */}
            {swipeOffset > 20 && (
                <div className="absolute left-4 top-1/2 z-0 flex -translate-y-1/2 items-center gap-2 text-green-600">
                    <Check className="h-6 w-6" />
                    <span className="text-sm font-medium">Complete</span>
                </div>
            )}
            {swipeOffset < -20 && onSwipeLeft && (
                <div className="absolute right-4 top-1/2 z-0 flex -translate-y-1/2 items-center gap-2 text-red-600">
                    <span className="text-sm font-medium">Skip</span>
                    <X className="h-6 w-6" />
                </div>
            )}

            {/* Card content */}
            <div
                ref={cardRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`relative z-10 transition-transform ${getBackgroundColor()}`}
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isSwiping ? "none" : "transform 0.3s ease-out",
                }}
            >
                {children}
            </div>
        </div>
    )
}
