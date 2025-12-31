-- Run this in Supabase SQL Editor to check if recurring tasks are saving

-- 1. Check if recurring tasks exist
SELECT * FROM task_recurring ORDER BY created_at DESC LIMIT 10;

-- 2. Check specific task's recurring settings
SELECT 
    tr.*,
    tp.title as task_title,
    tp.category_id
FROM task_recurring tr
JOIN task_pages tp ON tr.page_id = tp.id
ORDER BY tr.created_at DESC;

-- 3. If you see data here, the recurring tasks ARE saving!
-- The problem is just the calendar not displaying them correctly.
