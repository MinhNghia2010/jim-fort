grant usage on schema public to authenticated;

grant select on table
  public.gym_facilities,
  public.rooms,
  public.gym_equipments,
  public.membership_packages,
  public.membership_package_rooms,
  public.membership_subscriptions,
  public.membership_payments
to authenticated;

drop policy if exists "Owners can read owned facilities"
  on public.gym_facilities;
create policy "Owners can read owned facilities"
  on public.gym_facilities
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Owners can read rooms in owned facilities"
  on public.rooms;
create policy "Owners can read rooms in owned facilities"
  on public.rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = rooms.facility_id
        and gf.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read equipments in owned facilities"
  on public.gym_equipments;
create policy "Owners can read equipments in owned facilities"
  on public.gym_equipments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = gym_equipments.facility_id
        and gf.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read packages in owned facilities"
  on public.membership_packages;
create policy "Owners can read packages in owned facilities"
  on public.membership_packages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = membership_packages.facility_id
        and gf.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read package rooms in owned facilities"
  on public.membership_package_rooms;
create policy "Owners can read package rooms in owned facilities"
  on public.membership_package_rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_packages mp
      join public.gym_facilities gf on gf.id = mp.facility_id
      where mp.id = membership_package_rooms.package_id
        and gf.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read subscriptions in owned facilities"
  on public.membership_subscriptions;
create policy "Owners can read subscriptions in owned facilities"
  on public.membership_subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = membership_subscriptions.facility_id
        and gf.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read payments in owned facilities"
  on public.membership_payments;
create policy "Owners can read payments in owned facilities"
  on public.membership_payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      join public.gym_facilities gf on gf.id = ms.facility_id
      where ms.id = membership_payments.subscription_id
        and gf.owner_id = auth.uid()
    )
  );
