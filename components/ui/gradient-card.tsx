"use client"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type GradientVariant = "primary" | "success" | "warning" | "info" | "card"

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
    gradient?: GradientVariant
    hover?: "lift" | "scale" | "glow" | "none"
    children: React.ReactNode
}

const gradientClasses: Record<GradientVariant, string> = {
    primary: "gradient-primary",
    success: "gradient-success",
    warning: "gradient-warning",
    info: "gradient-info",
    card: "gradient-card",
}

const hoverClasses: Record<string, string> = {
    lift: "hover-lift",
    scale: "hover-scale",
    glow: "hover-glow",
    none: "",
}

export function GradientCard({
    gradient = "card",
    hover = "lift",
    className,
    children,
    ...props
}: GradientCardProps) {
    return (
        <Card
            className={cn(
                "relative overflow-hidden",
                hoverClasses[hover],
                className
            )}
            {...props}
        >
            {/* Gradient overlay */}
            <div className={cn("absolute inset-0 opacity-10", gradientClasses[gradient])} />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </Card>
    )
}
