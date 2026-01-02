
import { parseISO } from "date-fns"

/**
 * Determines if a recurring task should show on a given date
 * @param date The calendar date checking for tasks
 * @param originalDueDate The original due date of the task (string YYYY-MM-DD or ISO)
 * @param recurring The recurring configuration object { pattern, config, ... }
 * @returns boolean
 */
export const shouldShowRecurringTask = (date: Date, originalDueDate: string, recurring: any) => {
    if (!originalDueDate) return false

    // Check if recurrence has ended
    if (recurring.end_date && date > new Date(recurring.end_date)) {
        return false
    }

    // Check occurrence count limit
    if (recurring.occurrence_count &&
        recurring.occurrences_completed >= recurring.occurrence_count) {
        return false
    }

    const originalDate = parseISO(originalDueDate)
    const pattern = recurring.pattern

    // Task should only appear on or after the original due date
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)

    const originalStart = new Date(originalDate)
    originalStart.setHours(0, 0, 0, 0)

    if (dateStart < originalStart) return false

    // Skip weekends check
    if (recurring.skip_weekends) {
        const day = date.getDay()
        if (day === 0 || day === 6) return false
    }

    switch (pattern) {
        case "daily":
            return true // Show every day after start date

        case "weekdays":
            const day = date.getDay()
            return day >= 1 && day <= 5 // Monday-Friday

        case "weekly":
            const config = recurring.config || {}
            // If explicit days are set, use them. Otherwise default to original day of week.
            const daysOfWeek = recurring.days_of_week || config.days || [originalDate.getDay()]
            return daysOfWeek.includes(date.getDay())

        case "monthly":
            // Handle month position
            if (recurring.month_position === 'start') {
                return date.getDate() === 1
            } else if (recurring.month_position === 'end') {
                // Check if this is the last day of the month
                const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
                return date.getDate() === lastDay.getDate()
            } else {
                // Specific day of month
                const targetDay = recurring.day_of_month || originalDate.getDate()
                return date.getDate() === targetDay
            }

        default:
            return false
    }
}
