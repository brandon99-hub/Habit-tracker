import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
    try {
        // Create client with cookies for auth
        const cookieStore = await cookies()
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    storage: {
                        getItem: (key) => cookieStore.get(key)?.value ?? null,
                        setItem: (key, value) => { cookieStore.set(key, value) },
                        removeItem: (key) => { cookieStore.delete(key) },
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.error("No user found in session")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { subscription } = await request.json()

        if (!subscription) {
            return NextResponse.json({ error: "Subscription required" }, { status: 400 })
        }

        console.log("Saving subscription for user:", user.id)

        const { data, error } = await supabase
            .from("user_push_subscriptions")
            .insert({
                user_id: user.id,
                subscription: subscription
            })
            .select()

        if (error) {
            console.error("Database error:", error)
            // Check for unique constraint violation (code 23505)
            if (error.code === '23505') {
                return NextResponse.json({ success: true, message: "Already subscribed" })
            }
            throw error
        }

        console.log("Subscription saved successfully:", data)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Subscribe endpoint error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
