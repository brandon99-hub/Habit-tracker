// Notification debug logger for database-based logging

// Helper function to log to database
export async function logNotificationDebug(
    supabase: any, // Using any to avoid type conflicts with service role client
    logType: 'subscription' | 'cron_check' | 'notification_sent' | 'notification_failed' | 'error' | 'info',
    status: 'success' | 'failed' | 'info' | 'warning',
    message: string,
    options?: {
        userId?: string
        taskId?: string
        errorDetails?: any
        metadata?: any
    }
) {
    try {
        const { error } = await supabase
            .from('notification_debug_logs')
            .insert({
                log_type: logType,
                status: status,
                message: message,
                user_id: options?.userId || null,
                task_id: options?.taskId || null,
                error_details: options?.errorDetails || null,
                metadata: options?.metadata || null
            })

        if (error) {
            console.error('Failed to log to database:', error)
        }
    } catch (err) {
        console.error('Exception logging to database:', err)
    }
}
