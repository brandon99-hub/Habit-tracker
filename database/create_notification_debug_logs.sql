-- Create notification debug logs table
CREATE TABLE IF NOT EXISTS notification_debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('subscription', 'cron_check', 'notification_sent', 'notification_failed', 'error', 'info')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES task_pages(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'info', 'warning')),
    message TEXT NOT NULL,
    error_details JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_timestamp ON notification_debug_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_debug_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_debug_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_debug_logs(log_type);

-- Enable RLS
ALTER TABLE notification_debug_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Allow service role to insert (for API routes)
CREATE POLICY "Service role can insert logs"
    ON notification_debug_logs FOR INSERT
    WITH CHECK (true);

-- Allow users to view their own logs
CREATE POLICY "Users can view their own logs"
    ON notification_debug_logs FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Allow service role to view all logs (for debugging)
CREATE POLICY "Service role can view all logs"
    ON notification_debug_logs FOR SELECT
    USING (true);

COMMENT ON TABLE notification_debug_logs IS 'Debug logs for push notification system - tracks subscriptions, cron runs, and notification delivery';
