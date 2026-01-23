-- Enterprise Training Features Migration
-- Run this after add_new_features.sql

-- =====================================================
-- 1. CUSTOM BRANDING
-- =====================================================

-- Add branding to quiz_sets
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#7C3AED';
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#EC4899';
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE quiz_sets ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Create organization branding table
CREATE TABLE IF NOT EXISTS organization_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#7C3AED',
  secondary_color VARCHAR(7) DEFAULT '#EC4899',
  font_family VARCHAR(100) DEFAULT 'Inter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. COMPLIANCE TRAINING
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_set_id UUID NOT NULL REFERENCES quiz_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline DATE,
  reminder_days INTEGER[] DEFAULT '{7, 3, 1}', -- Days before deadline to send reminders
  is_mandatory BOOLEAN DEFAULT true,
  recurrence_type VARCHAR(20), -- 'none', 'monthly', 'quarterly', 'yearly'
  recurrence_months INTEGER, -- Number of months between recurrences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_course_id UUID NOT NULL REFERENCES compliance_courses(id) ON DELETE CASCADE,
  assigned_email VARCHAR(255) NOT NULL,
  assigned_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  passed BOOLEAN,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(compliance_course_id, assigned_email)
);

-- =====================================================
-- 3. NPS & SURVEYS
-- =====================================================

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  survey_type VARCHAR(20) DEFAULT 'general', -- 'nps', 'satisfaction', 'feedback', 'general'
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  show_after_quiz BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL, -- 'nps', 'rating', 'text', 'single_choice', 'multiple_choice'
  options JSONB, -- For choice questions: [{"value": "1", "label": "Very satisfied"}]
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  participant_id UUID,
  session_id UUID,
  response_value TEXT, -- For NPS: 0-10, For rating: 1-5, For text: actual text
  response_options JSONB, -- For multiple choice: selected options
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. MODERATED Q&A
-- =====================================================

CREATE TABLE IF NOT EXISTS qa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  allow_anonymous BOOLEAN DEFAULT true,
  require_moderation BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'answered', 'rejected'
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE,
  answer_text TEXT
);

CREATE TABLE IF NOT EXISTS qa_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, participant_id)
);

-- =====================================================
-- 5. PLAYER TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  nickname VARCHAR(255),
  avatar_id VARCHAR(50),
  total_games_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_played_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS player_game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_profile_id UUID REFERENCES player_profiles(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE SET NULL,
  quiz_name VARCHAR(255),
  score INTEGER,
  correct_answers INTEGER,
  total_questions INTEGER,
  accuracy DECIMAL(5,2),
  rank INTEGER,
  total_players INTEGER,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. THEMED PRESENTATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS presentation_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  background_type VARCHAR(20) DEFAULT 'gradient', -- 'gradient', 'image', 'video', 'solid'
  background_value TEXT NOT NULL, -- CSS gradient, URL, or color
  text_color VARCHAR(7) DEFAULT '#FFFFFF',
  accent_color VARCHAR(7) DEFAULT '#FFD700',
  font_family VARCHAR(100) DEFAULT 'Inter',
  is_premium BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  user_id UUID, -- NULL for system themes
  preview_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO presentation_themes (name, description, background_type, background_value, text_color, accent_color, is_public)
VALUES
  ('Classic Purple', 'Default purple gradient theme', 'gradient', 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', '#FFFFFF', '#FFD700', true),
  ('Ocean Blue', 'Calm ocean-inspired theme', 'gradient', 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)', '#FFFFFF', '#FCD34D', true),
  ('Forest Green', 'Nature-inspired green theme', 'gradient', 'linear-gradient(135deg, #10B981 0%, #059669 100%)', '#FFFFFF', '#FBBF24', true),
  ('Sunset Orange', 'Warm sunset colors', 'gradient', 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)', '#FFFFFF', '#FEF3C7', true),
  ('Midnight', 'Dark elegant theme', 'gradient', 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', '#FFFFFF', '#60A5FA', true),
  ('Corporate Blue', 'Professional business theme', 'gradient', 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', '#FFFFFF', '#FCD34D', true),
  ('Rose Gold', 'Elegant rose gold theme', 'gradient', 'linear-gradient(135deg, #FB7185 0%, #F472B6 100%)', '#FFFFFF', '#FEF3C7', true),
  ('Neon', 'Vibrant neon colors', 'gradient', 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)', '#FFFFFF', '#F0ABFC', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. HYBRID TRAINING (Slides + Quiz)
-- =====================================================

CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_hybrid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_module_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- 'slide', 'quiz', 'video', 'document'
  title VARCHAR(255),
  content TEXT, -- HTML content for slides
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE SET NULL,
  video_url TEXT,
  document_url TEXT,
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER, -- Estimated duration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  current_item_index INTEGER DEFAULT 0,
  completed_items JSONB DEFAULT '[]', -- Array of completed item IDs
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER DEFAULT 0 -- In seconds
);

-- =====================================================
-- 8. POLL RESPONSES (for poll question type)
-- =====================================================

CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES choices(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, question_id, participant_id)
);

-- =====================================================
-- 9. OPEN-ENDED RESPONSES
-- =====================================================

CREATE TABLE IF NOT EXISTS open_ended_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  score INTEGER DEFAULT 0, -- Manual scoring by host
  feedback TEXT, -- Host feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. AI COURSE GENERATION LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_course_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  input_type VARCHAR(20) NOT NULL, -- 'topic', 'pdf', 'pptx', 'url', 'text'
  input_content TEXT,
  generated_quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE SET NULL,
  generated_slides JSONB, -- Array of slide contents
  model_used VARCHAR(100),
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_compliance_courses_user ON compliance_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assignments_course ON compliance_assignments(compliance_course_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assignments_email ON compliance_assignments(assigned_email);
CREATE INDEX IF NOT EXISTS idx_surveys_user ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_session ON qa_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_player_game_history_player ON player_game_history(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_module ON training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_game_question ON poll_responses(game_id, question_id);

-- =====================================================
-- 12. ENABLE RLS
-- =====================================================

ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_module_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_ended_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_course_generations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13. RLS POLICIES (Allow all for now, restrict later)
-- =====================================================

CREATE POLICY "Allow all for organization_branding" ON organization_branding FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for compliance_courses" ON compliance_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for compliance_assignments" ON compliance_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for surveys" ON surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for survey_questions" ON survey_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for survey_responses" ON survey_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for qa_sessions" ON qa_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for qa_questions" ON qa_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for qa_upvotes" ON qa_upvotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for player_profiles" ON player_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for player_game_history" ON player_game_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for presentation_themes" ON presentation_themes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for training_modules" ON training_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for training_module_items" ON training_module_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for training_progress" ON training_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for poll_responses" ON poll_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for open_ended_responses" ON open_ended_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ai_course_generations" ON ai_course_generations FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 14. VIEWS FOR ANALYTICS
-- =====================================================

-- NPS Score View
CREATE OR REPLACE VIEW nps_scores AS
SELECT
  s.id as survey_id,
  s.title as survey_title,
  s.quiz_set_id,
  COUNT(CASE WHEN CAST(sr.response_value AS INTEGER) >= 9 THEN 1 END) as promoters,
  COUNT(CASE WHEN CAST(sr.response_value AS INTEGER) BETWEEN 7 AND 8 THEN 1 END) as passives,
  COUNT(CASE WHEN CAST(sr.response_value AS INTEGER) <= 6 THEN 1 END) as detractors,
  COUNT(sr.id) as total_responses,
  ROUND(
    (COUNT(CASE WHEN CAST(sr.response_value AS INTEGER) >= 9 THEN 1 END)::decimal / NULLIF(COUNT(sr.id), 0) * 100) -
    (COUNT(CASE WHEN CAST(sr.response_value AS INTEGER) <= 6 THEN 1 END)::decimal / NULLIF(COUNT(sr.id), 0) * 100)
  ) as nps_score
FROM surveys s
JOIN survey_questions sq ON sq.survey_id = s.id AND sq.question_type = 'nps'
LEFT JOIN survey_responses sr ON sr.question_id = sq.id
GROUP BY s.id, s.title, s.quiz_set_id;

-- Player Leaderboard View
CREATE OR REPLACE VIEW player_leaderboard AS
SELECT
  pp.id,
  pp.nickname,
  pp.avatar_id,
  pp.total_games_played,
  pp.total_score,
  pp.average_accuracy,
  pp.best_streak,
  pp.last_played_at,
  RANK() OVER (ORDER BY pp.total_score DESC) as global_rank
FROM player_profiles pp
WHERE pp.total_games_played > 0;
