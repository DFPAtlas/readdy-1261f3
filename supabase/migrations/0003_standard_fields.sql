-- 0003_standard_fields.sql
-- Add organisation/site scoping and audit fields to every application table.
-- Existing tables keep their bigint primary keys (converting to uuid would break
-- the running frontend which references numeric ids); new tables use uuid pks.

alter table public.incident_reports
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

alter table public.cctv_incident_reports
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

alter table public.dob_entries
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

alter table public.id_card_requests
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

alter table public.report_files
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table public.rota_staff
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

alter table public.leave_records
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

alter table public.fire_door_inspection_reports
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

alter table public.comms_room_log
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

create trigger trg_incident_reports_updated before update on public.incident_reports for each row execute function public.set_updated_at();
create trigger trg_cctv_incident_reports_updated before update on public.cctv_incident_reports for each row execute function public.set_updated_at();
create trigger trg_dob_entries_updated before update on public.dob_entries for each row execute function public.set_updated_at();
create trigger trg_id_card_requests_updated before update on public.id_card_requests for each row execute function public.set_updated_at();
create trigger trg_report_files_updated before update on public.report_files for each row execute function public.set_updated_at();
create trigger trg_rota_staff_updated before update on public.rota_staff for each row execute function public.set_updated_at();
create trigger trg_leave_records_updated before update on public.leave_records for each row execute function public.set_updated_at();
create trigger trg_fire_door_updated before update on public.fire_door_inspection_reports for each row execute function public.set_updated_at();
create trigger trg_comms_room_log_updated before update on public.comms_room_log for each row execute function public.set_updated_at();

create trigger trg_incident_reports_context before insert on public.incident_reports for each row execute function public.set_record_context();
create trigger trg_cctv_incident_reports_context before insert on public.cctv_incident_reports for each row execute function public.set_record_context();
create trigger trg_dob_entries_context before insert on public.dob_entries for each row execute function public.set_record_context();
create trigger trg_id_card_requests_context before insert on public.id_card_requests for each row execute function public.set_record_context();
create trigger trg_report_files_context before insert on public.report_files for each row execute function public.set_record_context();
create trigger trg_rota_staff_context before insert on public.rota_staff for each row execute function public.set_record_context();
create trigger trg_leave_records_context before insert on public.leave_records for each row execute function public.set_record_context();
create trigger trg_fire_door_context before insert on public.fire_door_inspection_reports for each row execute function public.set_record_context();
create trigger trg_comms_room_log_context before insert on public.comms_room_log for each row execute function public.set_record_context();