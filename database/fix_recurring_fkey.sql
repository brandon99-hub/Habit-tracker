-- Fix foreign key constraint in recurring_tasks table
-- The constraint was pointing to 'pages' table but should point to 'task_pages'

-- Drop the old foreign key constraint
ALTER TABLE recurring_tasks 
DROP CONSTRAINT IF EXISTS recurring_tasks_page_id_fkey;

-- Add the correct foreign key constraint pointing to task_pages
ALTER TABLE recurring_tasks 
ADD CONSTRAINT recurring_tasks_page_id_fkey 
FOREIGN KEY (page_id) 
REFERENCES task_pages(id) 
ON DELETE CASCADE;

-- Add comment
COMMENT ON CONSTRAINT recurring_tasks_page_id_fkey ON recurring_tasks 
IS 'Foreign key to task_pages table, cascades on delete';
