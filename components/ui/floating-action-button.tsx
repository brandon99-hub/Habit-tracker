"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface FloatingActionButtonProps {
    icon: LucideIcon
    onClick: () => void
    position?: "bottom-right" | "bottom-left" | "bottom-center"
    gradient?: "primary" | "success" | "warning" | "info"
    label?: string
    className?: string
}

const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
}

const gradientClasses = {
    primary: "gradient-primary",
    success: "gradient-success",
    warning: "gradient-warning",
    info: "gradient-info",
}

export function FloatingActionButton({
    icon: Icon,
    onClick,
    position = "bottom-right",
    gradient = "primary",
    label,
    className,
}: FloatingActionButtonProps) {
    return (
        <Button
            onClick={onClick}
            size="lg"
            className={cn(
                "fixed z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110",
                gradientClasses[gradient],
                positionClasses[position],
                label && "w-auto px-6 gap-2",
                "text-white border-0",
                className
            )}
        >
            <Icon className="h-6 w-6" />
            {label && <span className="font-medium">{label}</span>}
        </Button>
    )
}
