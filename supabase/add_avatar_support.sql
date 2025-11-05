-- ============================================
-- ADD AVATAR SUPPORT TO PARTICIPANTS
-- Safe migration that adds avatar_id column
-- ============================================

-- Add avatar_id column to participants table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'participants' AND column_name = 'avatar_id'
    ) THEN
        ALTER TABLE public.participants
        ADD COLUMN avatar_id text default 'cat';

        RAISE NOTICE '✅ Added avatar_id column to participants table';
    ELSE
        RAISE NOTICE '⚠️  avatar_id column already exists';
    END IF;
END $$;

-- Set default avatar for existing participants
UPDATE public.participants
SET avatar_id = 'cat'
WHERE avatar_id IS NULL OR avatar_id = 'default';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Avatar support added successfully!';
END $$;
