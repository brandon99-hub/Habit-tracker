import * as Icons from "lucide-react"

const HABIT_ICONS = [
    "Dumbbell", // Physical
    "Brain", // Mental
    "Palette", // Creative
    "Users", // Social
    "Briefcase", // Work
    "Book", // Learning
    "Heart", // Health
    "Coffee", // Daily routine
    "Moon", // Sleep
    "Apple", // Nutrition
    "Bike", // Exercise
    "Music", // Hobbies
    "Camera", // Photography
    "Code", // Programming
    "Pen", // Writing
    "Target", // Goals
    "Zap", // Energy
    "Sparkles", // Habits
    "CheckCircle", // Completion
    "Star", // Achievement
] as const

export type HabitIconName = (typeof HABIT_ICONS)[number]

interface HabitIconProps {
    name: HabitIconName
    className?: string
}

export function HabitIcon({ name, className = "h-4 w-4" }: HabitIconProps) {
    const IconComponent = Icons[name] as React.ComponentType<{ className?: string }>

    if (!IconComponent) {
        return <Icons.Circle className={className} />
    }

    return <IconComponent className={className} />
}

export { HABIT_ICONS }
