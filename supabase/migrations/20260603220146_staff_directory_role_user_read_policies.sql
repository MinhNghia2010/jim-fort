grant select on table
  public.users,
  public.facility_managers,
  public.facility_pts
to authenticated;

alter table if exists public.facility_managers enable row level security;
alter table if exists public.facility_pts enable row level security;

drop policy if exists "Owners can read facility managers in owned facilities"
  on public.facility_managers;
create policy "Owners can read facility managers in owned facilities"
  on public.facility_managers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = facility_managers.facility_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can read facility PTs in owned facilities"
  on public.facility_pts;
create policy "Owners can read facility PTs in owned facilities"
  on public.facility_pts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = facility_pts.facility_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can read manager and PT users in owned facilities"
  on public.users;
create policy "Owners can read manager and PT users in owned facilities"
  on public.users
  for select
  to authenticated
  using (
    role in ('manager', 'pt')
    and (
      exists (
        select 1
        from public.facility_managers fm
        join public.gym_facilities gf on gf.id = fm.facility_id
        where fm.manager_id = users.id
          and gf.owner_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.facility_pts fp
        join public.gym_facilities gf on gf.id = fp.facility_id
        where fp.pt_id = users.id
          and gf.owner_id = (select auth.uid())
      )
    )
  );
