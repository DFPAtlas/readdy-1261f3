-- 0004_rls_policies.sql
-- Replace permissive anon policies with role-based, organisation-scoped policies.

do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and policyname like 'anon_%'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Application tables: org members read/write; supervisor+ update; admin-only delete.
-- Soft-delete (setting deleted_at) is an UPDATE, so it is covered by the update policy.

create policy "incident_reports_select_org_member" on public.incident_reports
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "incident_reports_insert_org_member" on public.incident_reports
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "incident_reports_update_supervisor_or_owner" on public.incident_reports
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "incident_reports_delete_admin_only" on public.incident_reports
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "cctv_incident_reports_select_org_member" on public.cctv_incident_reports
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "cctv_incident_reports_insert_org_member" on public.cctv_incident_reports
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "cctv_incident_reports_update_supervisor_or_owner" on public.cctv_incident_reports
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "cctv_incident_reports_delete_admin_only" on public.cctv_incident_reports
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "dob_entries_select_org_member" on public.dob_entries
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "dob_entries_insert_org_member" on public.dob_entries
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "dob_entries_update_supervisor_or_owner" on public.dob_entries
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "dob_entries_delete_admin_only" on public.dob_entries
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "id_card_requests_select_org_member" on public.id_card_requests
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "id_card_requests_insert_org_member" on public.id_card_requests
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "id_card_requests_update_supervisor_or_owner" on public.id_card_requests
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "id_card_requests_delete_admin_only" on public.id_card_requests
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "report_files_select_org_member" on public.report_files
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "report_files_insert_org_member" on public.report_files
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "report_files_update_supervisor_or_owner" on public.report_files
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "report_files_delete_admin_only" on public.report_files
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "rota_staff_select_org_member" on public.rota_staff
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "rota_staff_insert_org_member" on public.rota_staff
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "rota_staff_update_supervisor_or_owner" on public.rota_staff
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "rota_staff_delete_admin_only" on public.rota_staff
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "leave_records_select_org_member" on public.leave_records
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "leave_records_insert_org_member" on public.leave_records
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "leave_records_update_supervisor_or_owner" on public.leave_records
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "leave_records_delete_admin_only" on public.leave_records
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "fire_door_inspection_reports_select_org_member" on public.fire_door_inspection_reports
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "fire_door_inspection_reports_insert_org_member" on public.fire_door_inspection_reports
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "fire_door_inspection_reports_update_supervisor_or_owner" on public.fire_door_inspection_reports
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "fire_door_inspection_reports_delete_admin_only" on public.fire_door_inspection_reports
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

create policy "comms_room_log_select_org_member" on public.comms_room_log
  for select to authenticated
  using (organisation_id is not null and public.is_org_member(organisation_id) and deleted_at is null);

create policy "comms_room_log_insert_org_member" on public.comms_room_log
  for insert to authenticated
  with check (organisation_id is not null and public.is_org_member(organisation_id));

create policy "comms_room_log_update_supervisor_or_owner" on public.comms_room_log
  for update to authenticated
  using (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  )
  with check (
    organisation_id is not null and public.is_org_member(organisation_id)
    and (public.user_has_min_role(organisation_id, 'supervisor'::public.user_role) or created_by = auth.uid())
  );

create policy "comms_room_log_delete_admin_only" on public.comms_room_log
  for delete to authenticated
  using (organisation_id is not null and public.user_has_min_role(organisation_id, 'administrator'::public.user_role));

-- Membership tables: members can read their own organisation's membership list,
-- but cannot insert/update/delete memberships (prevents role self-escalation).

create policy "organisation_members_select_own_org" on public.organisation_members
  for select to authenticated
  using (public.is_org_member(organisation_id));

create policy "site_members_select_own_org" on public.site_members
  for select to authenticated
  using (public.is_site_member(site_id));

create policy "organisations_select_member" on public.organisations
  for select to authenticated
  using (public.is_org_member(id));

create policy "sites_select_member" on public.sites
  for select to authenticated
  using (public.is_org_member(organisation_id));

-- Storage object tables.

do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'storage' and policyname in (
      'public_bucket_read_all', 'public_bucket_write_auth',
      'private_bucket_read_auth', 'private_bucket_write_auth',
      'private_bucket_update_auth', 'private_bucket_delete_auth'
    )
  loop
    execute format('drop policy %I on storage.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "public_bucket_read_all" on storage.objects
  for select using (bucket_id = 'public');

create policy "public_bucket_write_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'public');

create policy "private_bucket_read_auth" on storage.objects
  for select to authenticated using (bucket_id = 'private');

create policy "private_bucket_write_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'private');

create policy "private_bucket_update_auth" on storage.objects
  for update to authenticated using (bucket_id = 'private');

create policy "private_bucket_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'private');