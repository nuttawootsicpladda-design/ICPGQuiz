-- ============================================
-- TEAMS MODE FEATURE
-- Add team-based gameplay support
-- ============================================

-- ============================================
-- 1. UPDATE GAMES TABLE
-- ============================================

-- Add team_mode column to games
ALTER TABLE games
ADD COLUMN IF NOT EXISTS team_mode BOOLEAN DEFAULT FALSE;

-- Add max_teams column (2-4 teams)
ALTER TABLE games
ADD COLUMN IF NOT EXISTS max_teams SMALLINT DEFAULT 2;

-- Add constraint for max_teams
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_max_teams'
    ) THEN
        ALTER TABLE games ADD CONSTRAINT check_max_teams CHECK (max_teams >= 2 AND max_teams <= 4);
    END IF;
END $$;

COMMENT ON COLUMN games.team_mode IS 'Whether this game uses team mode';
COMMENT ON COLUMN games.max_teams IS 'Number of teams (2-4)';

-- ============================================
-- 2. UPDATE PARTICIPANTS TABLE
-- ============================================

-- Add team_id column to participants
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS team_id VARCHAR(20);

-- team_id can be: 'red', 'blue', 'green', 'yellow'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_team_id'
    ) THEN
        ALTER TABLE participants
        ADD CONSTRAINT check_team_id
        CHECK (team_id IS NULL OR team_id IN ('red', 'blue', 'green', 'yellow'));
    END IF;
END $$;

COMMENT ON COLUMN participants.team_id IS 'Team assignment: red, blue, green, or yellow';

-- ============================================
-- 3. CREATE TEAM RESULTS VIEW
-- ============================================

-- View for team scores (real-time)
CREATE OR REPLACE VIEW team_results AS
    SELECT
        p.game_id,
        p.team_id,
        COUNT(DISTINCT p.id) as team_member_count,
        COALESCE(SUM(a.score), 0) as total_team_score,
        COALESCE(AVG(a.score), 0) as avg_score_per_answer,
        COALESCE(SUM(CASE WHEN c.is_correct THEN 1 ELSE 0 END), 0) as correct_answers,
        COALESCE(COUNT(a.id), 0) as total_answers
    FROM participants p
    LEFT JOIN answers a ON p.id = a.participant_id
    LEFT JOIN choices c ON a.choice_id = c.id
    WHERE p.team_id IS NOT NULL
    GROUP BY p.game_id, p.team_id;

COMMENT ON VIEW team_results IS 'Real-time team scores and statistics';

-- ============================================
-- 4. CREATE TEAM LEADERBOARD VIEW
-- ============================================

-- View for team leaderboard (sorted by score)
CREATE OR REPLACE VIEW team_leaderboard AS
    SELECT
        game_id,
        team_id,
        team_member_count,
        total_team_score,
        avg_score_per_answer,
        correct_answers,
        total_answers,
        RANK() OVER (PARTITION BY game_id ORDER BY total_team_score DESC) as rank
    FROM team_results
    ORDER BY game_id, total_team_score DESC;

COMMENT ON VIEW team_leaderboard IS 'Team leaderboard with rankings';

-- ============================================
-- 5. CREATE TEAM MEMBER VIEW
-- ============================================

-- View to see all members of each team with their individual scores
CREATE OR REPLACE VIEW team_members AS
    SELECT
        p.game_id,
        p.team_id,
        p.id as participant_id,
        p.nickname,
        p.avatar_id,
        COALESCE(SUM(a.score), 0) as individual_score,
        COALESCE(COUNT(a.id), 0) as answers_submitted
    FROM participants p
    LEFT JOIN answers a ON p.id = a.participant_id
    WHERE p.team_id IS NOT NULL
    GROUP BY p.game_id, p.team_id, p.id, p.nickname, p.avatar_id;

COMMENT ON VIEW team_members IS 'Individual members and their contributions to teams';

-- ============================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get team name and color
CREATE OR REPLACE FUNCTION get_team_info(team_id_param TEXT)
RETURNS TABLE (
    team_id TEXT,
    team_name TEXT,
    team_color TEXT,
    team_emoji TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        team_id_param as team_id,
        CASE team_id_param
            WHEN 'red' THEN 'Red Dragons'
            WHEN 'blue' THEN 'Blue Sharks'
            WHEN 'green' THEN 'Green Ninjas'
            WHEN 'yellow' THEN 'Yellow Lightning'
            ELSE 'Unknown Team'
        END as team_name,
        CASE team_id_param
            WHEN 'red' THEN '#EF4444'
            WHEN 'blue' THEN '#3B82F6'
            WHEN 'green' THEN '#10B981'
            WHEN 'yellow' THEN '#F59E0B'
            ELSE '#6B7280'
        END as team_color,
        CASE team_id_param
            WHEN 'red' THEN '🐉'
            WHEN 'blue' THEN '🦈'
            WHEN 'green' THEN '🥷'
            WHEN 'yellow' THEN '⚡'
            ELSE '❓'
        END as team_emoji;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_team_info IS 'Get team display information';

-- Function to auto-assign player to team (balance teams)
CREATE OR REPLACE FUNCTION auto_assign_team(game_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    team_counts RECORD;
    assigned_team TEXT;
    max_teams_count SMALLINT;
BEGIN
    -- Get max teams for this game
    SELECT max_teams INTO max_teams_count FROM games WHERE id = game_id_param;

    -- Count current team sizes
    WITH team_sizes AS (
        SELECT
            team_id,
            COUNT(*) as member_count
        FROM participants
        WHERE game_id = game_id_param AND team_id IS NOT NULL
        GROUP BY team_id
    ),
    all_teams AS (
        SELECT unnest(ARRAY['red', 'blue', 'green', 'yellow']::TEXT[]) as team_id
    ),
    available_teams AS (
        SELECT
            at.team_id,
            COALESCE(ts.member_count, 0) as member_count
        FROM all_teams at
        LEFT JOIN team_sizes ts ON at.team_id = ts.team_id
        WHERE
            (max_teams_count = 2 AND at.team_id IN ('red', 'blue'))
            OR (max_teams_count = 3 AND at.team_id IN ('red', 'blue', 'green'))
            OR (max_teams_count = 4)
        ORDER BY member_count ASC, RANDOM()
        LIMIT 1
    )
    SELECT team_id INTO assigned_team FROM available_teams;

    RETURN assigned_team;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_assign_team IS 'Auto-assign player to team with least members';

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for team_id lookups
CREATE INDEX IF NOT EXISTS idx_participants_team_id ON participants(team_id);
CREATE INDEX IF NOT EXISTS idx_participants_game_team ON participants(game_id, team_id);

-- ============================================
-- 8. SAMPLE DATA FOR TESTING (Optional)
-- ============================================

-- Uncomment below to test with sample data
/*
-- Create a test game with teams
INSERT INTO games (quiz_set_id, team_mode, max_teams, phase)
VALUES (
    (SELECT id FROM quiz_sets LIMIT 1),
    TRUE,
    4,
    'lobby'
);
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Teams Mode migration completed successfully!';
    RAISE NOTICE 'New columns: games.team_mode, games.max_teams, participants.team_id';
    RAISE NOTICE 'New views: team_results, team_leaderboard, team_members';
    RAISE NOTICE 'New functions: get_team_info(), auto_assign_team()';
END $$;
