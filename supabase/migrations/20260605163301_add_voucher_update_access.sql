grant update on table public.vouchers to authenticated;

drop policy if exists "Owners and managers can update vouchers in accessible facilities"
  on public.vouchers;
create policy "Owners and managers can update vouchers in accessible facilities"
  on public.vouchers
  for update
  to authenticated
  using (
    (select private.is_current_user_facility_owner(facility_id))
    or (select private.is_current_user_facility_manager(facility_id))
  )
  with check (
    (select private.is_current_user_facility_owner(facility_id))
    or (select private.is_current_user_facility_manager(facility_id))
  );
