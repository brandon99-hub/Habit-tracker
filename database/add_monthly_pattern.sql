-- Add 'monthly' pattern to task_recurring table
-- This fixes the constraint violation error when creating monthly recurring tasks

-- Drop the existing constraint
ALTER TABLE task_recurring 
DROP CONSTRAINT IF EXISTS task_recurring_pattern_check;

-- Add the new constraint with 'monthly' included
ALTER TABLE task_recurring 
ADD CONSTRAINT task_recurring_pattern_check 
CHECK (pattern IN ('daily', 'weekdays', 'weekly', 'monthly', 'custom'));
