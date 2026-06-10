drop index if exists public.equipment_issue_reports_facility_created_idx;
drop index if exists public.equipment_issue_reports_reported_by_manager_idx;

drop policy if exists "Managers can read equipment issue reports"
  on public.equipment_issue_reports;
drop policy if exists "Owners can read equipment issue reports"
  on public.equipment_issue_reports;

drop policy if exists "Owners and managers can read equipment issue reports"
  on public.equipment_issue_reports;
create policy "Owners and managers can read equipment issue reports"
  on public.equipment_issue_reports
  for select
  to authenticated
  using (
    (select private.is_current_user_facility_owner(facility_id))
    or (select private.is_current_user_facility_manager(facility_id))
  );
