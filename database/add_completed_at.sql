-- Add completed_at timestamp field to task_pages table for accurate stat tracking

ALTER TABLE task_pages 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN task_pages.completed_at IS 'Timestamp when task was marked as completed';

-- Note: You'll need to update the status change logic in your app to set this field
-- when a task status changes to "Completed"
