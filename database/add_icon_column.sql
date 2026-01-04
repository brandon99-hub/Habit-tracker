-- Add icon column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Sparkles';

-- Update existing habits to have a default icon
UPDATE habits SET icon = 'Sparkles' WHERE icon IS NULL;
