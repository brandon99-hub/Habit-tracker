import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
    try {
        // Get auth token from request headers
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            console.error("❌ No authorization header found")
            return NextResponse.json({ error: "Unauthorized - No auth header" }, { status: 401 })
        }

        // Create Supabase client with the auth token
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: authHeader
                    }
                }
            }
        )

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            console.error("❌ Auth error:", userError)
            return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
        }

        const { subscription } = await request.json()

        if (!subscription) {
            console.error("❌ No subscription in request body")
            return NextResponse.json({ error: "Subscription required" }, { status: 400 })
        }

        // Validate subscription structure
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            console.error("❌ Invalid subscription structure:", subscription)
            return NextResponse.json({ error: "Invalid subscription format" }, { status: 400 })
        }

        console.log(`📱 Saving subscription for user: ${user.id}`)
        console.log(`   Endpoint: ${subscription.endpoint.substring(0, 50)}...`)

        const { data, error } = await supabase
            .from("user_push_subscriptions")
            .insert({
                user_id: user.id,
                subscription: subscription
            })
            .select()

        if (error) {
            console.error("❌ Database error:", error)
            // Check for unique constraint violation (code 23505)
            if (error.code === '23505') {
                console.log("ℹ️  Subscription already exists (duplicate)")
                return NextResponse.json({ success: true, message: "Already subscribed" })
            }
            throw error
        }

        console.log("✅ Subscription saved successfully")
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("❌ Subscribe endpoint error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
