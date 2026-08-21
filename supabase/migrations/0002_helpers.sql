-- 0002_helpers.sql
-- Membership / role helper functions and record-context triggers.

create or replace function public.role_rank(r public.user_role)
returns int
language sql
immutable
as $$
  select case r
    when 'staff' then 1
    when 'supervisor' then 2
    when 'manager' then 3
    when 'administrator' then 4
    else 0
  end;
$$;

create or replace function public.user_org_role(p_org uuid)
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.organisation_members
  where organisation_id = p_org and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organisation_members
    where organisation_id = p_org and user_id = auth.uid()
  );
$$;

create or replace function public.user_has_min_role(p_org uuid, min_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.role_rank(public.user_org_role(p_org)) >= public.role_rank(min_role);
$$;

create or replace function public.user_orgs()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id from public.organisation_members where user_id = auth.uid();
$$;

create or replace function public.is_site_member(p_site uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_members where site_id = p_site and user_id = auth.uid()
  )
  or exists (
    select 1 from public.sites s
    where s.id = p_site and public.is_org_member(s.organisation_id)
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_record_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_count int;
begin
  if auth.uid() is not null then
    new.created_by = coalesce(new.created_by, auth.uid());
    if new.organisation_id is null then
      select count(*) into v_count from public.organisation_members where user_id = auth.uid();
      if v_count = 1 then
        select organisation_id into v_org from public.organisation_members where user_id = auth.uid() limit 1;
        new.organisation_id = v_org;
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.role_rank(public.user_role) from public;
revoke all on function public.user_org_role(uuid) from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.user_has_min_role(uuid, public.user_role) from public;
revoke all on function public.user_orgs() from public;
revoke all on function public.is_site_member(uuid) from public;

grant execute on function public.role_rank(public.user_role) to authenticated;
grant execute on function public.user_org_role(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.user_has_min_role(uuid, public.user_role) to authenticated;
grant execute on function public.user_orgs() to authenticated;
grant execute on function public.is_site_member(uuid) to authenticated;