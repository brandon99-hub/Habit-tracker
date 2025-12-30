"use client"

import { useState } from "react"
import { Home, BarChart3, BookOpen, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "today" | "stats" | "reflections" | "settings"

interface MobileNavProps {
    activeTab: Tab
    onTabChange: (tab: Tab) => void
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
    const tabs = [
        { id: "today" as Tab, label: "Today", icon: Home },
        { id: "stats" as Tab, label: "Stats", icon: BarChart3 },
        { id: "reflections" as Tab, label: "Reflect", icon: BookOpen },
        { id: "settings" as Tab, label: "Settings", icon: Settings },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-safe md:hidden">
            <div className="grid grid-cols-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex flex-col items-center gap-1 py-3 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
