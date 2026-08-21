-- 0010_operational_forms.sql
-- Secure persistence for incident, CCTV, comms room, fire door and DOB forms.

-- Identity/security columns added to every operational table:
--   created_by (auth.uid), organisation_id/site_id (from membership),
--   reference_number (auto-generated), status, updated_at.
-- is_draft retained for incident/CCTV; CCTV adds retention_review_date,
-- restricted_access and access_reason for GDPR minimisation.

-- Permissive public (`anon_*`) policies were narrowed to `TO anon ... USING (false)`
-- so no role can read/write/delete directly. Read access is org-scoped via
-- `is_org_member(organisation_id)`; all mutations go through SECURITY DEFINER RPCs.

-- RPC surface:
--   current_org()                 -> the caller's organisation
--   make_reference(prefix, id)    -> e.g. INC-20260821-0042
--   submit_incident_report(...)   -> validated insert, returns reference
--   update_incident_report(...)   -> author(pending) or manager
--   submit_cctv_report(jsonb)     -> validated insert, returns reference
--   submit_dob_entry(...)         -> validated insert, returns reference
--   update_dob_entry(...)         -> author(pending) or manager
--   submit_fire_door_report(jsonb)-> validated insert, returns reference
--   save_comms_room_log(y,m,jsonb)-> per-day upsert
--   set_record_status(t,id,status)-> manager+ (archive/status_change audit)
--   delete_record(t,id)           -> administrator only (audit)
-- Every write logs an immutable audit entry (submit/edit/status/archive/delete).

-- See the applied SQL for full definitions (column adds, index/policy changes,
-- and function bodies). This file is documentation of the applied state.