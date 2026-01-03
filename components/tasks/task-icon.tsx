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
    // Additional icons for Quick Add
    Circle,
    CheckCircle,
    Sparkles,
    Award,
    Calendar,
    Bell,
    MessageSquare,
    Phone,
    Briefcase,
    Clipboard,
    Folder,
    Package,
    ShoppingCart,
    type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, LucideIcon> = {
    FileText,
    CheckCircle2,
    CheckCircle,
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
    // Quick Add icons
    Circle,
    Sparkles,
    Award,
    Calendar,
    Bell,
    MessageSquare,
    Phone,
    Briefcase,
    Clipboard,
    Folder,
    Package,
    ShoppingCart,
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
