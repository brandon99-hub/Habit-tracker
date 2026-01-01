import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendNotification } from "@/lib/web-push"
import { logNotificationDebug } from "@/lib/notification-logger"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.error("VAPID keys not configured")
        return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Service role key not configured")
        return NextResponse.json({ error: "Service role key not configured" }, { status: 500 })
    }

    // Create a service-role client to bypass RLS (inside function to avoid build-time errors)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Optional: Add simple secret verification
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    try {
        const now = new Date()

        // Log cron start
        await logNotificationDebug(supabase, 'cron_check', 'info', 'Cron job started', {
            metadata: { timestamp: now.toISOString() }
        })

        // 1. Fetch due reminders that haven't been sent
        const { data: reminders, error: reminderError } = await supabase
            .from("task_reminders")
            .select("*")
            .eq("sent", false)
            .lte("remind_at", now.toISOString())
            .limit(50) // Process in batches

        if (reminderError) {
            console.error("Error fetching reminders", reminderError)
            await logNotificationDebug(supabase, 'error', 'failed', 'Failed to fetch reminders', {
                errorDetails: reminderError
            })
            return NextResponse.json({ error: reminderError.message }, { status: 500 })
        }

        if (!reminders || reminders.length === 0) {
            console.log("No reminders to process")
            await logNotificationDebug(supabase, 'cron_check', 'info', 'No reminders to process')
            return NextResponse.json({ success: true, count: 0, message: "No reminders due" })
        }

        console.log(`Processing ${reminders.length} reminder(s)`)
        await logNotificationDebug(supabase, 'cron_check', 'info', `Found ${reminders.length} reminder(s) to process`, {
            metadata: { count: reminders.length }
        })

        const results = []

        // 2. Process each reminder
        for (const reminder of reminders) {
            const userId = reminder.user_id

            // Fetch task details with properties
            const { data: taskData, error: taskError } = await supabase
                .from("task_pages")
                .select("id, title, category_id, icon")
                .eq("id", reminder.page_id)
                .single()

            if (taskError || !taskData) {
                console.error(`Task not found for reminder ${reminder.id}:`, taskError)
                await logNotificationDebug(supabase, 'error', 'warning', 'Task not found for reminder', {
                    taskId: reminder.page_id,
                    userId: userId,
                    errorDetails: taskError
                })
                // Mark as sent to avoid retrying deleted tasks
                await supabase
                    .from("task_reminders")
                    .update({ sent: true })
                    .eq("id", reminder.id)
                continue
            }

            // Fetch task properties (priority and due date)
            const { data: propertyValues } = await supabase
                .from("task_property_values")
                .select("property_id, value, task_properties(name)")
                .eq("page_id", taskData.id)

            let priority = "Medium"
            let dueDate: Date | null = null

            if (propertyValues) {
                for (const pv of propertyValues) {
                    if ((pv as any).task_properties?.name === "Priority") {
                        priority = pv.value
                    }
                    if ((pv as any).task_properties?.name === "Due Date") {
                        dueDate = new Date(pv.value)
                    }
                }
            }

            // 3. Get user's push subscription
            const { data: subs, error: subError } = await supabase
                .from("user_push_subscriptions")
                .select("subscription")
                .eq("user_id", userId)

            if (subError || !subs || subs.length === 0) {
                console.log(`No subscription found for user ${userId}`)
                await logNotificationDebug(supabase, 'error', 'warning', 'No push subscription found for user', {
                    userId: userId,
                    taskId: taskData.id,
                    metadata: { taskTitle: taskData.title }
                })
                continue
            }

            // 4. Create enhanced notification content
            const nowTime = new Date()
            let body = "This task is due soon!"
            let titlePrefix = ""
            let vibrationPattern = [200, 100, 200]
            let requireInteraction = false

            // Calculate time-based message
            if (dueDate) {
                const minutesUntilDue = Math.round((dueDate.getTime() - nowTime.getTime()) / 60000)

                if (minutesUntilDue < 0) {
                    body = "This task is overdue!"
                    titlePrefix = "⚠️ "
                } else if (minutesUntilDue < 60) {
                    body = `Due in ${minutesUntilDue} minute${minutesUntilDue !== 1 ? 's' : ''}!`
                } else if (minutesUntilDue < 1440) {
                    const hours = Math.round(minutesUntilDue / 60)
                    body = `Due in ${hours} hour${hours !== 1 ? 's' : ''}!`
                } else {
                    const hours = dueDate.getHours()
                    const minutes = dueDate.getMinutes()
                    const timeStr = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
                    body = `Due today at ${timeStr}`
                }
            }

            // Add priority prefix and adjust notification behavior
            if (priority === 'Urgent') {
                titlePrefix = "🔴 "
                vibrationPattern = [200, 100, 200, 100, 200]
                requireInteraction = true
            } else if (priority === 'High') {
                titlePrefix = "🟠 "
            }

            // 5. Send notification to all user's devices
            for (const sub of subs) {
                try {
                    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
                    const targetUrl = taskData.category_id
                        ? `${siteUrl}/tasks/category/${taskData.category_id}`
                        : `${siteUrl}/tasks`

                    const payload = JSON.stringify({
                        title: `${titlePrefix}${taskData.title || "Task Reminder"}`,
                        body: body,
                        icon: "/logo.png",
                        badge: "/logo.png",
                        vibrate: vibrationPattern,
                        data: {
                            taskId: reminder.page_id,
                            url: targetUrl,
                            priority: priority
                        },
                        actions: [
                            { action: 'complete', title: 'Mark Done' },
                            { action: 'view', title: 'View Task' }
                        ],
                        tag: `task-${reminder.page_id}`,
                        requireInteraction: requireInteraction,
                        renotify: true
                    })

                    console.log(`📬 Sending notification for task: "${taskData.title}" (${priority}) to endpoint: ${sub.subscription.endpoint.substring(0, 50)}...`)

                    await sendNotification(sub.subscription as any, payload)

                    console.log(`✅ Notification sent successfully for task: "${taskData.title}"`)
                    await logNotificationDebug(supabase, 'notification_sent', 'success', `Notification sent for task: ${taskData.title}`, {
                        userId: userId,
                        taskId: taskData.id,
                        metadata: {
                            taskTitle: taskData.title,
                            priority: priority,
                            body: body,
                            endpoint: sub.subscription.endpoint.substring(0, 50)
                        }
                    })

                    results.push({ id: reminder.id, status: "sent", task: taskData.title })
                } catch (err: any) {
                    console.error(`❌ Error sending notification for task "${taskData.title}":`, err.message || err)
                    await logNotificationDebug(supabase, 'notification_failed', 'failed', `Failed to send notification for task: ${taskData.title}`, {
                        userId: userId,
                        taskId: taskData.id,
                        errorDetails: { message: err.message, stack: err.stack },
                        metadata: { taskTitle: taskData.title }
                    })
                    results.push({ id: reminder.id, status: "failed", task: taskData.title, error: err.message })
                    // If 410 Gone, we should delete the subscription (todo)
                }
            }

            // 6. Mark reminder as sent
            await supabase
                .from("task_reminders")
                .update({ sent: true })
                .eq("id", reminder.id)
        }

        const successCount = results.filter(r => r.status === "sent").length
        const failCount = results.filter(r => r.status === "failed").length

        console.log(`\n📊 Summary: ${successCount} sent, ${failCount} failed out of ${results.length} total`)

        await logNotificationDebug(supabase, 'cron_check', 'info', `Cron completed: ${successCount} sent, ${failCount} failed`, {
            metadata: { total: results.length, sent: successCount, failed: failCount }
        })

        return NextResponse.json({
            success: true,
            total: results.length,
            sent: successCount,
            failed: failCount,
            processed: results
        })
    } catch (error: any) {
        await logNotificationDebug(supabase, 'error', 'failed', 'Cron job exception', {
            errorDetails: { message: error.message, stack: error.stack }
        })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Also support POST method for cron jobs
export async function POST(request: NextRequest) {
    return GET(request)
}
