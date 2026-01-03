-- Add missing columns to recurring_tasks table for advanced recurring features

-- Add day_of_month column (for monthly recurring on specific day)
ALTER TABLE recurring_tasks 
ADD COLUMN IF NOT EXISTS day_of_month INTEGER;

-- Add month_position column (start/end/specific)
ALTER TABLE recurring_tasks 
ADD COLUMN IF NOT EXISTS month_position TEXT CHECK (month_position IN ('start', 'end', 'specific'));

-- Add skip_weekends column
ALTER TABLE recurring_tasks 
ADD COLUMN IF NOT EXISTS skip_weekends BOOLEAN DEFAULT FALSE;

-- Add occurrence_count column (for ending after X occurrences)
ALTER TABLE recurring_tasks 
ADD COLUMN IF NOT EXISTS occurrence_count INTEGER;

-- Add occurrences_completed column (to track how many times task has recurred)
ALTER TABLE recurring_tasks 
ADD COLUMN IF NOT EXISTS occurrences_completed INTEGER DEFAULT 0;

-- Add recurrence_type column (fixed vs after_completion)
ALTER TABLE recurring_tasks 
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'fixed' CHECK (recurrence_type IN ('fixed', 'after_completion'));

-- Add end_date column (for ending on specific date)
ALTER TABLE recurring_tasks 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Add interval column to config if not exists (this might already be in config JSON)
-- The interval is stored in the config JSON object, so no separate column needed

COMMENT ON COLUMN recurring_tasks.day_of_month IS 'Day of month (1-31) for monthly recurring tasks';
COMMENT ON COLUMN recurring_tasks.month_position IS 'Position in month: start (1st), end (last), or specific day';
COMMENT ON COLUMN recurring_tasks.skip_weekends IS 'If true, move recurring date to next weekday if it falls on weekend';
COMMENT ON COLUMN recurring_tasks.occurrence_count IS 'Total number of times task should recur (null = infinite)';
COMMENT ON COLUMN recurring_tasks.occurrences_completed IS 'Number of times task has already recurred';
COMMENT ON COLUMN recurring_tasks.recurrence_type IS 'fixed = regular intervals, after_completion = after task is completed';
COMMENT ON COLUMN recurring_tasks.end_date IS 'Date when recurring should stop (null = no end date)';
