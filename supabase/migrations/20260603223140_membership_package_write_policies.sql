grant select, insert, update, delete on table
  public.membership_packages,
  public.membership_package_rooms
to authenticated;

drop policy if exists "Managers can read rooms in managed facilities"
  on public.rooms;
create policy "Managers can read rooms in managed facilities"
  on public.rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = rooms.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read packages in managed facilities"
  on public.membership_packages;
create policy "Managers can read packages in managed facilities"
  on public.membership_packages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = membership_packages.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read package rooms in managed facilities"
  on public.membership_package_rooms;
create policy "Managers can read package rooms in managed facilities"
  on public.membership_package_rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_packages mp
      join public.facility_managers fm on fm.facility_id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can create packages in owned facilities"
  on public.membership_packages;
create policy "Owners can create packages in owned facilities"
  on public.membership_packages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = membership_packages.facility_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can update packages in owned facilities"
  on public.membership_packages;
create policy "Owners can update packages in owned facilities"
  on public.membership_packages
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = membership_packages.facility_id
        and gf.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = membership_packages.facility_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can delete packages in owned facilities"
  on public.membership_packages;
create policy "Owners can delete packages in owned facilities"
  on public.membership_packages
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = membership_packages.facility_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can create packages in managed facilities"
  on public.membership_packages;
create policy "Managers can create packages in managed facilities"
  on public.membership_packages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = membership_packages.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can update packages in managed facilities"
  on public.membership_packages;
create policy "Managers can update packages in managed facilities"
  on public.membership_packages
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = membership_packages.facility_id
        and fm.manager_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = membership_packages.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can delete packages in managed facilities"
  on public.membership_packages;
create policy "Managers can delete packages in managed facilities"
  on public.membership_packages
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = membership_packages.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can create package rooms in owned facilities"
  on public.membership_package_rooms;
create policy "Owners can create package rooms in owned facilities"
  on public.membership_package_rooms
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.membership_packages mp
      join public.gym_facilities gf on gf.id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and gf.owner_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.rooms r
      join public.gym_facilities gf on gf.id = r.facility_id
      where r.id = membership_package_rooms.room_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can update package rooms in owned facilities"
  on public.membership_package_rooms;
create policy "Owners can update package rooms in owned facilities"
  on public.membership_package_rooms
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.membership_packages mp
      join public.gym_facilities gf on gf.id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and gf.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.membership_packages mp
      join public.gym_facilities gf on gf.id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and gf.owner_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.rooms r
      join public.gym_facilities gf on gf.id = r.facility_id
      where r.id = membership_package_rooms.room_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can delete package rooms in owned facilities"
  on public.membership_package_rooms;
create policy "Owners can delete package rooms in owned facilities"
  on public.membership_package_rooms
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.membership_packages mp
      join public.gym_facilities gf on gf.id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can create package rooms in managed facilities"
  on public.membership_package_rooms;
create policy "Managers can create package rooms in managed facilities"
  on public.membership_package_rooms
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.membership_packages mp
      join public.facility_managers fm on fm.facility_id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and fm.manager_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.rooms r
      join public.facility_managers fm on fm.facility_id = r.facility_id
      where r.id = membership_package_rooms.room_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can update package rooms in managed facilities"
  on public.membership_package_rooms;
create policy "Managers can update package rooms in managed facilities"
  on public.membership_package_rooms
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.membership_packages mp
      join public.facility_managers fm on fm.facility_id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and fm.manager_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.membership_packages mp
      join public.facility_managers fm on fm.facility_id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and fm.manager_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.rooms r
      join public.facility_managers fm on fm.facility_id = r.facility_id
      where r.id = membership_package_rooms.room_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can delete package rooms in managed facilities"
  on public.membership_package_rooms;
create policy "Managers can delete package rooms in managed facilities"
  on public.membership_package_rooms
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.membership_packages mp
      join public.facility_managers fm on fm.facility_id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and fm.manager_id = (select auth.uid())
    )
  );
