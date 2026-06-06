-- Weight logs table: one entry per user per day, full CRUD history
CREATE TABLE public.weight_logs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date        NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    numeric(5,2) NOT NULL,
  notes        text,
  created_at   timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT weight_logs_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX weight_logs_user_date_idx ON public.weight_logs (user_id, date DESC);

-- RLS
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own weight logs"
  ON public.weight_logs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
