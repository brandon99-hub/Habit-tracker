-- Add end_date column to task_recurring table
ALTER TABLE task_recurring 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_recurring' AND column_name = 'end_date';
