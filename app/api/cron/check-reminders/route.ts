import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendNotification } from "@/lib/web-push"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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
            .select(`
                *,
                pages!task_reminders_page_id_fkey (
                    id,
                    title,
                    parent_id
                )
            `)
            .eq("sent", false)
            .lte("remind_at", now.toISOString())
            .limit(50) // Process in batches

        if (reminderError) {
            console.error("Error fetching reminders", reminderError)
            return NextResponse.json({ error: reminderError.message }, { status: 500 })
        }

        if (!reminders || reminders.length === 0) {
            return NextResponse.json({ success: true, count: 0 })
        }

        const results = []

        // 2. Process each reminder
        for (const reminder of reminders) {
            const userId = reminder.user_id

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
                    const targetUrl = reminder.pages?.parent_id
                        ? `${siteUrl}/tasks/category/${reminder.pages.parent_id}`
                        : `${siteUrl}/tasks`

                    const payload = JSON.stringify({
                        title: reminder.pages?.title || "Task Reminder",
                        body: "This task is due soon!",
                        icon: "/logo.png",
                        data: {
                            habitId: reminder.page_id,
                            url: targetUrl
                        }
                    })

                    console.log(`Sending notification for task: ${reminder.pages?.title}`)
                    await sendNotification(sub.subscription as any, payload)
                    results.push({ id: reminder.id, status: "sent", task: reminder.pages?.title })
                } catch (err) {
                    console.error("Error sending push", err)
                    // If 410 Gone, we should delete the subscription (todo)
                }
            }

            // 5. Mark reminder as sent
            await supabase
                .from("task_reminders")
                .update({ sent: true })
                .eq("id", reminder.id)
        }

        return NextResponse.json({ success: true, count: results.length, processed: results })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
