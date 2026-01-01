"use client"

import { useSwipeable } from "react-swipeable"
import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

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
    const swipeHandlers = useSwipeable({
        onSwipedLeft: (e) => {
            e.event.stopPropagation()
            onSwipeLeft(taskId)
        },
        onSwipedRight: (e) => {
            e.event.stopPropagation()
            onSwipeRight(taskId)
        },
        trackMouse: false,
        preventScrollOnSwipe: true,
    })

    return (
        <Card {...swipeHandlers} className={className} onClick={onClick}>
            {children}
        </Card>
    )
}
