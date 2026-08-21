-- 0011_report_files_storage.sql
-- Real file storage for /reports: private bucket uploads/downloads,
-- org-scoped metadata, validated RPC functions and storage policies.

alter table public.report_files
  add column if not exists organisation_id uuid references public.organisations(id),
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists reference_number text,
  add column if not exists original_filename text,
  add column if not exists safe_filename text,
  add column if not exists bucket text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists checksum text,
  add column if not exists uploaded_at timestamptz not null default now();

create unique index if not exists report_files_storage_path_idx on public.report_files(storage_path);
create index if not exists report_files_ref_idx on public.report_files(reference_number);
create index if not exists report_files_org_idx on public.report_files(organisation_id);

create trigger trg_report_files_updated before update on public.report_files for each row execute function public.set_updated_at();

alter table public.report_files enable row level security;

alter policy anon_select_report_files on public.report_files using (false);
alter policy anon_insert_report_files on public.report_files with check (false);
alter policy anon_update_report_files on public.report_files using (false);
alter policy anon_delete_report_files on public.report_files using (false);

create policy report_files_select_org on public.report_files
  for select to authenticated using (public.is_org_member(organisation_id));

create or replace function public.register_report_file(
  p_bucket text,
  p_storage_path text,
  p_original_filename text,
  p_safe_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_report_type text,
  p_checksum text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_org uuid;
  v_site uuid;
  v_ext text;
  v_id bigint;
  v_ref text;
  v_allowed text[] := array['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','png','jpg','jpeg','webp','zip','msg'];
  v_max bigint := 25 * 1024 * 1024;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not authenticated.'; end if;
  v_org := current_org();
  if v_org is null then raise exception 'You are not a member of an organisation.'; end if;
  if p_size_bytes is null or p_size_bytes <= 0 then
    raise exception 'Cannot upload an empty file.';
  end if;
  if p_size_bytes > v_max then
    raise exception 'File exceeds the maximum size of 25 MB.';
  end if;
  v_ext := lower(reverse(split_part(reverse(p_safe_filename), '.', 1)));
  if v_ext is null or not (v_ext = any(v_allowed)) then
    raise exception 'File type is not allowed.';
  end if;
  if p_original_filename ~* '\.(exe|sh|bat|com|cmd|ps1|msi|vbs|scr|jar|dll|lnk|hta)(\.|$)' then
    raise exception 'Executable files are not allowed.';
  end if;
  if p_storage_path is null or p_storage_path <> ('reports/' || v_org::text || '/' || p_safe_filename) then
    raise exception 'Invalid storage path.';
  end if;
  select site_id into v_site from profiles where user_id = v_uid limit 1;
  insert into report_files (
    organisation_id, site_id, created_by, name, original_filename, safe_filename,
    bucket, storage_path, mime_type, size_bytes, checksum, type, report_date, status
  ) values (
    v_org, v_site, v_uid, p_original_filename, p_original_filename, p_safe_filename,
    p_bucket, p_storage_path, p_mime_type, p_size_bytes, p_checksum, p_report_type,
    to_char(now(), 'YYYY-MM-DD'), 'active'
  ) returning id into v_id;
  v_ref := make_reference('RPT', v_id);
  update report_files set reference_number = v_ref where id = v_id;
  perform log_audit('upload', 'report_file', v_id::text,
    jsonb_build_object('filename', p_original_filename, 'size_bytes', p_size_bytes), v_org);
  return v_ref;
end;
$$;

create or replace function public.archive_report_file(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_path text;
begin
  select organisation_id, storage_path into v_org, v_path from report_files where id = p_id;
  if v_org is null then raise exception 'File not found.'; end if;
  if not user_has_min_role(v_org, 'manager') then raise exception 'Insufficient privileges to archive this file.'; end if;
  update report_files set status = 'archived', deleted_at = now() where id = p_id;
  perform log_audit('archive', 'report_file', p_id::text, jsonb_build_object('path', v_path), v_org);
end;
$$;

create or replace function public.restore_report_file(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select organisation_id into v_org from report_files where id = p_id;
  if v_org is null then raise exception 'File not found.'; end if;
  if not user_has_min_role(v_org, 'manager') then raise exception 'Insufficient privileges to restore this file.'; end if;
  update report_files set status = 'active', deleted_at = null where id = p_id;
  perform log_audit('restore', 'report_file', p_id::text, null, v_org);
end;
$$;

create or replace function public.delete_report_file(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_path text;
begin
  select organisation_id, storage_path into v_org, v_path from report_files where id = p_id;
  if v_org is null then raise exception 'File not found.'; end if;
  if not user_has_min_role(v_org, 'administrator') then raise exception 'Insufficient privileges to delete this file.'; end if;
  delete from report_files where id = p_id;
  perform log_audit('delete', 'report_file', p_id::text, jsonb_build_object('path', v_path), v_org);
end;
$$;

revoke all on function public.register_report_file(text,text,text,text,text,bigint,text,text) from public;
revoke all on function public.archive_report_file(bigint) from public;
revoke all on function public.restore_report_file(bigint) from public;
revoke all on function public.delete_report_file(bigint) from public;
grant execute on function public.register_report_file(text,text,text,text,text,bigint,text,text) to authenticated;
grant execute on function public.archive_report_file(bigint) to authenticated;
grant execute on function public.restore_report_file(bigint) to authenticated;
grant execute on function public.delete_report_file(bigint) to authenticated;
grant execute on function public.current_org() to authenticated;

create policy report_files_storage_read on storage.objects
  for select to authenticated
  using (bucket_id = 'private' and split_part(name, '/', 1) = 'reports' and public.is_org_member(split_part(name, '/', 2)::uuid));

create policy report_files_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'private' and split_part(name, '/', 1) = 'reports' and public.user_has_min_role(split_part(name, '/', 2)::uuid, 'administrator'));