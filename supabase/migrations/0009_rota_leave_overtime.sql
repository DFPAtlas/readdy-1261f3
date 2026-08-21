-- 0009_rota_leave_overtime.sql
-- Rota assignments, shift definitions, availability-backed leave/overtime
-- requests with approval workflow, and organisation settings.
-- Relationships use UUIDs / authenticated user ids, not initials or names.

-- ===== Roster linkage =====
alter table public.rota_staff add column if not exists user_id uuid;
alter table public.rota_staff add column if not exists organisation_id uuid references public.organisations(id) on delete cascade;
create unique index if not exists rota_staff_user_id_org_idx
  on public.rota_staff(organisation_id, user_id) where user_id is not null;

-- ===== Shift definitions (admin configurable) =====
create table public.shift_types (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  code text not null,
  name text not null,
  start_time text,
  end_time text,
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shift_types_org_idx on public.shift_types(organisation_id);

-- ===== Rota assignments (who works which shift on which date) =====
create table public.rota_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  staff_user_id uuid not null,
  shift_type_id uuid references public.shift_types(id) on delete set null,
  assignment_date date not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rota_assignments_unique unique (staff_user_id, assignment_date)
);
create index rota_assignments_org_date_idx on public.rota_assignments(organisation_id, assignment_date);

-- ===== Leave requests (approval workflow) =====
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  staff_user_id uuid not null,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending',
  reason text,
  decided_by uuid,
  decided_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leave_requests_org_idx on public.leave_requests(organisation_id);
create index leave_requests_staff_idx on public.leave_requests(staff_user_id);

-- ===== Overtime requests (approval workflow) =====
create table public.overtime_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  staff_user_id uuid not null,
  overtime_date date not null,
  start_time text,
  end_time text,
  hours numeric,
  reason text,
  status text not null default 'pending',
  decided_by uuid,
  decided_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index overtime_requests_org_idx on public.overtime_requests(organisation_id);
create index overtime_requests_staff_idx on public.overtime_requests(staff_user_id);

-- ===== Organisation settings =====
create table public.organisation_settings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null unique references public.organisations(id) on delete cascade,
  annual_leave_entitlement int not null default 25,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
create trigger trg_shift_types_updated before update on public.shift_types
  for each row execute function public.set_updated_at();
create trigger trg_rota_assignments_updated before update on public.rota_assignments
  for each row execute function public.set_updated_at();
create trigger trg_leave_requests_updated before update on public.leave_requests
  for each row execute function public.set_updated_at();
create trigger trg_overtime_requests_updated before update on public.overtime_requests
  for each row execute function public.set_updated_at();
create trigger trg_org_settings_updated before update on public.organisation_settings
  for each row execute function public.set_updated_at();

-- ===== RLS =====
alter table public.shift_types enable row level security;
alter table public.rota_assignments enable row level security;
alter table public.leave_requests enable row level security;
alter table public.overtime_requests enable row level security;
alter table public.organisation_settings enable row level security;

-- shift_types: read by members, configured by admins only
create policy shift_types_select on public.shift_types
  for select to authenticated using (public.is_org_member(organisation_id));
create policy shift_types_insert on public.shift_types
  for insert to authenticated with check (public.user_has_min_role(organisation_id, 'administrator'));
create policy shift_types_update on public.shift_types
  for update to authenticated using (public.user_has_min_role(organisation_id, 'administrator'));
create policy shift_types_delete on public.shift_types
  for delete to authenticated using (public.user_has_min_role(organisation_id, 'administrator'));

-- rota_assignments: read by members, edited by supervisors+
-- (mutations normally go through RPC, this is a backstop)
create policy rota_assignments_select on public.rota_assignments
  for select to authenticated using (public.is_org_member(organisation_id));
create policy rota_assignments_insert on public.rota_assignments
  for insert to authenticated with check (public.user_has_min_role(organisation_id, 'supervisor'));
create policy rota_assignments_update on public.rota_assignments
  for update to authenticated using (public.user_has_min_role(organisation_id, 'supervisor'));
create policy rota_assignments_delete on public.rota_assignments
  for delete to authenticated using (public.user_has_min_role(organisation_id, 'supervisor'));

-- leave_requests: read own or supervisor+; mutations via RPC only
create policy leave_requests_select on public.leave_requests
  for select to authenticated
  using (public.is_org_member(organisation_id)
         and (staff_user_id = auth.uid() or public.user_has_min_role(organisation_id, 'supervisor')));

-- overtime_requests: read own or supervisor+; mutations via RPC only
create policy overtime_requests_select on public.overtime_requests
  for select to authenticated
  using (public.is_org_member(organisation_id)
         and (staff_user_id = auth.uid() or public.user_has_min_role(organisation_id, 'supervisor')));

-- organisation_settings: read by members, edited by admins
create policy org_settings_select on public.organisation_settings
  for select to authenticated using (public.is_org_member(organisation_id));
create policy org_settings_update on public.organisation_settings
  for update to authenticated using (public.user_has_min_role(organisation_id, 'administrator'));

-- ===== Validated RPC functions (transactions + server-side checks) =====

create or replace function public.submit_leave_request(
  p_org uuid, p_staff uuid, p_type text, p_start date, p_end date, p_reason text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_ent int; v_used int; v_days int; v_id uuid; v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not authenticated.'; end if;
  if not public.is_org_member(p_org) then raise exception 'You are not a member of this organisation.'; end if;
  if p_start > p_end then raise exception 'End date must be on or after the start date.'; end if;
  if p_staff <> v_uid and not public.user_has_min_role(p_org, 'supervisor') then
    raise exception 'You can only submit leave for yourself.'; end if;
  if not exists (select 1 from public.organisation_members where organisation_id = p_org and user_id = p_staff) then
    raise exception 'Staff is not a member of this organisation.'; end if;
  if exists (
    select 1 from public.leave_requests
    where organisation_id = p_org and staff_user_id = p_staff
      and status in ('pending','approved')
      and start_date <= p_end and end_date >= p_start
  ) then raise exception 'This leave overlaps an existing request.'; end if;
  if p_type = 'Annual Leave' then
    select annual_leave_entitlement into v_ent from public.organisation_settings where organisation_id = p_org;
    v_ent := coalesce(v_ent, 25);
    v_days := (p_end - p_start) + 1;
    select coalesce(sum((end_date - start_date) + 1), 0) into v_used
      from public.leave_requests
      where organisation_id = p_org and staff_user_id = p_staff
        and leave_type = 'Annual Leave' and status in ('pending','approved');
    if v_used + v_days > v_ent then
      raise exception 'Insufficient annual leave entitlement (% days already used of %).', v_used, v_ent;
    end if;
  end if;
  insert into public.leave_requests (organisation_id, staff_user_id, leave_type, start_date, end_date, status, reason, created_by)
  values (p_org, p_staff, p_type, p_start, p_end, 'pending', p_reason, v_uid)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.submit_overtime_request(
  p_org uuid, p_staff uuid, p_date date, p_start text default null, p_end text default null,
  p_hours numeric default null, p_reason text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not authenticated.'; end if;
  if not public.is_org_member(p_org) then raise exception 'You are not a member of this organisation.'; end if;
  if p_staff <> v_uid and not public.user_has_min_role(p_org, 'supervisor') then
    raise exception 'You can only submit overtime for yourself.'; end if;
  if not exists (select 1 from public.organisation_members where organisation_id = p_org and user_id = p_staff) then
    raise exception 'Staff is not a member of this organisation.'; end if;
  insert into public.overtime_requests (organisation_id, staff_user_id, overtime_date, start_time, end_time, hours, reason, status, created_by)
  values (p_org, p_staff, p_date, p_start, p_end, p_hours, p_reason, 'pending', v_uid)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.decide_leave_request(p_request uuid, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.leave_requests%rowtype;
begin
  select * into r from public.leave_requests where id = p_request;
  if not found then raise exception 'Leave request not found.'; end if;
  if not public.user_has_min_role(r.organisation_id, 'supervisor') then
    raise exception 'You do not have permission to decide leave requests.'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid decision.'; end if;
  if r.status <> 'pending' then raise exception 'This request has already been decided.'; end if;
  update public.leave_requests set status = p_decision, decided_by = auth.uid(), decided_at = now()
  where id = p_request;
  perform public.log_audit('decide_leave', 'leave_request', p_request::text,
    jsonb_build_object('decision', p_decision, 'staff', r.staff_user_id, 'type', r.leave_type), r.organisation_id);
end; $$;

create or replace function public.decide_overtime_request(p_request uuid, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.overtime_requests%rowtype;
begin
  select * into r from public.overtime_requests where id = p_request;
  if not found then raise exception 'Overtime request not found.'; end if;
  if not public.user_has_min_role(r.organisation_id, 'supervisor') then
    raise exception 'You do not have permission to decide overtime requests.'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid decision.'; end if;
  if r.status <> 'pending' then raise exception 'This request has already been decided.'; end if;
  update public.overtime_requests set status = p_decision, decided_by = auth.uid(), decided_at = now()
  where id = p_request;
  perform public.log_audit('decide_overtime', 'overtime_request', p_request::text,
    jsonb_build_object('decision', p_decision, 'staff', r.staff_user_id), r.organisation_id);
end; $$;

create or replace function public.withdraw_leave_request(p_request uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.leave_requests%rowtype;
begin
  select * into r from public.leave_requests where id = p_request;
  if not found then raise exception 'Leave request not found.'; end if;
  if r.staff_user_id <> auth.uid() and not public.user_has_min_role(r.organisation_id, 'supervisor') then
    raise exception 'You can only withdraw your own requests.'; end if;
  if r.status <> 'pending' then raise exception 'Only pending requests can be withdrawn.'; end if;
  update public.leave_requests set status = 'cancelled', decided_by = auth.uid(), decided_at = now()
  where id = p_request;
end; $$;

create or replace function public.assign_shift(
  p_org uuid, p_staff uuid, p_date date, p_shift_type_id uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid; v_shift uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not authenticated.'; end if;
  if not public.user_has_min_role(p_org, 'supervisor') then
    raise exception 'You do not have permission to build the rota.'; end if;
  if not exists (select 1 from public.organisation_members where organisation_id = p_org and user_id = p_staff) then
    raise exception 'Staff is not a member of this organisation.'; end if;
  if p_shift_type_id is not null then
    select id into v_shift from public.shift_types where id = p_shift_type_id and organisation_id = p_org;
    if v_shift is null then raise exception 'Shift type does not belong to this organisation.'; end if;
  end if;
  insert into public.rota_assignments (organisation_id, staff_user_id, shift_type_id, assignment_date, created_by)
  values (p_org, p_staff, p_shift_type_id, p_date, v_uid)
  on conflict (staff_user_id, assignment_date)
  do update set shift_type_id = excluded.shift_type_id, updated_at = now()
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.remove_shift_assignment(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.rota_assignments%rowtype;
begin
  select * into r from public.rota_assignments where id = p_assignment;
  if not found then raise exception 'Assignment not found.'; end if;
  if not public.user_has_min_role(r.organisation_id, 'supervisor') then
    raise exception 'You do not have permission to edit the rota.'; end if;
  delete from public.rota_assignments where id = p_assignment;
end; $$;

create or replace function public.set_annual_leave_entitlement(p_org uuid, p_days int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.user_has_min_role(p_org, 'administrator') then
    raise exception 'Only administrators can change entitlement.'; end if;
  if p_days < 0 then raise exception 'Entitlement cannot be negative.'; end if;
  insert into public.organisation_settings (organisation_id, annual_leave_entitlement)
  values (p_org, p_days)
  on conflict (organisation_id) do update set annual_leave_entitlement = excluded.annual_leave_entitlement, updated_at = now();
end; $$;

-- Bootstrap: also seed settings + default shift types for a new organisation.
create or replace function public.bootstrap_organisation(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not authenticated.'; end if;
  if exists (select 1 from public.organisation_members where user_id = v_uid) then
    raise exception 'You are already a member of an organisation.'; end if;
  insert into public.organisations (name) values (p_name) returning id into v_org;
  insert into public.organisation_members (organisation_id, user_id, role) values (v_org, v_uid, 'administrator');
  insert into public.organisation_settings (organisation_id) values (v_org) on conflict do nothing;
  insert into public.shift_types (organisation_id, code, name, start_time, end_time, color, sort_order) values
    (v_org, 'D', 'Day', '06:00', '18:00', 'amber', 0),
    (v_org, 'N', 'Night', '18:00', '06:00', 'indigo', 1);
  return v_org;
end; $$;

revoke all on function public.submit_leave_request(uuid,uuid,text,date,date,text) from public;
revoke all on function public.submit_overtime_request(uuid,uuid,date,text,text,numeric,text) from public;
revoke all on function public.decide_leave_request(uuid,text) from public;
revoke all on function public.decide_overtime_request(uuid,text) from public;
revoke all on function public.withdraw_leave_request(uuid) from public;
revoke all on function public.assign_shift(uuid,uuid,date,uuid) from public;
revoke all on function public.remove_shift_assignment(uuid) from public;
revoke all on function public.set_annual_leave_entitlement(uuid,int) from public;

grant execute on function public.submit_leave_request(uuid,uuid,text,date,date,text) to authenticated;
grant execute on function public.submit_overtime_request(uuid,uuid,date,text,text,numeric,text) to authenticated;
grant execute on function public.decide_leave_request(uuid,text) to authenticated;
grant execute on function public.decide_overtime_request(uuid,text) to authenticated;
grant execute on function public.withdraw_leave_request(uuid) to authenticated;
grant execute on function public.assign_shift(uuid,uuid,date,uuid) to authenticated;
grant execute on function public.remove_shift_assignment(uuid) to authenticated;
grant execute on function public.set_annual_leave_entitlement(uuid,int) to authenticated;