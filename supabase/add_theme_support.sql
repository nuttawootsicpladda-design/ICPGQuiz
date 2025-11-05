-- ============================================
-- ADD THEME SUPPORT TO QUIZ SETS
-- Safe migration that adds theme_id column
-- ============================================

-- Add theme_id column to quiz_sets table
DO $$
BEGIN
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
WHERE theme_id IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Theme support added successfully!';
    RAISE NOTICE '📌 Available themes: classic, ocean, forest, sunset, space, neon, candy, dark, rainbow, fire, ice, nature';
END $$;
