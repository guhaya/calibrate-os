-- Helper: auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: create a blank profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- profiles
CREATE TABLE public.profiles (
  id                       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                text,
  date_of_birth            date,
  gender                   text        CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  weight_kg                numeric(5,2),
  height_cm                numeric(5,2),
  primary_goal             text        CHECK (primary_goal IN ('strength','endurance','body_composition','general_health','energy_cognition')),
  training_days_per_week   int         CHECK (training_days_per_week BETWEEN 1 AND 7),
  primary_activity         text,
  sleep_target_hours       numeric(3,1) DEFAULT 8.0,
  onboarding_completed     boolean     DEFAULT false,
  updated_at               timestamptz DEFAULT now()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- daily_checkins
CREATE TABLE public.daily_checkins (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             date        NOT NULL,
  sleep_hours      numeric(3,1),
  sleep_quality    int         CHECK (sleep_quality    BETWEEN 1 AND 5),
  energy_level     int         CHECK (energy_level     BETWEEN 1 AND 5),
  muscle_soreness  int         CHECK (muscle_soreness  BETWEEN 1 AND 5),
  stress_level     int         CHECK (stress_level     BETWEEN 1 AND 5),
  mood             int         CHECK (mood             BETWEEN 1 AND 5),
  readiness_score  int         CHECK (readiness_score  BETWEEN 0 AND 100),
  notes            text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX daily_checkins_user_date ON public.daily_checkins (user_id, date DESC);

-- training_sessions
CREATE TABLE public.training_sessions (
  id               uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             date  NOT NULL,
  activity_type    text  NOT NULL CHECK (activity_type IN ('strength','running','cycling','swimming','hiit','yoga_mobility','sport','other')),
  duration_minutes int   NOT NULL CHECK (duration_minutes > 0),
  rpe              int   NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  training_load    int   GENERATED ALWAYS AS (duration_minutes * rpe) STORED,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX training_sessions_user_date ON public.training_sessions (user_id, date DESC);

-- nutrition_logs
CREATE TABLE public.nutrition_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL,
  meal_type   text        NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  meal_name   text,
  calories    int,
  protein_g   numeric(6,2),
  carbs_g     numeric(6,2),
  fat_g       numeric(6,2),
  water_ml    int,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX nutrition_logs_user_date ON public.nutrition_logs (user_id, date DESC);

-- nutrition_targets
CREATE TABLE public.nutrition_targets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type     text        NOT NULL CHECK (target_type IN ('training_day','rest_day')),
  calories        int,
  protein_g       int,
  carbs_g         int,
  fat_g           int,
  effective_from  date        NOT NULL DEFAULT current_date,
  created_at      timestamptz DEFAULT now()
);

-- ai_daily_briefs
CREATE TABLE public.ai_daily_briefs (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                    date        NOT NULL,
  readiness_summary       text,
  training_recommendation text,
  nutrition_focus         text,
  recovery_action         text,
  raw_prompt              text,
  model_used              text,
  feedback                text        CHECK (feedback IN ('helpful','not_relevant')),
  generated_at            timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

-- goals
CREATE TABLE public.goals (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type     text        NOT NULL CHECK (goal_type IN ('strength','endurance','body_composition','general_health','energy_cognition')),
  description   text,
  target_value  numeric,
  target_unit   text,
  target_date   date,
  status        text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','achieved','abandoned')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TRIGGER goals_set_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a blank profile row whenever a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
