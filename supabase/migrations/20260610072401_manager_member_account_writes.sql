grant select, insert, update, delete on table
  public.accounts,
  public.users,
  public.membership_subscriptions
to service_role;

grant select on table
  public.membership_subscriptions,
  public.membership_payments,
  public.membership_pt_sessions,
  public.users
to authenticated;

drop policy if exists "Managers can read members in managed facilities"
  on public.users;
create policy "Managers can read members in managed facilities"
  on public.users
  for select
  to authenticated
  using (
    role = 'member'
    and exists (
      select 1
      from public.membership_subscriptions ms
      join public.facility_managers fm on fm.facility_id = ms.facility_id
      where ms.member_id = users.id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read subscriptions in managed facilities"
  on public.membership_subscriptions;
create policy "Managers can read subscriptions in managed facilities"
  on public.membership_subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = membership_subscriptions.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read payments in managed facilities"
  on public.membership_payments;
create policy "Managers can read payments in managed facilities"
  on public.membership_payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      join public.facility_managers fm on fm.facility_id = ms.facility_id
      where ms.id = membership_payments.subscription_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read PT sessions in managed facilities"
  on public.membership_pt_sessions;
create policy "Managers can read PT sessions in managed facilities"
  on public.membership_pt_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      join public.facility_managers fm on fm.facility_id = ms.facility_id
      where ms.id = membership_pt_sessions.subscription_id
        and fm.manager_id = (select auth.uid())
    )
  );
