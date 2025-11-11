# Supabase Database Migration Required

## ⚠️ Error: "Could not find the 'auto_read' column"

If you see this error, you need to run the following SQL migrations on your Supabase database.

## How to Run Migrations

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project
- Click on **SQL Editor** (left sidebar)

### 2. Run These Migrations (in order)

#### Migration 1: Add Team Mode to quiz_sets
```sql
-- File: supabase/add_team_mode_to_quiz_sets.sql
ALTER TABLE quiz_sets
  ADD COLUMN IF NOT EXISTS team_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_teams SMALLINT DEFAULT 2;

COMMENT ON COLUMN quiz_sets.team_mode IS 'Whether this quiz should be played in team mode';
COMMENT ON COLUMN quiz_sets.max_teams IS 'Maximum number of teams (2-4) if team mode is enabled';
```

#### Migration 2: Add Auto Read to quiz_sets
```sql
-- File: supabase/add_auto_read_to_quiz_sets.sql
ALTER TABLE quiz_sets
  ADD COLUMN IF NOT EXISTS auto_read BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN quiz_sets.auto_read IS 'Whether to automatically read questions aloud using text-to-speech';

CREATE INDEX IF NOT EXISTS idx_quiz_sets_auto_read ON quiz_sets(auto_read) WHERE auto_read = TRUE;
```

#### Migration 3: Add Team Mode to games table
```sql
-- File: supabase/add_teams_mode.sql (partial)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS team_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_teams SMALLINT DEFAULT 2;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS team_id VARCHAR(20);
```

### 3. Verify Migrations

Run this query to verify all columns exist:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_sets'
ORDER BY column_name;
```

You should see:
- `auto_read` (boolean)
- `team_mode` (boolean)
- `max_teams` (smallint)

## Alternative: Copy Full Migration Files

Instead of running individual commands, you can copy and run these complete files:

1. `supabase/add_team_mode_to_quiz_sets.sql`
2. `supabase/add_auto_read_to_quiz_sets.sql`
3. `supabase/add_teams_mode.sql`

## After Running Migrations

1. The error should disappear
2. New features will work:
   - ✅ Team Mode
   - ✅ Auto-read questions (Text-to-Speech)
   - ✅ Live Chat & Reactions

## Need Help?

If migrations fail, check:
- Table `quiz_sets` exists
- You have proper permissions
- Previous migrations have been run

Contact your database admin if issues persist.
