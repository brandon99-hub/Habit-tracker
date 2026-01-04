"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart3, BookOpen, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    const tabs = [
        { label: "Today", icon: Home, href: "/" },
        { label: "Stats", icon: BarChart3, href: "/stats" },
        { label: "Reflect", icon: BookOpen, href: "/reflections" },
        { label: "Settings", icon: Settings, href: "/settings" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-safe md:hidden">
            <div className="grid grid-cols-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = pathname === tab.href

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center gap-1 py-3 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
