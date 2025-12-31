
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

    const originalDate = parseISO(originalDueDate)
    const pattern = recurring.pattern

    // Task should only appear on or after the original due date
    // We compare strings to avoid time zone issues where possible, 
    // or just ensure we're comparing dates correctly.
    // Simple verification: if date is before original date (ignoring time), return false.
    // Using start of day comparison is safest.
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)

    const originalStart = new Date(originalDate)
    originalStart.setHours(0, 0, 0, 0)

    if (dateStart < originalStart) return false

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
            // Show on the same day of every month
            return date.getDate() === originalDate.getDate()

        default:
            return false
    }
}
