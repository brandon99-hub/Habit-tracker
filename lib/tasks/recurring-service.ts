import { supabase } from "../supabase"

export type RecurringTask = {
    id: string
    page_id: string
    pattern: "daily" | "weekdays" | "weekly" | "custom"
    config: {
        days?: number[] // 0-6 for Sunday-Saturday
        time?: string // HH:MM format
    }
    next_occurrence: string
    created_at: string
}

// Create a recurring task
export async function createRecurringTask(data: {
    page_id: string
    pattern: "daily" | "weekdays" | "weekly" | "monthly" | "custom"
    interval?: number
    days_of_week?: number[] | null
    end_date?: string | null
}) {
    console.log("[RECURRING] Creating recurring task with data:", JSON.stringify(data, null, 2))

    const config = {
        days: data.days_of_week || undefined,
        interval: data.interval || 1,
    }

    const nextOccurrence = calculateNextOccurrence(data.pattern as any, config)
    console.log("[RECURRING] Calculated next occurrence:", nextOccurrence.toISOString())

    const insertData = {
        page_id: data.page_id,
        pattern: data.pattern,
        config,
        next_occurrence: nextOccurrence.toISOString(),
        end_date: data.end_date || null,
    }
    console.log("[RECURRING] Inserting into database:", JSON.stringify(insertData, null, 2))

    const { data: result, error } = await supabase
        .from("task_recurring")
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.error("[RECURRING] Error creating recurring task:", error)
    } else {
        console.log("[RECURRING] Successfully created recurring task:", result)
    }

    return { data: result, error }
}

// Get recurring task for a page
export async function getRecurringTask(pageId: string) {
    const { data, error } = await supabase
        .from("task_recurring")
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
        pattern?: "daily" | "weekdays" | "weekly" | "monthly" | "custom"
        interval?: number
        days_of_week?: number[] | null
        end_date?: string | null
    }
) {
    console.log("[RECURRING] Updating recurring task:", id, "with data:", JSON.stringify(data, null, 2))

    const config = {
        days: data.days_of_week || undefined,
        interval: data.interval || 1,
    }

    const nextOccurrence = calculateNextOccurrence((data.pattern || "daily") as any, config)
    console.log("[RECURRING] Calculated next occurrence:", nextOccurrence.toISOString())

    const { data: result, error } = await supabase
        .from("task_recurring")
        .update({
            pattern: data.pattern,
            config,
            next_occurrence: nextOccurrence.toISOString(),
            end_date: data.end_date || null,
        })
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
    const { error } = await supabase.from("task_recurring").delete().eq("id", id)

    return { error }
}

// Calculate next occurrence based on pattern
function calculateNextOccurrence(
    pattern: "daily" | "weekdays" | "weekly" | "custom",
    config: { days?: number[]; time?: string }
): Date {
    const now = new Date()
    const [hours, minutes] = (config.time || "09:00").split(":").map(Number)

    let next = new Date(now)
    next.setHours(hours, minutes, 0, 0)

    // If time has passed today, start from tomorrow
    if (next <= now) {
        next.setDate(next.getDate() + 1)
    }

    switch (pattern) {
        case "daily":
            // Already set to next occurrence
            break

        case "weekdays":
            // Monday-Friday (1-5)
            while (next.getDay() === 0 || next.getDay() === 6) {
                next.setDate(next.getDate() + 1)
            }
            break

        case "weekly":
            // Same day next week
            next.setDate(next.getDate() + 7)
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
        .from("task_recurring")
        .select("*")
        .eq("id", recurringTaskId)
        .single()

    if (!recurring) return { error: "Recurring task not found" }

    const nextOccurrence = calculateNextOccurrence(recurring.pattern, recurring.config)

    const { data, error } = await supabase
        .from("task_recurring")
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
        .from("task_recurring")
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

