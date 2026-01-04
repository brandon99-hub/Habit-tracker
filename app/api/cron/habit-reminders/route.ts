import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"
import { format } from "date-fns"

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    "mailto:your-email@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

export async function GET(request: NextRequest) {
    // Optional: Add simple secret verification
    // const authHeader = request.headers.get("authorization")
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response("Unauthorized", { status: 401 })
    // }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const now = new Date()
        const currentTime = format(now, "HH:mm") // "09:00"
        const today = format(now, "yyyy-MM-dd")

        // Find habits with scheduled_time matching current time
        const { data: habits, error: habitsError } = await supabase
            .from("habits")
            .select("id, name, user_id, scheduled_time, icon")
            .eq("scheduled_time", currentTime)
            .eq("archived", false)
            .eq("paused", false)

        if (habitsError) throw habitsError

        let sentCount = 0

        for (const habit of habits || []) {
            // Check if already completed today
            const { data: completion } = await supabase
                .from("completions")
                .select("id")
                .eq("habit_id", habit.id)
                .gte("timestamp", `${today}T00:00:00`)
                .single()

            if (!completion) {
                // Get user's push subscriptions
                const { data: subscriptions } = await supabase
                    .from("user_push_subscriptions")
                    .select("subscription")
                    .eq("user_id", habit.user_id)

                if (subscriptions && subscriptions.length > 0) {
                    const payload = JSON.stringify({
                        title: `⏰ ${habit.name}`,
                        body: "Time to complete your habit!",
                        icon: "/logo.png",
                        data: {
                            url: `/habit/${habit.id}`,
                            habitId: habit.id,
                        },
                        actions: [
                            { action: "complete", title: "✓ Mark Done" },
                            { action: "snooze", title: "⏰ Snooze 15m" },
                        ],
                    })

                    for (const sub of subscriptions) {
                        try {
                            await webpush.sendNotification(sub.subscription, payload)
                            sentCount++
                        } catch (error) {
                            console.error("Error sending notification:", error)
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} habit reminders`,
        })
    } catch (error: any) {
        console.error("Cron job error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
