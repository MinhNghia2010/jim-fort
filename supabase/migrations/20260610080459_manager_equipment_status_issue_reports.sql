create table if not exists public.equipment_issue_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  facility_id uuid not null
    references public.gym_facilities(id)
    on delete cascade,
  equipment_id uuid not null
    references public.gym_equipments(id)
    on delete cascade,
  reported_by_manager_id uuid
    references public.users(id)
    on delete set null,
  previous_status text not null,
  new_status text not null,
  issue text not null,
  created_at timestamptz not null default now(),

  constraint equipment_issue_reports_issue_not_blank
    check (length(trim(issue)) > 0),
  constraint equipment_issue_reports_previous_status_valid
    check (previous_status in ('active', 'maintenance', 'broken', 'retired')),
  constraint equipment_issue_reports_new_status_valid
    check (new_status in ('active', 'maintenance', 'broken', 'retired'))
);

comment on table public.equipment_issue_reports is
  'Manager-submitted equipment status issue reports visible to facility owners and managers.';
comment on column public.equipment_issue_reports.issue is
  'Issue or operational note sent by the manager when updating equipment status.';

create index if not exists equipment_issue_reports_facility_created_idx
  on public.equipment_issue_reports (facility_id, created_at desc);
create index if not exists equipment_issue_reports_equipment_created_idx
  on public.equipment_issue_reports (equipment_id, created_at desc);
create index if not exists equipment_issue_reports_reported_by_manager_idx
  on public.equipment_issue_reports (reported_by_manager_id);

alter table public.equipment_issue_reports enable row level security;

grant usage on schema public to authenticated;
grant select, insert on table public.equipment_issue_reports to authenticated;
grant update (status, note, updated_at) on table public.gym_equipments to authenticated;

drop policy if exists "Managers can update equipment status in managed facilities"
  on public.gym_equipments;
create policy "Managers can update equipment status in managed facilities"
  on public.gym_equipments
  for update
  to authenticated
  using ((select private.is_current_user_facility_manager(facility_id)))
  with check ((select private.is_current_user_facility_manager(facility_id)));

drop policy if exists "Managers can create equipment issue reports"
  on public.equipment_issue_reports;
create policy "Managers can create equipment issue reports"
  on public.equipment_issue_reports
  for insert
  to authenticated
  with check (
    reported_by_manager_id = (select auth.uid())
    and (select private.is_current_user_facility_manager(facility_id))
    and exists (
      select 1
      from public.gym_equipments ge
      where ge.id = equipment_issue_reports.equipment_id
        and ge.facility_id = equipment_issue_reports.facility_id
    )
  );

drop policy if exists "Managers can read equipment issue reports"
  on public.equipment_issue_reports;
create policy "Managers can read equipment issue reports"
  on public.equipment_issue_reports
  for select
  to authenticated
  using ((select private.is_current_user_facility_manager(facility_id)));

drop policy if exists "Owners can read equipment issue reports"
  on public.equipment_issue_reports;
create policy "Owners can read equipment issue reports"
  on public.equipment_issue_reports
  for select
  to authenticated
  using ((select private.is_current_user_facility_owner(facility_id)));
