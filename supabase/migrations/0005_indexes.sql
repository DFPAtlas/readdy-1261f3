-- 0005_indexes.sql
-- Indexes supporting RLS filters and common queries.

create index if not exists idx_incident_reports_org on public.incident_reports (organisation_id);
create index if not exists idx_incident_reports_site on public.incident_reports (site_id);
create index if not exists idx_incident_reports_created_by on public.incident_reports (created_by);
create index if not exists idx_incident_reports_created_at on public.incident_reports (created_at desc);

create index if not exists idx_cctv_incident_reports_org on public.cctv_incident_reports (organisation_id);
create index if not exists idx_cctv_incident_reports_site on public.cctv_incident_reports (site_id);
create index if not exists idx_cctv_incident_reports_created_by on public.cctv_incident_reports (created_by);
create index if not exists idx_cctv_incident_reports_created_at on public.cctv_incident_reports (created_at desc);

create index if not exists idx_dob_entries_org on public.dob_entries (organisation_id);
create index if not exists idx_dob_entries_site on public.dob_entries (site_id);
create index if not exists idx_dob_entries_created_by on public.dob_entries (created_by);
create index if not exists idx_dob_entries_created_at on public.dob_entries (created_at desc);

create index if not exists idx_id_card_requests_org on public.id_card_requests (organisation_id);
create index if not exists idx_id_card_requests_site on public.id_card_requests (site_id);
create index if not exists idx_id_card_requests_created_by on public.id_card_requests (created_by);
create index if not exists idx_id_card_requests_created_at on public.id_card_requests (created_at desc);

create index if not exists idx_report_files_org on public.report_files (organisation_id);
create index if not exists idx_report_files_site on public.report_files (site_id);
create index if not exists idx_report_files_created_by on public.report_files (created_by);
create index if not exists idx_report_files_created_at on public.report_files (created_at desc);

create index if not exists idx_rota_staff_org on public.rota_staff (organisation_id);
create index if not exists idx_rota_staff_site on public.rota_staff (site_id);
create index if not exists idx_rota_staff_created_by on public.rota_staff (created_by);

create index if not exists idx_leave_records_org on public.leave_records (organisation_id);
create index if not exists idx_leave_records_site on public.leave_records (site_id);
create index if not exists idx_leave_records_created_by on public.leave_records (created_by);

create index if not exists idx_fire_door_org on public.fire_door_inspection_reports (organisation_id);
create index if not exists idx_fire_door_site on public.fire_door_inspection_reports (site_id);
create index if not exists idx_fire_door_created_by on public.fire_door_inspection_reports (created_by);

create index if not exists idx_comms_room_log_org on public.comms_room_log (organisation_id);
create index if not exists idx_comms_room_log_site on public.comms_room_log (site_id);
create index if not exists idx_comms_room_log_created_by on public.comms_room_log (created_by);
create index if not exists idx_comms_room_log_period on public.comms_room_log (year, month, day);

create index if not exists idx_organisation_members_user on public.organisation_members (user_id);
create index if not exists idx_organisation_members_org on public.organisation_members (organisation_id);

create index if not exists idx_site_members_user on public.site_members (user_id);
create index if not exists idx_site_members_site on public.site_members (site_id);

create index if not exists idx_sites_org on public.sites (organisation_id);