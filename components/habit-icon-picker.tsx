"use client"

import { useState } from "react"
import { HabitIcon, HABIT_ICONS, type HabitIconName } from "./habit-icon"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "@/lib/utils"

interface HabitIconPickerProps {
    value: HabitIconName
    onChange: (icon: HabitIconName) => void
}

export function HabitIconPicker({ value, onChange }: HabitIconPickerProps) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-start gap-2"
                >
                    <HabitIcon name={value} className="h-4 w-4" />
                    <span className="flex-1 text-left">{value}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2">
                <div className="grid grid-cols-5 gap-2">
                    {HABIT_ICONS.map((iconName) => (
                        <Button
                            key={iconName}
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-12 w-full flex flex-col items-center justify-center gap-1 p-1",
                                value === iconName && "bg-accent"
                            )}
                            onClick={() => {
                                onChange(iconName)
                                setOpen(false)
                            }}
                        >
                            <HabitIcon name={iconName} className="h-5 w-5" />
                            <span className="text-[10px] leading-none truncate w-full text-center">
                                {iconName}
                            </span>
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
