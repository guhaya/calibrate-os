-- profiles: split into SELECT/INSERT/UPDATE so the service role can insert on signup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- daily_checkins
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checkins"
  ON public.daily_checkins
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- training_sessions
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own training sessions"
  ON public.training_sessions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- nutrition_logs
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nutrition logs"
  ON public.nutrition_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- nutrition_targets
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nutrition targets"
  ON public.nutrition_targets
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ai_daily_briefs
ALTER TABLE public.ai_daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily briefs"
  ON public.ai_daily_briefs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON public.goals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
