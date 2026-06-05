grant select on table
  public.users,
  public.staffs,
  public.membership_pt_sessions
to authenticated;

drop policy if exists "Owners can read members in owned facilities"
  on public.users;
create policy "Owners can read members in owned facilities"
  on public.users
  for select
  to authenticated
  using (
    role = 'member'
    and exists (
      select 1
      from public.membership_subscriptions ms
      join public.gym_facilities gf on gf.id = ms.facility_id
      where ms.member_id = users.id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can read staffs in owned facilities"
  on public.staffs;
create policy "Owners can read staffs in owned facilities"
  on public.staffs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = staffs.facility_id
        and gf.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can read PT sessions in owned facilities"
  on public.membership_pt_sessions;
create policy "Owners can read PT sessions in owned facilities"
  on public.membership_pt_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      join public.gym_facilities gf on gf.id = ms.facility_id
      where ms.id = membership_pt_sessions.subscription_id
        and gf.owner_id = (select auth.uid())
    )
  );
