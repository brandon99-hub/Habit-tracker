-- Migration Script: Remove Workspaces, Rename Databases to Categories
-- This script migrates the task management system to a simpler structure
-- WARNING: This will permanently remove the workspace concept

-- Step 1: Add user_id column to task_databases
ALTER TABLE task_databases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Migrate existing data - assign databases to users based on workspace ownership
UPDATE task_databases 
SET user_id = (
  SELECT user_id 
  FROM task_workspaces 
  WHERE task_workspaces.id = task_databases.workspace_id
)
WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL after migration
ALTER TABLE task_databases ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add color and gradient columns for category customization
ALTER TABLE task_databases ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'purple';
ALTER TABLE task_databases ADD COLUMN IF NOT EXISTS gradient TEXT DEFAULT 'primary';

-- Step 5: DROP ALL RLS POLICIES that depend on workspace_id BEFORE dropping the column

-- Drop task_databases policies
DROP POLICY IF EXISTS "Users can view databases in their workspaces" ON task_databases;
DROP POLICY IF EXISTS "Users can create databases in their workspaces" ON task_databases;
DROP POLICY IF EXISTS "Users can update databases in their workspaces" ON task_databases;
DROP POLICY IF EXISTS "Users can delete databases in their workspaces" ON task_databases;

-- Drop task_properties policies
DROP POLICY IF EXISTS "Users can view properties in their databases" ON task_properties;
DROP POLICY IF EXISTS "Users can create properties in their databases" ON task_properties;
DROP POLICY IF EXISTS "Users can update properties in their databases" ON task_properties;
DROP POLICY IF EXISTS "Users can delete properties in their databases" ON task_properties;

-- Drop task_pages policies
DROP POLICY IF EXISTS "Users can view pages in their databases" ON task_pages;
DROP POLICY IF EXISTS "Users can create pages in their databases" ON task_pages;
DROP POLICY IF EXISTS "Users can update pages in their databases" ON task_pages;
DROP POLICY IF EXISTS "Users can delete pages in their databases" ON task_pages;

-- Drop task_property_values policies
DROP POLICY IF EXISTS "Users can view property values for their pages" ON task_property_values;
DROP POLICY IF EXISTS "Users can create property values for their pages" ON task_property_values;
DROP POLICY IF EXISTS "Users can update property values for their pages" ON task_property_values;
DROP POLICY IF EXISTS "Users can delete property values for their pages" ON task_property_values;

-- Drop task_recurring policies
DROP POLICY IF EXISTS "Users can view recurring tasks for their pages" ON task_recurring;
DROP POLICY IF EXISTS "Users can create recurring tasks for their pages" ON task_recurring;
DROP POLICY IF EXISTS "Users can update recurring tasks for their pages" ON task_recurring;
DROP POLICY IF EXISTS "Users can delete recurring tasks for their pages" ON task_recurring;

-- Drop task_views policies
DROP POLICY IF EXISTS "Users can view views in their databases" ON task_views;
DROP POLICY IF EXISTS "Users can create views in their databases" ON task_views;
DROP POLICY IF EXISTS "Users can update views in their databases" ON task_views;
DROP POLICY IF EXISTS "Users can delete views in their databases" ON task_views;

-- Drop task_comments policies
DROP POLICY IF EXISTS "Users can view comments on their tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments on their tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can update comments on their tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can delete comments on their tasks" ON task_comments;

-- Drop task_attachments policies
DROP POLICY IF EXISTS "Users can view attachments on their tasks" ON task_attachments;
DROP POLICY IF EXISTS "Users can create attachments on their tasks" ON task_attachments;
DROP POLICY IF EXISTS "Users can delete attachments on their tasks" ON task_attachments;

-- Drop task_activity policies
DROP POLICY IF EXISTS "Users can view activity on their tasks" ON task_activity;
DROP POLICY IF EXISTS "Users can create activity on their tasks" ON task_activity;

-- Drop task_reminders policies
DROP POLICY IF EXISTS "Users can view reminders for their pages" ON task_reminders;
DROP POLICY IF EXISTS "Users can create reminders for their pages" ON task_reminders;
DROP POLICY IF EXISTS "Users can update reminders for their pages" ON task_reminders;
DROP POLICY IF EXISTS "Users can delete reminders for their pages" ON task_reminders;

-- Step 6: Now safe to drop the workspace_id foreign key constraint
ALTER TABLE task_databases DROP CONSTRAINT IF EXISTS task_databases_workspace_id_fkey;

-- Step 7: Drop the workspace_id column
ALTER TABLE task_databases DROP COLUMN IF EXISTS workspace_id;

-- Step 8: Rename table from task_databases to task_categories
ALTER TABLE task_databases RENAME TO task_categories;

-- Step 9: Rename indexes
ALTER INDEX IF EXISTS idx_task_databases_workspace_id RENAME TO idx_task_categories_user_id;
ALTER INDEX IF EXISTS task_databases_pkey RENAME TO task_categories_pkey;

-- Step 10: Create new RLS policies for task_categories

-- Create new user-based policies
CREATE POLICY "Users can view their own categories" ON task_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" ON task_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON task_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON task_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Update foreign key references in task_properties
ALTER TABLE task_properties DROP CONSTRAINT IF EXISTS task_properties_database_id_fkey;
ALTER TABLE task_properties 
  ADD CONSTRAINT task_properties_category_id_fkey 
  FOREIGN KEY (database_id) 
  REFERENCES task_categories(id) 
  ON DELETE CASCADE;

-- Rename the column for clarity (optional)
ALTER TABLE task_properties RENAME COLUMN database_id TO category_id;

-- Update index name
ALTER INDEX IF EXISTS idx_task_properties_database_id RENAME TO idx_task_properties_category_id;

-- Step 11: Update foreign key references in task_pages
ALTER TABLE task_pages DROP CONSTRAINT IF EXISTS task_pages_database_id_fkey;
ALTER TABLE task_pages 
  ADD CONSTRAINT task_pages_category_id_fkey 
  FOREIGN KEY (database_id) 
  REFERENCES task_categories(id) 
  ON DELETE CASCADE;

-- Rename the column for clarity (optional)
ALTER TABLE task_pages RENAME COLUMN database_id TO category_id;

-- Update index name
ALTER INDEX IF EXISTS idx_task_pages_database_id RENAME TO idx_task_pages_category_id;

-- Step 12: Update foreign key references in task_views
ALTER TABLE task_views DROP CONSTRAINT IF EXISTS task_views_database_id_fkey;
ALTER TABLE task_views 
  ADD CONSTRAINT task_views_category_id_fkey 
  FOREIGN KEY (database_id) 
  REFERENCES task_categories(id) 
  ON DELETE CASCADE;

-- Rename the column for clarity (optional)
ALTER TABLE task_views RENAME COLUMN database_id TO category_id;

-- Update index name
ALTER INDEX IF EXISTS idx_task_views_database_id RENAME TO idx_task_views_category_id;

-- Step 13: Update RLS policies for dependent tables to use new structure

-- task_properties policies
DROP POLICY IF EXISTS "Users can view properties in their databases" ON task_properties;
DROP POLICY IF EXISTS "Users can create properties in their databases" ON task_properties;
DROP POLICY IF EXISTS "Users can update properties in their databases" ON task_properties;
DROP POLICY IF EXISTS "Users can delete properties in their databases" ON task_properties;

CREATE POLICY "Users can view properties in their categories" ON task_properties
  FOR SELECT USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create properties in their categories" ON task_properties
  FOR INSERT WITH CHECK (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update properties in their categories" ON task_properties
  FOR UPDATE USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete properties in their categories" ON task_properties
  FOR DELETE USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

-- task_pages policies
DROP POLICY IF EXISTS "Users can view pages in their databases" ON task_pages;
DROP POLICY IF EXISTS "Users can create pages in their databases" ON task_pages;
DROP POLICY IF EXISTS "Users can update pages in their databases" ON task_pages;
DROP POLICY IF EXISTS "Users can delete pages in their databases" ON task_pages;

CREATE POLICY "Users can view pages in their categories" ON task_pages
  FOR SELECT USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create pages in their categories" ON task_pages
  FOR INSERT WITH CHECK (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update pages in their categories" ON task_pages
  FOR UPDATE USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete pages in their categories" ON task_pages
  FOR DELETE USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

-- task_property_values policies (update to use new structure)
DROP POLICY IF EXISTS "Users can view property values for their pages" ON task_property_values;
DROP POLICY IF EXISTS "Users can create property values for their pages" ON task_property_values;
DROP POLICY IF EXISTS "Users can update property values for their pages" ON task_property_values;
DROP POLICY IF EXISTS "Users can delete property values for their pages" ON task_property_values;

CREATE POLICY "Users can view property values for their pages" ON task_property_values
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create property values for their pages" ON task_property_values
  FOR INSERT WITH CHECK (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update property values for their pages" ON task_property_values
  FOR UPDATE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete property values for their pages" ON task_property_values
  FOR DELETE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

-- task_recurring policies (update to use new structure)
DROP POLICY IF EXISTS "Users can view recurring tasks for their pages" ON task_recurring;
DROP POLICY IF EXISTS "Users can create recurring tasks for their pages" ON task_recurring;
DROP POLICY IF EXISTS "Users can update recurring tasks for their pages" ON task_recurring;
DROP POLICY IF EXISTS "Users can delete recurring tasks for their pages" ON task_recurring;

CREATE POLICY "Users can view recurring tasks for their pages" ON task_recurring
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create recurring tasks for their pages" ON task_recurring
  FOR INSERT WITH CHECK (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update recurring tasks for their pages" ON task_recurring
  FOR UPDATE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete recurring tasks for their pages" ON task_recurring
  FOR DELETE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE category_id IN (
        SELECT id FROM task_categories WHERE user_id = auth.uid()
      )
    )
  );

-- task_views policies
DROP POLICY IF EXISTS "Users can view views in their databases" ON task_views;
DROP POLICY IF EXISTS "Users can create views in their databases" ON task_views;
DROP POLICY IF EXISTS "Users can update views in their databases" ON task_views;
DROP POLICY IF EXISTS "Users can delete views in their databases" ON task_views;

CREATE POLICY "Users can view views in their categories" ON task_views
  FOR SELECT USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create views in their categories" ON task_views
  FOR INSERT WITH CHECK (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update views in their categories" ON task_views
  FOR UPDATE USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete views in their categories" ON task_views
  FOR DELETE USING (
    category_id IN (SELECT id FROM task_categories WHERE user_id = auth.uid())
  );

-- Step 14: Drop the task_workspaces table (after all migrations are complete)
DROP TABLE IF EXISTS task_workspaces CASCADE;

-- Step 15: Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_task_categories_user_id ON task_categories(user_id);

-- Migration complete!
-- Summary:
-- - Removed workspace concept entirely
-- - Renamed task_databases to task_categories
-- - Added color and gradient columns for customization
-- - Updated all foreign keys and RLS policies
-- - Simplified data model: User -> Categories -> Tasks
