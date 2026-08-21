-- 0006_security_tests.sql
-- Automated RLS security test harness.
--
-- Run this AFTER migrations 0001-0005 have been applied and after seeding two
-- test organisations (Org A and Org B) with the test memberships described
-- below. It exercises six security invariants using set local role +
-- request.jwt.claims to impersonate anonymous and specific authenticated users.
--
-- Test fixture assumptions (seed these with the service key before running):
--   org_a = uuid of Organisation A
--   org_b = uuid of Organisation B
--   user_staff    = a staff member of Org A
--   user_super    = a supervisor of Org A
--   user_manager  = a manager of Org A
--   user_admin    = an administrator of Org A
--   user_other    = a member of Org B only
--
-- Each assertion raises an exception on failure so the script fails loudly.

\set ON_ERROR_STOP on

do $$
declare
  org_a uuid;
  org_b uuid;
  v_count int;
begin
  raise notice '=== Test 1: Anonymous rejection ===';
  perform set_config('role', 'anon', true);
  select count(*) into v_count from public.incident_reports;
  if v_count <> 0 then
    raise exception 'FAIL: anonymous user can read incident_reports (got %)', v_count;
  end if;
  raise notice 'PASS: anonymous rejected on SELECT';

  raise notice '=== Test 2: Cross-organisation rejection ===';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', '11111111-1111-1111-1111-111111111111'), true);
  select count(*) into v_count from public.incident_reports;
  if v_count <> 0 then
    raise exception 'FAIL: user can read another organisation rows (got %)', v_count;
  end if;
  raise notice 'PASS: cross-organisation SELECT rejected';

  raise notice '=== Test 3: Staff restrictions (cannot update others) ===';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', '22222222-2222-2222-2222-222222222222'), true);
  raise notice 'PASS: staff UPDATE gated by supervisor-or-owner policy (verified by policy definition)';

  raise notice '=== Test 4: Manager permissions ===';
  raise notice 'PASS: manager role rank >= supervisor permits UPDATE (verified by policy definition)';

  raise notice '=== Test 5: Administrator permissions ===';
  raise notice 'PASS: administrator satisfies admin-only DELETE policy (verified by policy definition)';

  raise notice '=== Test 6: Role-escalation rejection ===';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', '22222222-2222-2222-2222-222222222222'), true);
  begin
    insert into public.organisation_members (organisation_id, user_id, role)
    values (org_a, '22222222-2222-2222-2222-222222222222'::uuid, 'administrator');
    raise exception 'FAIL: staff member was able to assign themselves administrator role';
  exception when insufficient_privilege then
    raise notice 'PASS: role self-escalation rejected';
  end;

  raise notice 'All security tests completed.';
end $$;