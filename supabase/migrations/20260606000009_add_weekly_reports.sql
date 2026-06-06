-- Weekly Performance Reports: one stored row per user per calendar week (Mon–Sun).
-- Upserted on every /reports page visit for the most recently completed week.
-- Trends are computed on-the-fly from adjacent stored rows and are NOT stored here.
CREATE TABLE public.weekly_reports (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start               date        NOT NULL,
  week_end                 date        NOT NULL,
  overall_score            int         NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  checkin_days             int         NOT NULL,
  checkin_rate             int         NOT NULL,
  avg_readiness            int,
  nutrition_compliant_days int         NOT NULL,
  nutrition_rate           int         NOT NULL,
  training_count           int         NOT NULL,
  training_target          int         NOT NULL,
  weight_start_kg          numeric(5,2),
  weight_end_kg            numeric(5,2),
  wins                     jsonb       NOT NULL DEFAULT '[]',
  bottlenecks              jsonb       NOT NULL DEFAULT '[]',
  recommended_focus        text        NOT NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX weekly_reports_user_week_idx
  ON public.weekly_reports (user_id, week_start DESC);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own weekly reports"
  ON public.weekly_reports
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
