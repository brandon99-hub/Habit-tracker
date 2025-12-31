-- Clean up duplicate recurring tasks
-- Run this ONCE in Supabase SQL Editor to remove duplicates

-- Delete all but the most recent recurring task for each page_id
DELETE FROM task_recurring
WHERE id NOT IN (
    SELECT DISTINCT ON (page_id) id
    FROM task_recurring
    ORDER BY page_id, created_at DESC
);

-- Verify - should show only 1 row per task now
SELECT page_id, COUNT(*) as count
FROM task_recurring
GROUP BY page_id
HAVING COUNT(*) > 1;

-- If the above query returns 0 rows, you're good!
