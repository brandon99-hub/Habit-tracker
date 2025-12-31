-- Task Manager Database Schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this, but we reference it)
-- The auth.users table already exists in Supabase

-- Workspaces (each user has their own workspaces)
CREATE TABLE IF NOT EXISTS task_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Databases (task collections within a workspace)
CREATE TABLE IF NOT EXISTS task_databases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES task_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties (customizable fields for tasks)
CREATE TABLE IF NOT EXISTS task_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID NOT NULL REFERENCES task_databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'select', 'date', 'checkbox', 'number')),
  config JSONB, -- {options: ['Not Started', 'In Progress', 'Done']} for select type
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages (individual tasks)
CREATE TABLE IF NOT EXISTS task_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID NOT NULL REFERENCES task_databases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  content JSONB, -- Rich text content (future)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property values (actual data for each task)
CREATE TABLE IF NOT EXISTS task_property_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES task_pages(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES task_properties(id) ON DELETE CASCADE,
  value JSONB, -- Flexible storage: "In Progress", "2025-12-31", true, 5, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, property_id)
);

-- Reminders (push notifications for tasks)
CREATE TABLE IF NOT EXISTS task_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES task_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  minutes_before INTEGER DEFAULT 20,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring tasks
CREATE TABLE IF NOT EXISTS task_recurring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES task_pages(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL CHECK (pattern IN ('daily', 'weekdays', 'weekly', 'custom')),
  config JSONB, -- {days: [1,2,3,4,5], time: '09:00'}
  next_occurrence TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views (different ways to display tasks)
CREATE TABLE IF NOT EXISTS task_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID NOT NULL REFERENCES task_databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('table', 'calendar')),
  config JSONB, -- Filters, sorts, visible columns
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_workspaces_user_id ON task_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_task_databases_workspace_id ON task_databases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_properties_database_id ON task_properties(database_id);
CREATE INDEX IF NOT EXISTS idx_task_pages_database_id ON task_pages(database_id);
CREATE INDEX IF NOT EXISTS idx_task_property_values_page_id ON task_property_values(page_id);
CREATE INDEX IF NOT EXISTS idx_task_reminders_page_id ON task_reminders(page_id);
CREATE INDEX IF NOT EXISTS idx_task_reminders_user_id ON task_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_task_recurring_page_id ON task_recurring(page_id);
CREATE INDEX IF NOT EXISTS idx_task_views_database_id ON task_views(database_id);

-- Enable Row Level Security (RLS)
ALTER TABLE task_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Workspaces
CREATE POLICY "Users can view their own workspaces" ON task_workspaces
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workspaces" ON task_workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workspaces" ON task_workspaces
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workspaces" ON task_workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- Databases
CREATE POLICY "Users can view databases in their workspaces" ON task_databases
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM task_workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create databases in their workspaces" ON task_databases
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM task_workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update databases in their workspaces" ON task_databases
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM task_workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete databases in their workspaces" ON task_databases
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM task_workspaces WHERE user_id = auth.uid())
  );

-- Properties
CREATE POLICY "Users can view properties in their databases" ON task_properties
  FOR SELECT USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can create properties in their databases" ON task_properties
  FOR INSERT WITH CHECK (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can update properties in their databases" ON task_properties
  FOR UPDATE USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can delete properties in their databases" ON task_properties
  FOR DELETE USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );

-- Pages (Tasks)
CREATE POLICY "Users can view pages in their databases" ON task_pages
  FOR SELECT USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can create pages in their databases" ON task_pages
  FOR INSERT WITH CHECK (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can update pages in their databases" ON task_pages
  FOR UPDATE USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can delete pages in their databases" ON task_pages
  FOR DELETE USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );

-- Property Values
CREATE POLICY "Users can view property values for their pages" ON task_property_values
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can create property values for their pages" ON task_property_values
  FOR INSERT WITH CHECK (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can update property values for their pages" ON task_property_values
  FOR UPDATE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can delete property values for their pages" ON task_property_values
  FOR DELETE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Reminders
CREATE POLICY "Users can view their own reminders" ON task_reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reminders" ON task_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON task_reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON task_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Recurring Tasks
CREATE POLICY "Users can view recurring tasks for their pages" ON task_recurring
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can create recurring tasks for their pages" ON task_recurring
  FOR INSERT WITH CHECK (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can update recurring tasks for their pages" ON task_recurring
  FOR UPDATE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Users can delete recurring tasks for their pages" ON task_recurring
  FOR DELETE USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Views
CREATE POLICY "Users can view views in their databases" ON task_views
  FOR SELECT USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can create views in their databases" ON task_views
  FOR INSERT WITH CHECK (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can update views in their databases" ON task_views
  FOR UPDATE USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can delete views in their databases" ON task_views
  FOR DELETE USING (
    database_id IN (
      SELECT id FROM task_databases WHERE workspace_id IN (
        SELECT id FROM task_workspaces WHERE user_id = auth.uid()
      )
    )
  );
