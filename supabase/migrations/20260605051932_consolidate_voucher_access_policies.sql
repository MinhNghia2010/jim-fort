drop policy if exists "Owners can read owned facilities"
  on public.gym_facilities;
drop policy if exists "Managers can read managed facilities"
  on public.gym_facilities;
create policy "Owners and managers can read accessible facilities"
  on public.gym_facilities
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = gym_facilities.id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can read vouchers in owned facilities"
  on public.vouchers;
drop policy if exists "Managers can read vouchers in managed facilities"
  on public.vouchers;
create policy "Owners and managers can read vouchers in accessible facilities"
  on public.vouchers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = vouchers.facility_id
        and gf.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = vouchers.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can create vouchers in owned facilities"
  on public.vouchers;
drop policy if exists "Managers can create vouchers in managed facilities"
  on public.vouchers;
create policy "Owners and managers can create vouchers in accessible facilities"
  on public.vouchers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = vouchers.facility_id
        and gf.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = vouchers.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can read voucher redemptions in owned facilities"
  on public.voucher_redemptions;
drop policy if exists "Managers can read voucher redemptions in managed facilities"
  on public.voucher_redemptions;
create policy "Owners and managers can read voucher redemptions in accessible facilities"
  on public.voucher_redemptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.vouchers v
      join public.gym_facilities gf on gf.id = v.facility_id
      where v.id = voucher_redemptions.voucher_id
        and gf.owner_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.vouchers v
      join public.facility_managers fm on fm.facility_id = v.facility_id
      where v.id = voucher_redemptions.voucher_id
        and fm.manager_id = (select auth.uid())
    )
  );
