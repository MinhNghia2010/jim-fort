grant select on table
  public.membership_packages,
  public.membership_package_rooms,
  public.rooms,
  public.gym_facilities,
  public.facility_pts,
  public.users,
  public.vouchers
to authenticated;

grant select, insert on table
  public.membership_subscriptions,
  public.membership_payments,
  public.voucher_redemptions
to authenticated;

grant select, insert, update on table
  public.membership_pt_preferences,
  public.membership_pt_assignments,
  public.pt_session_feedbacks
to authenticated;

grant select, insert, delete on table
  public.membership_pt_preference_time_slots
to authenticated;

grant select on table
  public.membership_pt_assignment_schedule_slots,
  public.membership_pt_sessions
to authenticated;

drop policy if exists "Members can read active membership packages"
  on public.membership_packages;
create policy "Members can read active membership packages"
  on public.membership_packages
  for select
  to authenticated
  using (
    status = 'active'
    and (release_date is null or release_date <= current_date)
    and (end_date is null or end_date >= current_date)
  );

drop policy if exists "Members can read active package rooms"
  on public.membership_package_rooms;
create policy "Members can read active package rooms"
  on public.membership_package_rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_packages mp
      where mp.id = membership_package_rooms.package_id
        and mp.status = 'active'
        and (mp.release_date is null or mp.release_date <= current_date)
        and (mp.end_date is null or mp.end_date >= current_date)
    )
  );

drop policy if exists "Members can read active package rooms detail"
  on public.rooms;
create policy "Members can read active package rooms detail"
  on public.rooms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_package_rooms mpr
      join public.membership_packages mp on mp.id = mpr.package_id
      where mpr.room_id = rooms.id
        and mp.status = 'active'
        and (mp.release_date is null or mp.release_date <= current_date)
        and (mp.end_date is null or mp.end_date >= current_date)
    )
  );

drop policy if exists "Members can read relevant facilities"
  on public.gym_facilities;
create policy "Members can read relevant facilities"
  on public.gym_facilities
  for select
  to authenticated
  using (true);

drop policy if exists "Members can create own subscriptions"
  on public.membership_subscriptions;
create policy "Members can create own subscriptions"
  on public.membership_subscriptions
  for insert
  to authenticated
  with check (member_id = (select auth.uid()));

drop policy if exists "Members can read own subscriptions"
  on public.membership_subscriptions;
create policy "Members can read own subscriptions"
  on public.membership_subscriptions
  for select
  to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "Members can create own payments"
  on public.membership_payments;
create policy "Members can create own payments"
  on public.membership_payments
  for insert
  to authenticated
  with check (member_id = (select auth.uid()));

drop policy if exists "Members can read own payments"
  on public.membership_payments;
create policy "Members can read own payments"
  on public.membership_payments
  for select
  to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "Members can read own PT sessions"
  on public.membership_pt_sessions;
create policy "Members can read own PT sessions"
  on public.membership_pt_sessions
  for select
  to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "Members can read own PT preferences"
  on public.membership_pt_preferences;
create policy "Members can read own PT preferences"
  on public.membership_pt_preferences
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_preferences.subscription_id
        and ms.member_id = (select auth.uid())
    )
  );

drop policy if exists "Members can create own PT preferences"
  on public.membership_pt_preferences;
create policy "Members can create own PT preferences"
  on public.membership_pt_preferences
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_preferences.subscription_id
        and ms.member_id = (select auth.uid())
        and ms.status = 'pending_pt_setup'
    )
  );

drop policy if exists "Members can update own PT preferences"
  on public.membership_pt_preferences;
create policy "Members can update own PT preferences"
  on public.membership_pt_preferences
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_preferences.subscription_id
        and ms.member_id = (select auth.uid())
        and ms.status = 'pending_pt_setup'
    )
  )
  with check (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_preferences.subscription_id
        and ms.member_id = (select auth.uid())
        and ms.status = 'pending_pt_setup'
    )
  );

drop policy if exists "Members can read own PT preference slots"
  on public.membership_pt_preference_time_slots;
create policy "Members can read own PT preference slots"
  on public.membership_pt_preference_time_slots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_pt_preferences pref
      join public.membership_subscriptions ms on ms.id = pref.subscription_id
      where pref.id = membership_pt_preference_time_slots.pt_preference_id
        and ms.member_id = (select auth.uid())
    )
  );

drop policy if exists "Members can create own PT preference slots"
  on public.membership_pt_preference_time_slots;
create policy "Members can create own PT preference slots"
  on public.membership_pt_preference_time_slots
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.membership_pt_preferences pref
      join public.membership_subscriptions ms on ms.id = pref.subscription_id
      where pref.id = membership_pt_preference_time_slots.pt_preference_id
        and ms.member_id = (select auth.uid())
        and ms.status = 'pending_pt_setup'
    )
  );

drop policy if exists "Members can delete own PT preference slots"
  on public.membership_pt_preference_time_slots;
create policy "Members can delete own PT preference slots"
  on public.membership_pt_preference_time_slots
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.membership_pt_preferences pref
      join public.membership_subscriptions ms on ms.id = pref.subscription_id
      where pref.id = membership_pt_preference_time_slots.pt_preference_id
        and ms.member_id = (select auth.uid())
        and ms.status = 'pending_pt_setup'
    )
  );

drop policy if exists "Members can read own PT assignments"
  on public.membership_pt_assignments;
create policy "Members can read own PT assignments"
  on public.membership_pt_assignments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_assignments.subscription_id
        and ms.member_id = (select auth.uid())
    )
  );

drop policy if exists "Members can decide own pending PT assignments"
  on public.membership_pt_assignments;
create policy "Members can decide own pending PT assignments"
  on public.membership_pt_assignments
  for update
  to authenticated
  using (
    status = 'pending_member_decision'
    and exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_assignments.subscription_id
        and ms.member_id = (select auth.uid())
    )
  )
  with check (
    status in ('accepted', 'rejected')
    and exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_assignments.subscription_id
        and ms.member_id = (select auth.uid())
    )
  );

drop policy if exists "Members can read own PT assignment schedule slots"
  on public.membership_pt_assignment_schedule_slots;
create policy "Members can read own PT assignment schedule slots"
  on public.membership_pt_assignment_schedule_slots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_pt_assignments assignment
      join public.membership_subscriptions ms on ms.id = assignment.subscription_id
      where assignment.id = membership_pt_assignment_schedule_slots.assignment_id
        and ms.member_id = (select auth.uid())
    )
  );

drop policy if exists "Members can read facility PT mappings for subscribed facilities"
  on public.facility_pts;
create policy "Members can read facility PT mappings for subscribed facilities"
  on public.facility_pts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.facility_id = facility_pts.facility_id
        and ms.member_id = (select auth.uid())
    )
  );

drop policy if exists "Members can read PT users in subscribed facilities"
  on public.users;
create policy "Members can read PT users in subscribed facilities"
  on public.users
  for select
  to authenticated
  using (
    role = 'pt'
    and exists (
      select 1
      from public.facility_pts fp
      join public.membership_subscriptions ms on ms.facility_id = fp.facility_id
      where fp.pt_id = users.id
        and ms.member_id = (select auth.uid())
    )
  );

drop policy if exists "Members can read vouchers for own pending subscriptions"
  on public.vouchers;
create policy "Members can read vouchers for own pending subscriptions"
  on public.vouchers
  for select
  to authenticated
  using (
    status = 'active'
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
    and exists (
      select 1
      from public.membership_subscriptions ms
      where ms.facility_id = vouchers.facility_id
        and ms.member_id = (select auth.uid())
        and ms.status = 'pending_payment'
    )
  );

drop policy if exists "Members can create own voucher redemptions"
  on public.voucher_redemptions;
create policy "Members can create own voucher redemptions"
  on public.voucher_redemptions
  for insert
  to authenticated
  with check (member_id = (select auth.uid()));

drop policy if exists "Members can read own voucher redemptions"
  on public.voucher_redemptions;
create policy "Members can read own voucher redemptions"
  on public.voucher_redemptions
  for select
  to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "Members can mark own session feedback read"
  on public.pt_session_feedbacks;
create policy "Members can mark own session feedback read"
  on public.pt_session_feedbacks
  for update
  to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));
