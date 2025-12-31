"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
    illustration?: "tasks" | "calendar" | "search" | "generic"
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
        icon?: LucideIcon
    }
    className?: string
}

export function EmptyState({
    illustration = "generic",
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
            {/* Illustration placeholder - can be replaced with actual SVG illustrations */}
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="text-6xl opacity-50">
                    {illustration === "tasks" && "📝"}
                    {illustration === "calendar" && "📅"}
                    {illustration === "search" && "🔍"}
                    {illustration === "generic" && "✨"}
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-md mb-6">{description}</p>

            {action && (
                <Button
                    onClick={action.onClick}
                    className="gap-2 gradient-primary text-white hover:opacity-90"
                >
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                </Button>
            )}
        </div>
    )
}
