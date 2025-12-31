"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"

interface BottomNavItem {
    icon: LucideIcon
    label: string
    href: string
}

interface BottomNavProps {
    items: BottomNavItem[]
    className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
    const pathname = usePathname()

    return (
        <nav className={cn(
            "mobile-bottom-nav bg-card border-t border-border pb-safe",
            "md:hidden", // Only show on mobile
            className
        )}>
            <div className="flex items-center justify-around h-16">
                {items.map((item) => {
                    // Use exact match for specific routes to prevent home from always being active
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
                                "min-w-[64px]",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "relative",
                                isActive && "animate-pulse-glow"
                            )}>
                                <Icon className={cn(
                                    "h-6 w-6 transition-transform",
                                    isActive && "scale-110"
                                )} />
                                {isActive && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </div>
                            <span className={cn(
                                "text-xs font-medium",
                                isActive && "font-semibold"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
