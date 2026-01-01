-- Useful queries for checking notification debug logs

-- 1. See all recent logs (last 50)
SELECT 
    timestamp,
    log_type,
    status,
    message,
    user_id,
    task_id
FROM notification_debug_logs 
ORDER BY timestamp DESC 
LIMIT 50;

-- 2. See only errors and failures
SELECT 
    timestamp,
    log_type,
    message,
    error_details,
    user_id,
    task_id
FROM notification_debug_logs 
WHERE status IN ('failed', 'warning')
ORDER BY timestamp DESC;

-- 3. See logs for a specific user
SELECT 
    timestamp,
    log_type,
    status,
    message,
    metadata
FROM notification_debug_logs 
WHERE user_id = 'your-user-id-here'
ORDER BY timestamp DESC;

-- 4. See logs for a specific task
SELECT 
    timestamp,
    log_type,
    status,
    message,
    user_id
FROM notification_debug_logs 
WHERE task_id = 'your-task-id-here'
ORDER BY timestamp DESC;

-- 5. See cron job execution history
SELECT 
    timestamp,
    status,
    message,
    metadata
FROM notification_debug_logs 
WHERE log_type = 'cron_check'
ORDER BY timestamp DESC
LIMIT 20;

-- 6. See all notification attempts (sent or failed)
SELECT 
    timestamp,
    log_type,
    status,
    message,
    user_id,
    task_id,
    error_details
FROM notification_debug_logs 
WHERE log_type IN ('notification_sent', 'notification_failed')
ORDER BY timestamp DESC;

-- 7. See subscription activity
SELECT 
    timestamp,
    status,
    message,
    user_id,
    metadata
FROM notification_debug_logs 
WHERE log_type = 'subscription'
ORDER BY timestamp DESC
LIMIT 20;

-- 8. Count logs by type and status
SELECT 
    log_type,
    status,
    COUNT(*) as count
FROM notification_debug_logs 
GROUP BY log_type, status
ORDER BY log_type, status;

-- 9. See logs from the last hour
SELECT 
    timestamp,
    log_type,
    status,
    message
FROM notification_debug_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- 10. Delete old logs (older than 30 days)
-- DELETE FROM notification_debug_logs 
-- WHERE timestamp < NOW() - INTERVAL '30 days';
