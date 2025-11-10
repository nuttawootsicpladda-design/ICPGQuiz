-- Add Team Mode support to quiz_sets table
-- This allows quiz creators to configure team mode settings when creating quizzes

-- Add team_mode and max_teams columns to quiz_sets
ALTER TABLE quiz_sets
  ADD COLUMN IF NOT EXISTS team_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_teams SMALLINT DEFAULT 2;

-- Add comment for documentation
COMMENT ON COLUMN quiz_sets.team_mode IS 'Whether this quiz should be played in team mode';
COMMENT ON COLUMN quiz_sets.max_teams IS 'Maximum number of teams (2-4) if team mode is enabled';

-- Add check constraint to ensure max_teams is between 2 and 4
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_sets_max_teams_check'
  ) THEN
    ALTER TABLE quiz_sets
      ADD CONSTRAINT quiz_sets_max_teams_check
      CHECK (max_teams >= 2 AND max_teams <= 4);
  END IF;
END $$;

-- Create index for faster queries on team_mode
CREATE INDEX IF NOT EXISTS idx_quiz_sets_team_mode ON quiz_sets(team_mode) WHERE team_mode = TRUE;
