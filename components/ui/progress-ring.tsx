"use client"

import { cn } from "@/lib/utils"

interface ProgressRingProps {
    progress: number // 0-100
    size?: "sm" | "md" | "lg" | "xl"
    color?: "primary" | "success" | "warning" | "info"
    showLabel?: boolean
    className?: string
}

const sizeClasses = {
    sm: { ring: "h-12 w-12", stroke: 3, text: "text-xs" },
    md: { ring: "h-16 w-16", stroke: 4, text: "text-sm" },
    lg: { ring: "h-24 w-24", stroke: 5, text: "text-base" },
    xl: { ring: "h-32 w-32", stroke: 6, text: "text-lg" },
}

const colorClasses = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
}

export function ProgressRing({
    progress,
    size = "md",
    color = "primary",
    showLabel = true,
    className,
}: ProgressRingProps) {
    const { ring, stroke, text } = sizeClasses[size]
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference

    return (
        <div className={cn("relative inline-flex items-center justify-center", ring, className)}>
            <svg className="h-full w-full -rotate-90 transform">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="none"
                    className="text-muted opacity-20"
                />
                {/* Progress circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-500 ease-out", colorClasses[color])}
                />
            </svg>

            {showLabel && (
                <span className={cn("absolute font-semibold", text, colorClasses[color])}>
                    {Math.round(progress)}%
                </span>
            )}
        </div>
    )
}
