-- workouts: one row per training session
CREATE TABLE public.workouts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  name        text,
  notes       text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX workouts_user_date_idx ON public.workouts (user_id, date DESC);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own workouts"
  ON public.workouts
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- workout_exercises: individual exercises within a session
-- Cascades on workout delete so no orphan exercise rows can exist.
CREATE TABLE public.workout_exercises (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id    uuid          NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id       uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text          NOT NULL,
  sets          int           NOT NULL CHECK (sets  > 0),
  reps          int           NOT NULL CHECK (reps  > 0),
  weight_kg     numeric(7,2)  NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
  rpe           int           CHECK (rpe BETWEEN 1 AND 10),
  sort_order    int           NOT NULL DEFAULT 0,
  created_at    timestamptz   DEFAULT now() NOT NULL
);

CREATE INDEX workout_exercises_workout_idx ON public.workout_exercises (workout_id);
CREATE INDEX workout_exercises_user_idx   ON public.workout_exercises (user_id);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own workout exercises"
  ON public.workout_exercises
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
