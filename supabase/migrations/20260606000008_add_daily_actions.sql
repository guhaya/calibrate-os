-- Highest Leverage Action: one rule-based recommendation per user per day.
-- Upserted on every dashboard/brief visit so the action evolves as the
-- user completes behaviors throughout the day.
CREATE TABLE public.daily_actions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            date        NOT NULL DEFAULT CURRENT_DATE,
  action          text        NOT NULL,
  reason          text        NOT NULL,
  expected_impact text        NOT NULL,
  pillar          text        NOT NULL, -- checkin | recovery | nutrition | training | weight
  priority        text        NOT NULL, -- high | medium | low
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX daily_actions_user_date_idx
  ON public.daily_actions (user_id, date DESC);

ALTER TABLE public.daily_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own daily actions"
  ON public.daily_actions
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
