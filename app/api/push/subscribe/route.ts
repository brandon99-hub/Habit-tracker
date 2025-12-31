import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { subscription } = await request.json()

        if (!subscription) {
            return NextResponse.json({ error: "Subscription required" }, { status: 400 })
        }

        const { error } = await supabase
            .from("user_push_subscriptions")
            .insert({
                user_id: user.id,
                subscription: subscription
            })
            // If conflict (same user+endpoint), just ignore/do nothing
            .select() // Ensures we get a response, needed for maybe checking constraints

        if (error) {
            // Check for unique constraint violation (code 23505)
            if (error.code === '23505') {
                return NextResponse.json({ success: true, message: "Already subscribed" })
            }
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
