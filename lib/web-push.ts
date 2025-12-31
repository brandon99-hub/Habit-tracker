import webPush from 'web-push'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
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
    return webPush.sendNotification(subscription, payload)
}
