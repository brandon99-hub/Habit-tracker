import { supabase } from "../supabase"

export type RecurringTask = {
    id: string
    page_id: string
    pattern: "daily" | "weekdays" | "weekly" | "monthly" | "custom" | "after_completion"
    config: {
        days?: number[] // 0-6 for Sunday-Saturday
        time?: string // HH:MM format
        interval?: number
    }
    next_occurrence: string
    created_at: string
    // New fields for advanced patterns
    day_of_month?: number
    month_position?: "start" | "end" | "specific"
    recurrence_type?: "fixed" | "after_completion"
    skip_weekends?: boolean
    end_date?: string
    occurrence_count?: number
    occurrences_completed?: number
}

// Helper function: Get last day of month
function getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Helper function: Move date to next weekday if on weekend
function moveToNextWeekday(date: Date): Date {
    const newDate = new Date(date)
    const day = newDate.getDay()
    if (day === 0) { // Sunday
        newDate.setDate(newDate.getDate() + 1)
    } else if (day === 6) { // Saturday
        newDate.setDate(newDate.getDate() + 2)
    }
    return newDate
}

// Helper function: Check if recurrence should end
function shouldEndRecurrence(recurring: any): boolean {
    // Check end_date
    if (recurring.end_date && new Date() > new Date(recurring.end_date)) {
        return true
    }

    // Check occurrence_count
    if (recurring.occurrence_count &&
        recurring.occurrences_completed >= recurring.occurrence_count) {
        return true
    }

    return false
}

// Create a recurring task
export async function createRecurringTask(data: {
    page_id: string
    pattern: "daily" | "weekdays" | "weekly" | "monthly" | "custom" | "after_completion"
    interval?: number
    days_of_week?: number[] | null
    end_date?: string | null
    // New fields
    day_of_month?: number
    month_position?: "start" | "end" | "specific"
    recurrence_type?: "fixed" | "after_completion"
    skip_weekends?: boolean
    occurrence_count?: number
}) {
    console.log("[RECURRING] Creating recurring task with data:", JSON.stringify(data, null, 2))

    const config = {
        days: data.days_of_week || undefined,
        interval: data.interval || 1,
    }

    let nextOccurrence = calculateNextOccurrence(
        data.pattern as any,
        config,
        data.month_position,
        data.day_of_month
    )

    // Apply skip weekends if enabled
    if (data.skip_weekends && (nextOccurrence.getDay() === 0 || nextOccurrence.getDay() === 6)) {
        nextOccurrence = moveToNextWeekday(nextOccurrence)
    }

    console.log("[RECURRING] Calculated next occurrence:", nextOccurrence.toISOString())

    const insertData = {
        page_id: data.page_id,
        pattern: data.pattern,
        config,
        next_occurrence: nextOccurrence.toISOString(),
        end_date: data.end_date || null,
        // New fields
        day_of_month: data.day_of_month || null,
        month_position: data.month_position || null,
        recurrence_type: data.recurrence_type || "fixed",
        skip_weekends: data.skip_weekends || false,
        occurrence_count: data.occurrence_count || null,
        occurrences_completed: 0,
    }
    console.log("[RECURRING] Inserting into database:", JSON.stringify(insertData, null, 2))

    const { data: result, error } = await supabase
        .from("recurring_tasks")
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.error("[RECURRING] Error creating recurring task:")
        console.error("  Code:", error.code)
        console.error("  Message:", error.message)
        console.error("  Details:", error.details)
        console.error("  Hint:", error.hint)
        console.error("  Full error:", JSON.stringify(error, null, 2))
    } else {
        console.log("[RECURRING] Successfully created recurring task:", result)
    }

    return { data: result, error }
}

// Get recurring task for a page
export async function getRecurringTask(pageId: string) {
    const { data, error } = await supabase
        .from("recurring_tasks")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle() // Use maybeSingle instead of single to avoid 406 errors

    return { data, error }
}

// Update recurring task
export async function updateRecurringTask(
    id: string,
    data: {
        page_id?: string
        pattern?: "daily" | "weekdays" | "weekly" | "monthly" | "custom" | "after_completion"
        interval?: number
        days_of_week?: number[] | null
        end_date?: string | null
        // New fields
        day_of_month?: number
        month_position?: "start" | "end" | "specific"
        recurrence_type?: "fixed" | "after_completion"
        skip_weekends?: boolean
        occurrence_count?: number
    }
) {
    console.log("[RECURRING] Updating recurring task:", id, "with data:", JSON.stringify(data, null, 2))

    const config = {
        days: data.days_of_week || undefined,
        interval: data.interval || 1,
    }

    let nextOccurrence = calculateNextOccurrence(
        (data.pattern || "daily") as any,
        config,
        data.month_position,
        data.day_of_month
    )

    // Apply skip weekends if enabled
    if (data.skip_weekends && (nextOccurrence.getDay() === 0 || nextOccurrence.getDay() === 6)) {
        nextOccurrence = moveToNextWeekday(nextOccurrence)
    }

    console.log("[RECURRING] Calculated next occurrence:", nextOccurrence.toISOString())

    const updateData: any = {
        pattern: data.pattern,
        config,
        next_occurrence: nextOccurrence.toISOString(),
        end_date: data.end_date || null,
    }

    // Add new fields if provided
    if (data.day_of_month !== undefined) updateData.day_of_month = data.day_of_month
    if (data.month_position !== undefined) updateData.month_position = data.month_position
    if (data.recurrence_type !== undefined) updateData.recurrence_type = data.recurrence_type
    if (data.skip_weekends !== undefined) updateData.skip_weekends = data.skip_weekends
    if (data.occurrence_count !== undefined) updateData.occurrence_count = data.occurrence_count

    const { data: result, error } = await supabase
        .from("recurring_tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

    if (error) {
        console.error("[RECURRING] Error updating recurring task:", error)
    } else {
        console.log("[RECURRING] Successfully updated recurring task:", result)
    }

    return { data: result, error }
}

// Delete recurring task
export async function deleteRecurringTask(id: string) {
    const { error } = await supabase.from("recurring_tasks").delete().eq("id", id)

    return { error }
}

// Calculate next occurrence based on pattern
function calculateNextOccurrence(
    pattern: "daily" | "weekdays" | "weekly" | "monthly" | "custom",
    config: { days?: number[]; time?: string; interval?: number },
    monthPosition?: "start" | "end" | "specific",
    dayOfMonth?: number
): Date {
    const now = new Date()
    const [hours, minutes] = (config.time || "09:00").split(":").map(Number)

    let next = new Date(now)
    next.setHours(hours, minutes, 0, 0)

    // If time has passed today, start from tomorrow
    if (next <= now) {
        next.setDate(next.getDate() + 1)
    }

    const interval = config.interval || 1

    switch (pattern) {
        case "daily":
            // Add interval days
            if (interval > 1) {
                next.setDate(next.getDate() + (interval - 1))
            }
            break

        case "weekdays":
            // Monday-Friday (1-5)
            while (next.getDay() === 0 || next.getDay() === 6) {
                next.setDate(next.getDate() + 1)
            }
            break

        case "weekly":
            // Add interval weeks
            next.setDate(next.getDate() + (7 * interval))
            break

        case "monthly":
            // Handle month position
            if (monthPosition === "start") {
                // First day of next month
                next.setMonth(next.getMonth() + interval)
                next.setDate(1)
            } else if (monthPosition === "end") {
                // Last day of next month
                next.setMonth(next.getMonth() + interval)
                const lastDay = getLastDayOfMonth(next)
                next.setDate(lastDay.getDate())
            } else {
                // Specific day of month
                const targetDay = dayOfMonth || next.getDate()
                next.setMonth(next.getMonth() + interval)

                // Handle months with fewer days (e.g., Feb 31 -> Feb 28)
                const lastDayOfMonth = getLastDayOfMonth(next)
                if (targetDay > lastDayOfMonth.getDate()) {
                    next.setDate(lastDayOfMonth.getDate())
                } else {
                    next.setDate(targetDay)
                }
            }
            break

        case "custom":
            // Find next matching day
            if (config.days && config.days.length > 0) {
                const currentDay = next.getDay()
                const sortedDays = [...config.days].sort((a, b) => a - b)

                // Find next day in the list
                let nextDay = sortedDays.find((day) => day > currentDay)

                if (nextDay === undefined) {
                    // Wrap to next week
                    nextDay = sortedDays[0]
                    next.setDate(next.getDate() + (7 - currentDay + nextDay))
                } else {
                    next.setDate(next.getDate() + (nextDay - currentDay))
                }
            }
            break
    }

    return next
}

// Update next occurrence after task completion
export async function updateNextOccurrence(recurringTaskId: string) {
    const { data: recurring } = await supabase
        .from("recurring_tasks")
        .select("*")
        .eq("id", recurringTaskId)
        .single()

    if (!recurring) return { error: "Recurring task not found" }

    const nextOccurrence = calculateNextOccurrence(recurring.pattern, recurring.config)

    const { data, error } = await supabase
        .from("recurring_tasks")
        .update({
            next_occurrence: nextOccurrence.toISOString(),
        })
        .eq("id", recurringTaskId)
        .select()
        .single()

    return { data, error }
}

// Check and create tasks for due recurring tasks
export async function checkRecurringTasks(userId: string) {
    const now = new Date()

    // Get all recurring tasks that are due
    const { data: recurringTasks } = await supabase
        .from("recurring_tasks")
        .select("*, task_pages!inner(category_id, task_categories!inner(user_id))")
        .lte("next_occurrence", now.toISOString())

    if (!recurringTasks || recurringTasks.length === 0) return

    for (const recurring of recurringTasks) {
        // Check if user owns this task
        const category = (recurring as any).task_pages?.task_categories
        if (category?.user_id !== userId) continue

        // Update next occurrence
        await updateNextOccurrence(recurring.id)
    }
}

