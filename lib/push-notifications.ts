// Push Notification Utilities for HabitForge

export interface PushSubscriptionData {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications')
        return 'denied'
    }

    if (Notification.permission === 'granted') {
        return 'granted'
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission
    }

    return Notification.permission
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
    try {
        const permission = await requestNotificationPermission()

        if (permission !== 'granted') {
            console.log('Notification permission denied')
            return null
        }

        const registration = await navigator.serviceWorker.ready

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
            // Subscribe to push notifications
            // Note: You'll need to add VAPID keys in environment variables
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

            if (!vapidPublicKey) {
                console.error('VAPID public key not found')
                return null
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
            })
        }

        // Convert subscription to JSON
        const subscriptionJSON = subscription.toJSON()

        return {
            endpoint: subscriptionJSON.endpoint!,
            keys: {
                p256dh: subscriptionJSON.keys!.p256dh!,
                auth: subscriptionJSON.keys!.auth!,
            },
        }
    } catch (error) {
        console.error('Error subscribing to push:', error)
        return null
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            await subscription.unsubscribe()
            return true
        }

        return false
    } catch (error) {
        console.error('Error unsubscribing from push:', error)
        return false
    }
}

/**
 * Send a test notification
 */
export async function sendTestNotification() {
    const permission = await requestNotificationPermission()

    if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready

        registration.showNotification('HabitForge', {
            body: 'Notifications are working! 🎉',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'test-notification',
        })
    }
}

/**
 * Schedule a notification for a specific time
 */
export function scheduleNotification(habitName: string, time: string, habitId: string) {
    // This would be handled by the backend
    // For now, we'll just store the schedule
    const schedules = JSON.parse(localStorage.getItem('notification-schedules') || '[]')

    schedules.push({
        habitId,
        habitName,
        time,
        enabled: true,
    })

    localStorage.setItem('notification-schedules', JSON.stringify(schedules))
}

/**
 * Get all scheduled notifications
 */
export function getScheduledNotifications() {
    return JSON.parse(localStorage.getItem('notification-schedules') || '[]')
}

/**
 * Clear a scheduled notification
 */
export function clearScheduledNotification(habitId: string) {
    const schedules = JSON.parse(localStorage.getItem('notification-schedules') || '[]')
    const filtered = schedules.filter((s: any) => s.habitId !== habitId)
    localStorage.setItem('notification-schedules', JSON.stringify(filtered))
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
    return Notification.permission === 'granted'
}
