drop policy if exists "Managers can create packages in managed facilities"
  on public.membership_packages;
drop policy if exists "Managers can update packages in managed facilities"
  on public.membership_packages;
drop policy if exists "Managers can delete packages in managed facilities"
  on public.membership_packages;

drop policy if exists "Managers can create package rooms in managed facilities"
  on public.membership_package_rooms;
drop policy if exists "Managers can update package rooms in managed facilities"
  on public.membership_package_rooms;
drop policy if exists "Managers can delete package rooms in managed facilities"
  on public.membership_package_rooms;

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

drop policy if exists "Managers can create vouchers in managed facilities"
  on public.vouchers;
drop policy if exists "Owners and managers can create vouchers in accessible facilities"
  on public.vouchers;
drop policy if exists "Owners and managers can update vouchers in accessible facilities"
  on public.vouchers;

drop policy if exists "Owners can create vouchers in owned facilities"
  on public.vouchers;
create policy "Owners can create vouchers in owned facilities"
  on public.vouchers
  for insert
  to authenticated
  with check (
    (select private.is_current_user_facility_owner(facility_id))
  );

drop policy if exists "Owners can update vouchers in owned facilities"
  on public.vouchers;
create policy "Owners can update vouchers in owned facilities"
  on public.vouchers
  for update
  to authenticated
  using (
    (select private.is_current_user_facility_owner(facility_id))
  )
  with check (
    (select private.is_current_user_facility_owner(facility_id))
  );
