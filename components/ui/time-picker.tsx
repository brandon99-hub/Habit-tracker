"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    date?: Date
    onChange?: (date: Date) => void
    value?: string // HH:mm format
    onTimeChange?: (time: string) => void
    className?: string
}

export function TimePicker({ date, onChange, value, onTimeChange, className }: TimePickerProps) {
    // Generate time options in 30 minute intervals
    const timeOptions = React.useMemo(() => {
        const options = []
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) {
                const hour = i.toString().padStart(2, "0")
                const minute = j.toString().padStart(2, "0")
                options.push(`${hour}:${minute}`)
            }
        }
        return options
    }, [])

    const handleValueChange = (newTime: string) => {
        if (onTimeChange) {
            onTimeChange(newTime)
        }

        if (date && onChange) {
            const [hours, minutes] = newTime.split(":").map(Number)
            const newDate = new Date(date)
            newDate.setHours(hours)
            newDate.setMinutes(minutes)
            onChange(newDate)
        }
    }

    // Determine current value
    let currentTime = value
    if (!currentTime && date) {
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        currentTime = `${hours}:${minutes}`
    }

    // Find nearest option if exact time isn't in list (for display)
    // Actually, select might handle custom values if editable, but let's stick to select for now.
    // If the time is 14:32, it won't match 14:30. 
    // Ideally we just show the value.

    return (
        <Select value={currentTime} onValueChange={handleValueChange}>
            <SelectTrigger className={cn("w-[120px]", className)}>
                <Clock className="mr-2 h-4 w-4 opacity-50" />
                <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent className="h-[200px]">
                {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                        {time}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
