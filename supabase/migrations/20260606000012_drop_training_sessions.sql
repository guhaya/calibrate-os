-- training_sessions is orphaned: no UI ever wrote to it, zero rows.
-- Canonical training model is now workouts + workout_exercises.
-- ACWR and training load are computed from workouts.training_load (GENERATED column).
DROP TABLE IF EXISTS public.training_sessions;
