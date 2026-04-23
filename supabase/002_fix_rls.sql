-- Fix RLS: document security model + tighten job visibility
--
-- DESIGN DECISION: estimates are readable by anyone with the UUID link.
-- UUID v4 has 122 bits of entropy — possession of the link IS authorization.
-- No customer login is required by design. The service role key used in API
-- routes bypasses RLS entirely, so API security is handled at the route level.
--
-- Run this in Supabase SQL editor after 001_initial_schema.sql

comment on policy "public_read_estimate_by_id" on estimates is
  'Intentional: UUID v4 link = customer auth token. Guessing a valid UUID is computationally infeasible.';

-- Jobs should NOT be publicly readable — remove the overly permissive policy
drop policy if exists "service_read_jobs" on jobs;

create policy "service_role_only_read_jobs"
  on jobs for select
  using (auth.role() = 'service_role');
