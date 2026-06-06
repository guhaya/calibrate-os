-- Add session-level load tracking fields to workouts.
-- activity_type defaults to 'strength' and backfills all existing rows.
-- duration_minutes and session_rpe are optional; training_load is computed from them.
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS activity_type    text    NOT NULL DEFAULT 'strength'
    CHECK (activity_type IN ('strength','running','cycling','swimming','hiit','yoga_mobility','sport','other')),
  ADD COLUMN IF NOT EXISTS duration_minutes int     CHECK (duration_minutes > 0),
  ADD COLUMN IF NOT EXISTS session_rpe      int     CHECK (session_rpe BETWEEN 1 AND 10);

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS training_load int GENERATED ALWAYS AS (
    CASE WHEN duration_minutes IS NOT NULL AND session_rpe IS NOT NULL
      THEN duration_minutes * session_rpe ELSE NULL END
  ) STORED;
