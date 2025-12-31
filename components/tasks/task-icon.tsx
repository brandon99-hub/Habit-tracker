import {
    FileText,
    CheckCircle2,
    Target,
    Lightbulb,
    Flame,
    Star,
    Pin,
    Rocket,
    Zap,
    Heart,
    Trophy,
    Flag,
    Bookmark,
    Clock,
    Mail,
    type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, LucideIcon> = {
    FileText,
    CheckCircle2,
    Target,
    Lightbulb,
    Flame,
    Star,
    Pin,
    Rocket,
    Zap,
    Heart,
    Trophy,
    Flag,
    Bookmark,
    Clock,
    Mail,
}

interface TaskIconProps {
    iconName?: string | null
    className?: string
}

export function TaskIcon({ iconName, className }: TaskIconProps) {
    if (!iconName) return null

    // Check if it's a Lucide icon name
    const Icon = iconMap[iconName]

    if (Icon) {
        return <Icon className={cn("h-5 w-5", className)} />
    }

    // Fallback to emoji/text
    return <span className={className}>{iconName}</span>
}
