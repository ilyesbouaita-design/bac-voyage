-- ============================================================
-- BacAllemand — Security hardening (advisor follow-ups)
-- ============================================================

-- Pin search_path on the updated_at trigger function
alter function public.set_updated_at() set search_path = public;

-- Trigger-only functions must not be callable via PostgREST RPC.
-- (Triggers still fire regardless of EXECUTE grants.)
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.guard_profile_role() from public, anon, authenticated;

-- is_admin() is used inside RLS policies, so authenticated must keep EXECUTE,
-- but it should not be reachable by anonymous callers.
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
