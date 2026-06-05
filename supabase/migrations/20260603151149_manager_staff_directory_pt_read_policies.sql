grant select on table
  public.staffs,
  public.users,
  public.facility_managers,
  public.facility_pts
to authenticated;

alter table if exists public.staffs enable row level security;
alter table if exists public.facility_managers enable row level security;
alter table if exists public.facility_pts enable row level security;

drop policy if exists "Managers can read own facility manager assignments"
  on public.facility_managers;
create policy "Managers can read own facility manager assignments"
  on public.facility_managers
  for select
  to authenticated
  using (manager_id = (select auth.uid()));

drop policy if exists "Managers can read staffs in managed facilities"
  on public.staffs;
create policy "Managers can read staffs in managed facilities"
  on public.staffs
  for select
  to authenticated
  using (
    facility_id in (
      select fm.facility_id
      from public.facility_managers fm
      where fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read facility PTs in managed facilities"
  on public.facility_pts;
create policy "Managers can read facility PTs in managed facilities"
  on public.facility_pts
  for select
  to authenticated
  using (
    facility_id in (
      select fm.facility_id
      from public.facility_managers fm
      where fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read PT users in managed facilities"
  on public.users;
create policy "Managers can read PT users in managed facilities"
  on public.users
  for select
  to authenticated
  using (
    role = 'pt'
    and exists (
      select 1
      from public.facility_pts fp
      join public.facility_managers fm on fm.facility_id = fp.facility_id
      where fp.pt_id = users.id
        and fm.manager_id = (select auth.uid())
    )
  );
