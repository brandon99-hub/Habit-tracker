import { parseISO, addDays, addWeeks, addMonths, startOfDay, setHours, setMinutes } from "date-fns"

export interface ParsedTask {
    title: string
    category?: string
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
    dueDate?: Date
    time?: string
    rawInput: string
}

/**
 * Parse task input with natural language support
 * Detects: @category, !priority, dates, times
 */
export function parseTaskInput(
    input: string,
    categories: Array<{ id: string; name: string; icon?: string | null }>
): ParsedTask {
    let remaining = input.trim()
    const parsed: Partial<ParsedTask> = { rawInput: input }

    // 1. Extract priority (!urgent, !high, !medium, !low)
    const priorityMatch = remaining.match(/!(urgent|high|medium|low)/i)
    if (priorityMatch) {
        const priority = priorityMatch[1].toLowerCase()
        parsed.priority = (priority.charAt(0).toUpperCase() + priority.slice(1)) as any
        remaining = remaining.replace(priorityMatch[0], '').trim()
    }

    // 2. Extract category (@Work or #Work)
    const categoryMatch = remaining.match(/[@#](\w+)/i)
    if (categoryMatch) {
        const categoryName = categoryMatch[1]
        const matchedCategory = categories.find(c =>
            c.name.toLowerCase() === categoryName.toLowerCase()
        )
        if (matchedCategory) {
            parsed.category = matchedCategory.id
        }
        remaining = remaining.replace(categoryMatch[0], '').trim()
    }

    // 3. Extract date and time
    const dateTimeResult = extractDateTime(remaining)
    if (dateTimeResult.date) {
        parsed.dueDate = dateTimeResult.date
        parsed.time = dateTimeResult.time ?? undefined
        remaining = dateTimeResult.cleanText
    }

    // 4. Remaining text is the title
    parsed.title = remaining.trim()

    return parsed as ParsedTask
}

/**
 * Extract date and time from text
 * Supports: today, tomorrow, next friday, in 3 days, at 2pm
 */
function extractDateTime(text: string): {
    date: Date | null
    time: string | null
    cleanText: string
} {
    let cleanText = text
    let date: Date | null = null
    let time: string | null = null

    // Extract time first (at 2pm, at 14:00, at 2:30pm)
    const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
        const meridiem = timeMatch[3]?.toLowerCase()

        // Convert to 24-hour format
        if (meridiem === 'pm' && hours !== 12) {
            hours += 12
        } else if (meridiem === 'am' && hours === 12) {
            hours = 0
        }

        time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        cleanText = cleanText.replace(timeMatch[0], '').trim()
    }

    // Extract date
    const now = new Date()
    let baseDate: Date | null = null

    // Today
    if (/\btoday\b/i.test(cleanText)) {
        baseDate = startOfDay(now)
        cleanText = cleanText.replace(/\btoday\b/i, '').trim()
    }
    // Tomorrow
    else if (/\btomorrow\b/i.test(cleanText)) {
        baseDate = startOfDay(addDays(now, 1))
        cleanText = cleanText.replace(/\btomorrow\b/i, '').trim()
    }
    // In X days/weeks/months
    else {
        const relativeMatch = cleanText.match(/in\s+(\d+)\s+(day|week|month)s?/i)
        if (relativeMatch) {
            const amount = parseInt(relativeMatch[1])
            const unit = relativeMatch[2].toLowerCase()

            if (unit === 'day') {
                baseDate = startOfDay(addDays(now, amount))
            } else if (unit === 'week') {
                baseDate = startOfDay(addWeeks(now, amount))
            } else if (unit === 'month') {
                baseDate = startOfDay(addMonths(now, amount))
            }

            cleanText = cleanText.replace(relativeMatch[0], '').trim()
        }
    }

    // Next [day of week]
    if (!baseDate) {
        const dayMatch = cleanText.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)
        if (dayMatch) {
            const targetDay = dayMatch[1].toLowerCase()
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            const targetDayIndex = days.indexOf(targetDay)
            const currentDayIndex = now.getDay()

            let daysToAdd = targetDayIndex - currentDayIndex
            if (daysToAdd <= 0) {
                daysToAdd += 7 // Next week
            }

            baseDate = startOfDay(addDays(now, daysToAdd))
            cleanText = cleanText.replace(dayMatch[0], '').trim()
        }
    }

    // Standalone day names: "monday", "on friday", "this sunday"
    if (!baseDate) {
        const standaloneDayMatch = cleanText.match(/\b(this\s+)?(on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
        if (standaloneDayMatch) {
            const targetDay = standaloneDayMatch[3].toLowerCase()
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            const targetDayIndex = days.indexOf(targetDay)
            const currentDayIndex = now.getDay()

            let daysToAdd = targetDayIndex - currentDayIndex

            // If day already passed this week, go to next week
            if (daysToAdd <= 0) {
                daysToAdd += 7
            }

            baseDate = startOfDay(addDays(now, daysToAdd))
            cleanText = cleanText.replace(standaloneDayMatch[0], '').trim()
        }
    }

    // Apply time to date if both exist
    if (baseDate && time) {
        const [hours, minutes] = time.split(':').map(Number)
        date = setMinutes(setHours(baseDate, hours), minutes)
    } else if (baseDate) {
        // Default to end of day if no time specified
        date = setMinutes(setHours(baseDate, 23), 59)
    }

    return { date, time, cleanText }
}

/**
 * Get smart suggestions for common task patterns
 */
export function getTaskSuggestions(input: string): string[] {
    const suggestions: string[] = []

    if (input.length < 3) return suggestions

    const lower = input.toLowerCase()

    // Common patterns
    if (lower.includes('meet')) {
        suggestions.push('Meeting tomorrow at 2pm !high')
    }
    if (lower.includes('call')) {
        suggestions.push('Call client today at 4pm')
    }
    if (lower.includes('review')) {
        suggestions.push('Review document in 2 days')
    }
    if (lower.includes('email')) {
        suggestions.push('Email team next monday')
    }

    return suggestions.slice(0, 3)
}
