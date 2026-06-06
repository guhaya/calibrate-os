-- Add the five structured section columns to ai_daily_briefs.
-- The original columns (readiness_summary, training_recommendation, etc.) are kept
-- for schema compatibility but will remain null — the new columns are canonical.
ALTER TABLE public.ai_daily_briefs
  ADD COLUMN IF NOT EXISTS today_status       text,
  ADD COLUMN IF NOT EXISTS key_insight        text,
  ADD COLUMN IF NOT EXISTS bottleneck         text,
  ADD COLUMN IF NOT EXISTS recommended_action text,
  ADD COLUMN IF NOT EXISTS expected_outcome   text;
