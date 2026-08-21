-- 0007_current_user_role.sql
-- Returns the highest role the current user holds across all memberships.
-- Used by the frontend role guard. SECURITY DEFINER bypasses RLS so the
-- membership tables stay unreadable directly by clients.

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.organisation_members
  where user_id = auth.uid()
  order by public.role_rank(role) desc
  limit 1;
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;