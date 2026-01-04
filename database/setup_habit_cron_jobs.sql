-- Enable pg_cron extension (Supabase has this enabled by default)
-- This file sets up Supabase cron jobs for habit notifications

-- Note: If jobs already exist, unschedule them first by running:
-- SELECT cron.unschedule('habit-reminders');
-- SELECT cron.unschedule('weekly-summary');

-- Schedule habit reminders to run every 15 minutes
-- This will call the API endpoint to check for habits that need reminders
SELECT cron.schedule(
  'habit-reminders',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url:='https://your-app-url.vercel.app/api/cron/habit-reminders',
      headers:='{"Content-Type": "application/json"}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule weekly summary to run every Sunday at 8 PM (20:00)
SELECT cron.schedule(
  'weekly-summary',
  '0 20 * * 0', -- Every Sunday at 8 PM
  $$
  SELECT
    net.http_post(
      url:='https://your-app-url.vercel.app/api/cron/weekly-summary',
      headers:='{"Content-Type": "application/json"}'::jsonb
    ) AS request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;
