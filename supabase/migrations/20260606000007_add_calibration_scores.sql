-- Calibration Score: rolling 7-day composite performance grade.
-- One row per user per day — upserted on each dashboard visit so the score
-- improves throughout the day as the user completes more behaviors.
CREATE TABLE public.calibration_scores (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                 date        NOT NULL DEFAULT CURRENT_DATE,
  score                int         NOT NULL CHECK (score BETWEEN 0 AND 100),
  readiness_component  int         NOT NULL CHECK (readiness_component  BETWEEN 0 AND 100),
  nutrition_component  int         NOT NULL CHECK (nutrition_component  BETWEEN 0 AND 100),
  training_component   int         NOT NULL CHECK (training_component   BETWEEN 0 AND 100),
  weight_component     int         NOT NULL CHECK (weight_component     BETWEEN 0 AND 100),
  checkin_component    int         NOT NULL CHECK (checkin_component    BETWEEN 0 AND 100),
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX calibration_scores_user_date_idx
  ON public.calibration_scores (user_id, date DESC);

ALTER TABLE public.calibration_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own calibration scores"
  ON public.calibration_scores
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
