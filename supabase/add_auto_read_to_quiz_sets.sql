-- Add Auto-Read feature to quiz_sets table
-- This allows quiz creators to enable automatic text-to-speech for questions

-- Add auto_read column to quiz_sets
ALTER TABLE quiz_sets
  ADD COLUMN IF NOT EXISTS auto_read BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN quiz_sets.auto_read IS 'Whether to automatically read questions aloud using text-to-speech';

-- Create index for faster queries on auto_read
CREATE INDEX IF NOT EXISTS idx_quiz_sets_auto_read ON quiz_sets(auto_read) WHERE auto_read = TRUE;
