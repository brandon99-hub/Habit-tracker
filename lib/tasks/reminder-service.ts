import { supabase } from "../supabase"

export type Reminder = {
    id: string
    page_id: string
    user_id: string
    remind_at: string
    minutes_before: number
    sent: boolean
    created_at: string
}

// Create a reminder for a task
export async function createReminder(
    pageId: string,
    userId: string,
    dueDate: string,
    minutesBefore: number = 20
) {
    // Calculate remind_at time
    const dueDateTime = new Date(dueDate)
    const remindAt = new Date(dueDateTime.getTime() - minutesBefore * 60 * 1000)

    const { data, error } = await supabase
        .from("task_reminders")
        .insert({
            page_id: pageId,
            user_id: userId,
            remind_at: remindAt.toISOString(),
            minutes_before: minutesBefore,
        })
        .select()
        .single()

    return { data, error }
}

// Get reminders for a task
export async function getReminders(pageId: string) {
    const { data, error } = await supabase
        .from("task_reminders")
        .select("*")
        .eq("page_id", pageId)
        .order("remind_at", { ascending: true })

    return { data, error }
}

// Update reminder time
export async function updateReminder(id: string, minutesBefore: number, dueDate: string) {
    const dueDateTime = new Date(dueDate)
    const remindAt = new Date(dueDateTime.getTime() - minutesBefore * 60 * 1000)

    const { data, error } = await supabase
        .from("task_reminders")
        .update({
            remind_at: remindAt.toISOString(),
            minutes_before: minutesBefore,
        })
        .eq("id", id)
        .select()
        .single()

    return { data, error }
}

// Delete a reminder
export async function deleteReminder(id: string) {
    const { error } = await supabase.from("task_reminders").delete().eq("id", id)

    return { error }
}

// Get upcoming reminders for a user (for notification service)
export async function getUpcomingReminders(userId: string) {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    const { data, error } = await supabase
        .from("task_reminders")
        .select("*, task_pages(*)")
        .eq("user_id", userId)
        .eq("sent", false)
        .gte("remind_at", now.toISOString())
        .lte("remind_at", oneHourFromNow.toISOString())
        .order("remind_at", { ascending: true })

    return { data, error }
}

// Mark reminder as sent
export async function markReminderSent(id: string) {
    const { error } = await supabase
        .from("task_reminders")
        .update({ sent: true })
        .eq("id", id)

    return { error }
}
