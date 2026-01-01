import webPush from 'web-push'

// Validate VAPID keys are configured
if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error("⚠️  VAPID keys not configured. Push notifications will not work.")
} else {
    webPush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL || 'example@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export const sendNotification = async (
    subscription: webPush.PushSubscription,
    payload: string | Buffer
) => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        throw new Error("VAPID keys not configured")
    }
    return webPush.sendNotification(subscription, payload)
}
