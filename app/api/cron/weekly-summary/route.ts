import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"
import { format, subDays } from "date-fns"

// Configure web-push
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
        // Get all active users
        const { data: users } = await supabase.from("habits").select("user_id").eq("archived", false)

        const uniqueUserIds = [...new Set(users?.map((u) => u.user_id) || [])]

        let sentCount = 0

        for (const userId of uniqueUserIds) {
            // Get user's habits
            const { data: habits } = await supabase
                .from("habits")
                .select("*")
                .eq("user_id", userId)
                .eq("archived", false)

            if (!habits || habits.length === 0) continue

            // Calculate weekly stats
            const last7Days = subDays(new Date(), 7)
            const totalCompletions = habits.reduce((sum, habit) => {
                const completedLast7 = habit.history?.filter((h: any) => {
                    const date = new Date(h.date)
                    return date >= last7Days && h.completed
                }).length || 0
                return sum + completedLast7
            }, 0)

            const completionRate = Math.round((totalCompletions / (habits.length * 7)) * 100)

            // Find longest streak
            const longestStreakHabit = habits.reduce((best, habit) => {
                return habit.currentStreak > (best?.currentStreak || 0) ? habit : best
            }, habits[0])

            // Calculate perfect days (simplified)
            const perfectDays = 0 // TODO: Calculate from history

            // Most consistent habit
            const mostConsistentHabit = longestStreakHabit

            // Get user's push subscriptions
            const { data: subscriptions } = await supabase
                .from("user_push_subscriptions")
                .select("subscription")
                .eq("user_id", userId)

            if (subscriptions && subscriptions.length > 0) {
                const payload = JSON.stringify({
                    title: "🎉 Your Week in Habits!",
                    body: `You completed ${totalCompletions} habits this week! Tap to see your summary.`,
                    icon: "/logo.png",
                    data: {
                        url: "/reflections?weekly-summary=true",
                        type: "weekly-summary",
                        summaryData: {
                            totalCompletions,
                            completionRate,
                            longestStreak: longestStreakHabit.currentStreak,
                            longestStreakHabit: longestStreakHabit.name,
                            perfectDays,
                            mostConsistentHabit: mostConsistentHabit.name,
                            mostConsistentRate: completionRate,
                        },
                    },
                    requireInteraction: true,
                })

                for (const sub of subscriptions) {
                    try {
                        await webpush.sendNotification(sub.subscription, payload)
                        sentCount++
                    } catch (error) {
                        console.error("Error sending weekly summary:", error)
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} weekly summaries`,
        })
    } catch (error: any) {
        console.error("Weekly summary cron error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
