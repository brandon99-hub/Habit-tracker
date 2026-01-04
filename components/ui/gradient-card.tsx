import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
    gradient?: "card" | "primary" | "success" | "warning" | "danger"
    hover?: "lift" | "glow" | "none"
    children: React.ReactNode
}

export function GradientCard({
    gradient = "card",
    hover = "none",
    className,
    children,
    ...props
}: GradientCardProps) {
    const gradientClasses = {
        card: "bg-card",
        primary: "bg-gradient-to-br from-primary/10 to-primary/5",
        success: "bg-gradient-to-br from-green-500/10 to-green-500/5",
        warning: "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5",
        danger: "bg-gradient-to-br from-red-500/10 to-red-500/5",
    }

    const hoverClasses = {
        none: "",
        lift: "transition-transform hover:-translate-y-1 hover:shadow-lg",
        glow: "transition-shadow hover:shadow-xl hover:shadow-primary/20",
    }

    return (
        <Card
            className={cn(
                gradientClasses[gradient],
                hoverClasses[hover],
                "transition-all duration-200",
                className
            )}
            {...props}
        >
            {children}
        </Card>
    )
}
