-- Add task detail enhancements

-- Comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES task_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES task_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS task_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES task_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add description column to pages
ALTER TABLE task_pages ADD COLUMN IF NOT EXISTS description TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_page_id ON task_comments(page_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_page_id ON task_attachments(page_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_page_id ON task_activity(page_id);

-- RLS Policies
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their tasks" ON task_comments
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on their tasks" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for attachments
CREATE POLICY "Users can view attachments on their tasks" ON task_attachments
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create attachments on their tasks" ON task_attachments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete their own attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Activity log policies
CREATE POLICY "Users can view activity on their tasks" ON task_activity
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create activity on their tasks" ON task_activity
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    page_id IN (
      SELECT id FROM task_pages WHERE database_id IN (
        SELECT id FROM task_databases WHERE workspace_id IN (
          SELECT id FROM task_workspaces WHERE user_id = auth.uid()
        )
      )
    )
  );
