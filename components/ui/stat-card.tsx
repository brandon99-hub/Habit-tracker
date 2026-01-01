"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

type GradientVariant = "primary" | "success" | "warning" | "info"

interface StatCardProps {
    title: string
    value: number | string
    icon: LucideIcon
    gradient?: GradientVariant
    trend?: string
    className?: string
    style?: React.CSSProperties
}

const gradientClasses: Record<GradientVariant, string> = {
    primary: "from-purple-500 to-pink-500",
    success: "from-green-500 to-blue-500",
    warning: "from-orange-500 to-red-500",
    info: "from-blue-500 to-purple-500",
}

export function StatCard({
    title,
    value,
    icon: Icon,
    gradient = "primary",
    trend,
    className,
    style,
}: StatCardProps) {
    return (
        <Card className={cn("p-3 sm:p-6 hover-lift", className)} style={style}>
            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1 w-full">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
                    <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold">{value}</p>
                    {trend && (
                        <p className="mt-0.5 sm:mt-1 text-xs text-muted-foreground">{trend}</p>
                    )}
                </div>

                <div className={cn(
                    "rounded-lg bg-gradient-to-br p-2 sm:p-3 self-end sm:self-auto",
                    gradientClasses[gradient]
                )}>
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
            </div>
        </Card>
    )
}
