-- Add optional steps tracking to the daily check-in
-- Nullable: logging steps is not required to complete the check-in
ALTER TABLE public.daily_checkins
  ADD COLUMN steps integer;
