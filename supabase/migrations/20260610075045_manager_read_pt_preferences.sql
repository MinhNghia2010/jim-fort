grant select on table
  public.membership_pt_preferences,
  public.membership_pt_preference_time_slots
to authenticated;

grant select, insert on table
  public.membership_pt_assignments,
  public.membership_pt_assignment_schedule_slots
to authenticated;

drop policy if exists "Managers can read PT preferences"
  on public.membership_pt_preferences;
create policy "Managers can read PT preferences"
  on public.membership_pt_preferences
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_preferences.subscription_id
        and (
          (select private.is_current_user_facility_owner(ms.facility_id))
          or (select private.is_current_user_facility_manager(ms.facility_id))
        )
    )
  );

drop policy if exists "Managers can read PT preference slots"
  on public.membership_pt_preference_time_slots;
create policy "Managers can read PT preference slots"
  on public.membership_pt_preference_time_slots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_pt_preferences pref
      join public.membership_subscriptions ms on ms.id = pref.subscription_id
      where pref.id = membership_pt_preference_time_slots.pt_preference_id
        and (
          (select private.is_current_user_facility_owner(ms.facility_id))
          or (select private.is_current_user_facility_manager(ms.facility_id))
        )
    )
  );

drop policy if exists "Managers can read PT assignments"
  on public.membership_pt_assignments;
create policy "Managers can read PT assignments"
  on public.membership_pt_assignments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_assignments.subscription_id
        and (
          (select private.is_current_user_facility_owner(ms.facility_id))
          or (select private.is_current_user_facility_manager(ms.facility_id))
        )
    )
  );

drop policy if exists "Managers can create PT assignments"
  on public.membership_pt_assignments;
create policy "Managers can create PT assignments"
  on public.membership_pt_assignments
  for insert
  to authenticated
  with check (
    assigned_by_manager_id = (select auth.uid())
    and exists (
      select 1
      from public.membership_subscriptions ms
      where ms.id = membership_pt_assignments.subscription_id
        and ms.status = 'pending_pt_setup'
        and (
          (select private.is_current_user_facility_owner(ms.facility_id))
          or (select private.is_current_user_facility_manager(ms.facility_id))
        )
    )
  );

drop policy if exists "Managers can read PT assignment slots"
  on public.membership_pt_assignment_schedule_slots;
create policy "Managers can read PT assignment slots"
  on public.membership_pt_assignment_schedule_slots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.membership_pt_assignments assignment
      join public.membership_subscriptions ms on ms.id = assignment.subscription_id
      where assignment.id = membership_pt_assignment_schedule_slots.assignment_id
        and (
          (select private.is_current_user_facility_owner(ms.facility_id))
          or (select private.is_current_user_facility_manager(ms.facility_id))
        )
    )
  );

drop policy if exists "Managers can create PT assignment slots"
  on public.membership_pt_assignment_schedule_slots;
create policy "Managers can create PT assignment slots"
  on public.membership_pt_assignment_schedule_slots
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.membership_pt_assignments assignment
      join public.membership_subscriptions ms on ms.id = assignment.subscription_id
      where assignment.id = membership_pt_assignment_schedule_slots.assignment_id
        and assignment.status = 'pending_member_decision'
        and (
          (select private.is_current_user_facility_owner(ms.facility_id))
          or (select private.is_current_user_facility_manager(ms.facility_id))
        )
    )
  );
