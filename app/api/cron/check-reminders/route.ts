import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendNotification } from "@/lib/web-push"

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

        // 1. Fetch due reminders that haven't been sent
        const { data: reminders, error: reminderError } = await supabase
            .from("task_reminders")
            .select("*")
            .eq("sent", false)
            .lte("remind_at", now.toISOString())
            .limit(50) // Process in batches

        if (reminderError) {
            console.error("Error fetching reminders", reminderError)
            return NextResponse.json({ error: reminderError.message }, { status: 500 })
        }

        if (!reminders || reminders.length === 0) {
            console.log("No reminders to process")
            return NextResponse.json({ success: true, count: 0, message: "No reminders due" })
        }

        console.log(`Processing ${reminders.length} reminder(s)`)

        const results = []

        // 2. Process each reminder
        for (const reminder of reminders) {
            const userId = reminder.user_id

            // Fetch task details
            const { data: taskData, error: taskError } = await supabase
                .from("task_pages")
                .select("id, title, database_id")
                .eq("id", reminder.page_id)
                .single()

            if (taskError || !taskData) {
                console.error(`Task not found for reminder ${reminder.id}:`, taskError)
                // Mark as sent to avoid retrying deleted tasks
                await supabase
                    .from("task_reminders")
                    .update({ sent: true })
                    .eq("id", reminder.id)
                continue
            }

            // 3. Get user's push subscription
            const { data: subs, error: subError } = await supabase
                .from("user_push_subscriptions")
                .select("subscription")
                .eq("user_id", userId)

            if (subError || !subs || subs.length === 0) {
                console.log(`No subscription found for user ${userId}`)
                continue
            }

            // 4. Send notification to all user's devices
            for (const sub of subs) {
                try {
                    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
                    const targetUrl = taskData.database_id
                        ? `${siteUrl}/tasks/category/${taskData.database_id}`
                        : `${siteUrl}/tasks`

                    const payload = JSON.stringify({
                        title: taskData.title || "Task Reminder",
                        body: "This task is due soon!",
                        icon: "/logo.png",
                        data: {
                            taskId: reminder.page_id,
                            url: targetUrl
                        }
                    })

                    console.log(`Sending notification for task: "${taskData.title}" to endpoint: ${sub.subscription.endpoint.substring(0, 50)}...`)
                    await sendNotification(sub.subscription as any, payload)
                    console.log(`✅ Notification sent successfully for task: "${taskData.title}"`)
                    results.push({ id: reminder.id, status: "sent", task: taskData.title })
                } catch (err: any) {
                    console.error(`❌ Error sending notification for task "${taskData.title}":`, err.message || err)
                    results.push({ id: reminder.id, status: "failed", task: taskData.title, error: err.message })
                    // If 410 Gone, we should delete the subscription (todo)
                }
            }

            // 5. Mark reminder as sent
            await supabase
                .from("task_reminders")
                .update({ sent: true })
                .eq("id", reminder.id)
        }

        const successCount = results.filter(r => r.status === "sent").length
        const failCount = results.filter(r => r.status === "failed").length

        console.log(`\n📊 Summary: ${successCount} sent, ${failCount} failed out of ${results.length} total`)

        return NextResponse.json({
            success: true,
            total: results.length,
            sent: successCount,
            failed: failCount,
            processed: results
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Also support POST method for cron jobs
export async function POST(request: NextRequest) {
    return GET(request)
}
