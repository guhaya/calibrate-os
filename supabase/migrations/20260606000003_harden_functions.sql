-- Prevent search_path injection attacks on both trigger functions
ALTER FUNCTION public.set_updated_at()  SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- handle_new_user is internal (runs via auth trigger only).
-- Revoke direct REST API execution from all non-superuser roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
