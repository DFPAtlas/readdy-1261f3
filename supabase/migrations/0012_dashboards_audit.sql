-- 0012_dashboards_audit.sql
-- Hardens the audit trail (append-only, admin read), and secures ID-card records.

-- 1. Audit log: add site + correlation columns (nullable, "where available")
alter table public.audit_log
  add column if not exists site_id uuid,
  add column if not exists correlation_id text;

create index if not exists idx_audit_log_org_created on public.audit_log (organisation_id, created_at desc);

-- 2. Extend log_audit to accept optional site + correlation.
create or replace function public.log_audit(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_detail jsonb,
  p_org uuid default null,
  p_site uuid default null,
  p_correlation text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, organisation_id, site_id, action, target_type, target_id, detail, correlation_id)
  values (auth.uid(), p_org, p_site, p_action, p_target_type, p_target_id, p_detail, p_correlation);
end;
$$;

revoke all on function public.log_audit(text, text, text, jsonb, uuid, uuid, text) from public;
grant execute on function public.log_audit(text, text, text, jsonb, uuid, uuid, text) to authenticated;

-- 3. Append-only audit: administrators may read their organisation's trail; no role may
--    insert, update or delete audit rows directly (writes go through SECURITY DEFINER functions).
create policy "admin_select_audit_log"
  on public.audit_log
  for select to authenticated
  using (public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

-- 4. ID-card records: add identity + lifecycle columns
alter table public.id_card_requests
  add column if not exists organisation_id uuid,
  add column if not exists site_id uuid,
  add column if not exists created_by uuid,
  add column if not exists reference_number text,
  add column if not exists status text default 'submitted',
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_id_card_requests_org on public.id_card_requests (organisation_id);
create index if not exists idx_id_card_requests_deleted on public.id_card_requests (deleted_at);

-- Neutralise the old "anyone can do anything" policies (drop is blocked, so narrow + deny).
alter policy anon_select_id_card_requests on public.id_card_requests to authenticated using (public.is_org_member(organisation_id));
alter policy anon_insert_id_card_requests on public.id_card_requests to authenticated with check (false);
alter policy anon_update_id_card_requests on public.id_card_requests to authenticated using (false);
alter policy anon_delete_id_card_requests on public.id_card_requests to authenticated using (false);

-- 5. Submit + admin archive RPCs (set identity from session, validate, audit).
create or replace function public.submit_id_card_request(p_data jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.current_org();
  v_id bigint;
  v_ref text;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  if v_org is null then raise exception 'You are not a member of an organisation.'; end if;
  if p_data is null then raise exception 'Missing form data.'; end if;
  if coalesce(nullif(p_data->>'forename',''),'') = '' then raise exception 'Forename is required.'; end if;
  if coalesce(nullif(p_data->>'surname',''),'') = '' then raise exception 'Surname is required.'; end if;
  if coalesce(nullif(p_data->>'badge_type',''),'') = '' then raise exception 'Badge type is required.'; end if;

  insert into public.id_card_requests (
    new_replacement, pay_role_number, badge_type, surname, forename, department,
    expiry_date, manager, access_card, base_location, base_post_code, previous_last_name,
    position, unit, address, uer_number, powers, date_received, date_posted, badge_id_complete,
    organisation_id, created_by, reference_number, status
  ) values (
    nullif(p_data->>'new_replacement',''), nullif(p_data->>'pay_role_number',''),
    p_data->>'badge_type', p_data->>'surname', p_data->>'forename', nullif(p_data->>'department',''),
    nullif(p_data->>'expiry_date',''), nullif(p_data->>'manager',''), nullif(p_data->>'access_card',''),
    nullif(p_data->>'base_location',''), nullif(p_data->>'base_post_code',''), nullif(p_data->>'previous_last_name',''),
    nullif(p_data->>'position',''), nullif(p_data->>'unit',''), nullif(p_data->>'address',''),
    nullif(p_data->>'uer_number',''), nullif(p_data->>'powers',''), nullif(p_data->>'date_received',''),
    nullif(p_data->>'date_posted',''), nullif(p_data->>'badge_id_complete',''),
    v_org, auth.uid(), '', 'submitted'
  ) returning id into v_id;

  v_ref := public.make_reference('IDC', v_id);
  update public.id_card_requests set reference_number = v_ref where id = v_id;

  perform public.log_audit('submit', 'id_card_request', v_id::text, jsonb_build_object('reference', v_ref), v_org);

  return v_ref;
end;
$$;

revoke all on function public.submit_id_card_request(jsonb) from public;
grant execute on function public.submit_id_card_request(jsonb) to authenticated;

create or replace function public.archive_all_id_cards()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.current_org();
  v_count integer;
begin
  if not public.user_has_min_role(v_org, 'administrator'::public.user_role) then
    raise exception 'Administrator access required.';
  end if;
  update public.id_card_requests
    set deleted_at = now(), status = 'archived', updated_at = now()
    where organisation_id = v_org and deleted_at is null;
  get diagnostics v_count = row_count;
  perform public.log_audit('archive_all', 'id_card_request', 'bulk', jsonb_build_object('count', v_count), v_org);
  return v_count;
end;
$$;

revoke all on function public.archive_all_id_cards() from public;
grant execute on function public.archive_all_id_cards() to authenticated;