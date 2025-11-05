-- ============================================
-- ADD AUTO-ADVANCE FEATURE
-- Adds countdown timer to automatically go to next question
-- ============================================

DO $$
BEGIN
    -- Add auto_advance_time column to quiz_sets table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_sets' AND column_name = 'auto_advance_time'
    ) THEN
        ALTER TABLE public.quiz_sets
        ADD COLUMN auto_advance_time smallint DEFAULT 5;

        RAISE NOTICE '✅ Added auto_advance_time column to quiz_sets table';
    ELSE
        RAISE NOTICE '⚠️  auto_advance_time column already exists';
    END IF;
END $$;

-- Set default auto-advance time for existing quiz sets
UPDATE public.quiz_sets
SET auto_advance_time = 5
WHERE auto_advance_time IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Auto-advance feature added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⏱️  Default: 5 seconds after answer reveal';
    RAISE NOTICE '⚙️  Range: 0-30 seconds';
    RAISE NOTICE '   - 0 = Manual (click Next button)';
    RAISE NOTICE '   - 1-30 = Auto-advance after X seconds';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to use!';
    RAISE NOTICE '========================================';
END $$;
