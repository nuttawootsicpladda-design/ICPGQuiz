-- ============================================
-- ADD AVATAR AND THEME SUPPORT
-- Combined migration for avatar_id and theme_id
-- Safe to run multiple times
-- ============================================

-- ============================================
-- 1. ADD AVATAR SUPPORT TO PARTICIPANTS
-- ============================================

DO $$
BEGIN
    -- Add avatar_id column to participants table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'participants' AND column_name = 'avatar_id'
    ) THEN
        ALTER TABLE public.participants
        ADD COLUMN avatar_id text DEFAULT 'cat';

        RAISE NOTICE '✅ Added avatar_id column to participants table';
    ELSE
        RAISE NOTICE '⚠️  avatar_id column already exists';
    END IF;
END $$;

-- Set default avatar for existing participants
UPDATE public.participants
SET avatar_id = 'cat'
WHERE avatar_id IS NULL OR avatar_id = '';

-- ============================================
-- 2. ADD THEME SUPPORT TO QUIZ SETS
-- ============================================

DO $$
BEGIN
    -- Add theme_id column to quiz_sets table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_sets' AND column_name = 'theme_id'
    ) THEN
        ALTER TABLE public.quiz_sets
        ADD COLUMN theme_id text DEFAULT 'classic';

        RAISE NOTICE '✅ Added theme_id column to quiz_sets table';
    ELSE
        RAISE NOTICE '⚠️  theme_id column already exists';
    END IF;
END $$;

-- Set default theme for existing quiz sets
UPDATE public.quiz_sets
SET theme_id = 'classic'
WHERE theme_id IS NULL OR theme_id = '';

-- ============================================
-- SETUP COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Avatar & Theme support added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎨 Available Avatars: 44 options';
    RAISE NOTICE '   Animals, Sea Creatures, Birds, Fantasy,';
    RAISE NOTICE '   Objects, Food, Sports, Nature';
    RAISE NOTICE '';
    RAISE NOTICE '🌈 Available Themes: 12 options';
    RAISE NOTICE '   classic, ocean, forest, sunset, space,';
    RAISE NOTICE '   neon, candy, dark, rainbow, fire, ice, nature';
    RAISE NOTICE '';
    RAISE NOTICE '📖 See documentation:';
    RAISE NOTICE '   - AVATAR_FEATURE.md';
    RAISE NOTICE '   - THEME_FEATURE.md';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to use!';
    RAISE NOTICE '========================================';
END $$;
