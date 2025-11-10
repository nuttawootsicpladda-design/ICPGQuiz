-- Chat & Reactions Feature
-- Add chat messages and emoji reactions for games

-- ============================================
-- 1. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id ON chat_messages(game_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- 2. REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reactions_game_id ON reactions(game_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions(created_at DESC);

-- Auto-delete old reactions (older than 10 seconds) to keep UI clean
-- This will be handled in the application layer

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone in game can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON chat_messages;

-- Anyone in the game can read messages
CREATE POLICY "Anyone in game can view messages" ON chat_messages
  FOR SELECT USING (
    game_id IN (
      SELECT game_id FROM participants WHERE id = auth.uid()
      UNION
      SELECT id FROM games WHERE host_user_id = auth.uid()
    )
  );

-- Participants can send messages (must be in the game)
CREATE POLICY "Participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    participant_id IN (
      SELECT id FROM participants WHERE id = auth.uid()
    )
  );

-- Reactions Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone in game can view reactions" ON reactions;
DROP POLICY IF EXISTS "Participants can send reactions" ON reactions;
DROP POLICY IF EXISTS "Participants can delete own reactions" ON reactions;

-- Anyone in the game can view reactions
CREATE POLICY "Anyone in game can view reactions" ON reactions
  FOR SELECT USING (
    game_id IN (
      SELECT game_id FROM participants WHERE id = auth.uid()
      UNION
      SELECT id FROM games WHERE host_user_id = auth.uid()
    )
  );

-- Participants can send reactions (must be in the game)
CREATE POLICY "Participants can send reactions" ON reactions
  FOR INSERT WITH CHECK (
    participant_id IN (
      SELECT id FROM participants WHERE id = auth.uid()
    )
  );

-- Participants can delete their own reactions
CREATE POLICY "Participants can delete own reactions" ON reactions
  FOR DELETE USING (
    participant_id = auth.uid()
  );

-- ============================================
-- 4. CLEANUP FUNCTION FOR OLD REACTIONS
-- ============================================

-- Function to clean up old reactions (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_reactions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM reactions
  WHERE created_at < NOW() - INTERVAL '10 seconds';
END;
$$;

-- You can call this function periodically or in your application
-- Example: SELECT cleanup_old_reactions();

COMMENT ON TABLE chat_messages IS 'Live chat messages during game lobby';
COMMENT ON TABLE reactions IS 'Emoji reactions during quiz (auto-expire after 10 seconds)';
