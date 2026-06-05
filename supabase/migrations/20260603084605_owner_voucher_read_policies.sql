grant usage on schema public to authenticated;

grant select on table
  public.vouchers,
  public.voucher_redemptions
to authenticated;

drop policy if exists "Owners can read vouchers in owned facilities"
  on public.vouchers;
create policy "Owners can read vouchers in owned facilities"
  on public.vouchers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gym_facilities gf
      where gf.id = vouchers.facility_id
        and gf.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can read voucher redemptions in owned facilities"
  on public.voucher_redemptions;
create policy "Owners can read voucher redemptions in owned facilities"
  on public.voucher_redemptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.vouchers v
      join public.gym_facilities gf on gf.id = v.facility_id
      where v.id = voucher_redemptions.voucher_id
        and gf.owner_id = auth.uid()
    )
  );
