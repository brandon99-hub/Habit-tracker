-- Add templates table to existing schema

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);

-- RLS Policies
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" ON task_templates
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own templates" ON task_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own templates" ON task_templates
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own templates" ON task_templates
  FOR DELETE USING (auth.uid() = user_id);
