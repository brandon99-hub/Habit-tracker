// Notification service for task reminders
import { getUpcomingReminders, markReminderSent } from "./tasks/reminder-service"

export async function checkAndSendReminders(userId: string) {
    const { data: reminders } = await getUpcomingReminders(userId)

    if (!reminders || reminders.length === 0) return

    for (const reminder of reminders) {
        const task = (reminder as any).task_pages

        if (!task) continue

        // Send browser notification
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("Task Reminder", {
                body: `"${task.title}" is due in ${reminder.minutes_before} minutes`,
                icon: "/logo.png",
                badge: "/logo.png",
                tag: `reminder-${reminder.id}`,
                requireInteraction: true,
            })

            notification.onclick = () => {
                window.focus()
                window.location.href = `/tasks/database/${task.database_id}`
                notification.close()
            }
        }

        // Mark as sent
        await markReminderSent(reminder.id)
    }
}

// Start reminder service
export function startReminderService(userId: string) {
    // Check every minute
    const interval = setInterval(() => {
        checkAndSendReminders(userId)

        // Also check recurring tasks
        const { checkRecurringTasks } = require("./tasks/recurring-service")
        checkRecurringTasks(userId)
    }, 60 * 1000)

    // Initial check
    checkAndSendReminders(userId)
    const { checkRecurringTasks } = require("./tasks/recurring-service")
    checkRecurringTasks(userId)

    return () => clearInterval(interval)
}
