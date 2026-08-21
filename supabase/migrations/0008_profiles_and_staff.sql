-- 0008_profiles_and_staff.sql
-- Profiles (staff directory + self-service), audit log, and role/org administration.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  organisation_id uuid references public.organisations(id) on delete set null,
  site_id uuid references public.sites(id) on delete set null,
  full_name text,
  work_email text,
  phone text,
  job_title text,
  department text,
  employee_number text,
  shift text,
  avatar_path text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_user_id_idx on public.profiles(user_id);
create index profiles_org_idx on public.profiles(organisation_id);
create index profiles_work_email_idx on public.profiles(work_email);
create index profiles_employee_number_idx on public.profiles(employee_number);

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  organisation_id uuid,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log(organisation_id);

alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.set_profile_org()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_count int;
begin
  if new.organisation_id is null then
    select count(*) into v_count from public.organisation_members where user_id = new.user_id;
    if v_count = 1 then
      select organisation_id into v_org from public.organisation_members where user_id = new.user_id limit 1;
      new.organisation_id = v_org;
    end if;
  end if;
  return new;
end; $$;

create trigger trg_profiles_set_org before insert on public.profiles
  for each row execute function public.set_profile_org();

create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.user_has_min_role(coalesce(new.organisation_id, old.organisation_id), 'administrator') then
    return new;
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'You cannot change the linked user account.';
  end if;
  if new.organisation_id is distinct from old.organisation_id then
    raise exception 'You cannot change your organisation.';
  end if;
  if new.site_id is distinct from old.site_id then
    raise exception 'You cannot change your site.';
  end if;
  if new.status is distinct from old.status then
    raise exception 'You cannot change account status.';
  end if;
  return new;
end; $$;

create trigger trg_profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = auth.uid());
create policy profiles_select_org on public.profiles
  for select to authenticated using (public.is_org_member(organisation_id));
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid() and (organisation_id is null or public.is_org_member(organisation_id)));
create policy profiles_update_own on public.profiles
  for update to authenticated using (user_id = auth.uid());
create policy profiles_update_manager on public.profiles
  for update to authenticated
  using (public.user_has_min_role(organisation_id, 'manager'))
  with check (public.user_has_min_role(organisation_id, 'manager'));
create policy profiles_delete_admin on public.profiles
  for delete to authenticated using (public.user_has_min_role(organisation_id, 'administrator'));

create or replace function public.log_audit(p_action text, p_target_type text, p_target_id text, p_detail jsonb, p_org uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, organisation_id, action, target_type, target_id, detail)
  values (auth.uid(), p_org, p_action, p_target_type, p_target_id, p_detail);
end; $$;

create or replace function public.list_org_members(p_org uuid)
returns table(user_id uuid, role public.user_role, full_name text, status text)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, p.full_name, p.status
  from public.organisation_members m
  left join public.profiles p on p.user_id = m.user_id
  where m.organisation_id = p_org and public.is_org_member(p_org)
  order by p.full_name;
$$;

create or replace function public.admin_set_member_role(p_org uuid, p_user uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.user_has_min_role(p_org, 'administrator') then
    raise exception 'Insufficient privileges to change roles.';
  end if;
  update public.organisation_members set role = p_role, updated_at = now()
  where organisation_id = p_org and user_id = p_user;
end; $$;

create or replace function public.admin_add_member(p_org uuid, p_user uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.user_has_min_role(p_org, 'administrator') then
    raise exception 'Insufficient privileges to add members.';
  end if;
  insert into public.organisation_members (organisation_id, user_id, role)
  values (p_org, p_user, p_role)
  on conflict (organisation_id, user_id) do update set role = excluded.role, updated_at = now();
end; $$;

create or replace function public.admin_remove_member(p_org uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.user_has_min_role(p_org, 'administrator') then
    raise exception 'Insufficient privileges to remove members.';
  end if;
  if p_user = auth.uid() then
    raise exception 'You cannot remove yourself.';
  end if;
  delete from public.organisation_members where organisation_id = p_org and user_id = p_user;
end; $$;

create or replace function public.bootstrap_organisation(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not authenticated.';
  end if;
  if exists (select 1 from public.organisation_members where user_id = v_uid) then
    raise exception 'You are already a member of an organisation.';
  end if;
  insert into public.organisations (name) values (p_name) returning id into v_org;
  insert into public.organisation_members (organisation_id, user_id, role) values (v_org, v_uid, 'administrator');
  return v_org;
end; $$;

revoke all on function public.log_audit(text,text,text,jsonb,uuid) from public;
revoke all on function public.list_org_members(uuid) from public;
revoke all on function public.admin_set_member_role(uuid,uuid,public.user_role) from public;
revoke all on function public.admin_add_member(uuid,uuid,public.user_role) from public;
revoke all on function public.admin_remove_member(uuid,uuid) from public;
revoke all on function public.bootstrap_organisation(text) from public;

grant execute on function public.log_audit(text,text,text,jsonb,uuid) to authenticated;
grant execute on function public.list_org_members(uuid) to authenticated;
grant execute on function public.admin_set_member_role(uuid,uuid,public.user_role) to authenticated;
grant execute on function public.admin_add_member(uuid,uuid,public.user_role) to authenticated;
grant execute on function public.admin_remove_member(uuid,uuid) to authenticated;
grant execute on function public.bootstrap_organisation(text) to authenticated;