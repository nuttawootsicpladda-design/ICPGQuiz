-- Add new features: Self-paced mode, Certificates, Word Cloud, Tournaments
-- Run this in Supabase SQL Editor

-- 1. Add self_paced mode to quiz_sets
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS allow_self_paced BOOLEAN DEFAULT false;
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 60;

-- 2. Add question type for Word Cloud and other types
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'multiple_choice';
-- question_type: 'multiple_choice', 'word_cloud', 'poll', 'true_false', 'open_ended'

-- 3. Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quiz_set_id UUID NOT NULL REFERENCES quiz_sets(id) ON DELETE CASCADE,
  nickname VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN DEFAULT false,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_number VARCHAR(50) UNIQUE
);

-- 4. Create word_cloud_responses table
CREATE TABLE IF NOT EXISTS word_cloud_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  host_user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed
  max_rounds INTEGER DEFAULT 3,
  current_round INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create tournament_rounds table
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  quiz_set_id UUID NOT NULL REFERENCES quiz_sets(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create tournament_participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID,
  nickname VARCHAR(255) NOT NULL,
  avatar_id VARCHAR(50),
  total_score INTEGER DEFAULT 0,
  rounds_played INTEGER DEFAULT 0,
  is_eliminated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create self_paced_sessions table for tracking self-paced attempts
CREATE TABLE IF NOT EXISTS self_paced_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_set_id UUID NOT NULL REFERENCES quiz_sets(id) ON DELETE CASCADE,
  user_id UUID,
  nickname VARCHAR(255) NOT NULL,
  avatar_id VARCHAR(50),
  current_question INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken INTEGER -- in seconds
);

-- 9. Create self_paced_answers table
CREATE TABLE IF NOT EXISTS self_paced_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES self_paced_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES choices(id),
  is_correct BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  time_taken INTEGER, -- in milliseconds
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_participant ON certificates(participant_id);
CREATE INDEX IF NOT EXISTS idx_certificates_game ON certificates(game_id);
CREATE INDEX IF NOT EXISTS idx_word_cloud_game_question ON word_cloud_responses(game_id, question_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_self_paced_sessions_quiz ON self_paced_sessions(quiz_set_id);
CREATE INDEX IF NOT EXISTS idx_self_paced_answers_session ON self_paced_answers(session_id);

-- 11. Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_cloud_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_paced_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_paced_answers ENABLE ROW LEVEL SECURITY;

-- 12. Create policies for public access (adjust as needed)
CREATE POLICY "Allow all for certificates" ON certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for word_cloud_responses" ON word_cloud_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tournament_rounds" ON tournament_rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tournament_participants" ON tournament_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for self_paced_sessions" ON self_paced_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for self_paced_answers" ON self_paced_answers FOR ALL USING (true) WITH CHECK (true);

-- 13. Create view for self-paced leaderboard
CREATE OR REPLACE VIEW self_paced_leaderboard AS
SELECT
  sps.quiz_set_id,
  sps.nickname,
  sps.avatar_id,
  sps.score,
  sps.correct_answers,
  sps.time_taken,
  sps.completed_at,
  qs.name as quiz_name,
  RANK() OVER (PARTITION BY sps.quiz_set_id ORDER BY sps.score DESC, sps.time_taken ASC) as rank
FROM self_paced_sessions sps
JOIN quiz_sets qs ON sps.quiz_set_id = qs.id
WHERE sps.completed_at IS NOT NULL;

-- 14. Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.certificate_number := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Trigger for certificate number generation
DROP TRIGGER IF EXISTS set_certificate_number ON certificates;
CREATE TRIGGER set_certificate_number
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION generate_certificate_number();
