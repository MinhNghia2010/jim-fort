create schema if not exists private;

create or replace function private.is_current_user_facility_owner(facility_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.gym_facilities gf
    where gf.id = $1
      and gf.owner_id = (select auth.uid())
  );
$$;

create or replace function private.is_current_user_facility_manager(facility_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.facility_managers fm
    where fm.facility_id = $1
      and fm.manager_id = (select auth.uid())
  );
$$;

revoke all on function private.is_current_user_facility_owner(uuid) from public;
revoke all on function private.is_current_user_facility_owner(uuid) from anon;
revoke all on function private.is_current_user_facility_manager(uuid) from public;
revoke all on function private.is_current_user_facility_manager(uuid) from anon;

grant execute on function private.is_current_user_facility_owner(uuid)
to authenticated;
grant execute on function private.is_current_user_facility_manager(uuid)
to authenticated;

drop policy if exists "Owners and managers can read accessible facilities"
  on public.gym_facilities;
create policy "Owners and managers can read accessible facilities"
  on public.gym_facilities
  for select
  to authenticated
  using (
    (select private.is_current_user_facility_owner(id))
    or (select private.is_current_user_facility_manager(id))
  );

drop policy if exists "Owners and managers can read vouchers in accessible facilities"
  on public.vouchers;
create policy "Owners and managers can read vouchers in accessible facilities"
  on public.vouchers
  for select
  to authenticated
  using (
    (select private.is_current_user_facility_owner(facility_id))
    or (select private.is_current_user_facility_manager(facility_id))
  );

drop policy if exists "Owners and managers can create vouchers in accessible facilities"
  on public.vouchers;
create policy "Owners and managers can create vouchers in accessible facilities"
  on public.vouchers
  for insert
  to authenticated
  with check (
    (select private.is_current_user_facility_owner(facility_id))
    or (select private.is_current_user_facility_manager(facility_id))
  );

drop policy if exists "Owners and managers can read voucher redemptions in accessible facilities"
  on public.voucher_redemptions;
create policy "Owners and managers can read voucher redemptions in accessible facilities"
  on public.voucher_redemptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.vouchers v
      where v.id = voucher_redemptions.voucher_id
        and (
          (select private.is_current_user_facility_owner(v.facility_id))
          or (select private.is_current_user_facility_manager(v.facility_id))
        )
    )
  );
