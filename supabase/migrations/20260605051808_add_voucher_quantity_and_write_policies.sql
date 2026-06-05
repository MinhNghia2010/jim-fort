create schema if not exists private;

alter table public.vouchers
  add column if not exists max_redemptions integer not null default 1;

alter table public.vouchers
  drop constraint if exists vouchers_max_redemptions_positive;

alter table public.vouchers
  add constraint vouchers_max_redemptions_positive
  check (max_redemptions > 0);

alter table public.voucher_redemptions
  drop constraint if exists voucher_redemptions_voucher_unique;

create index if not exists voucher_redemptions_voucher_id_idx
  on public.voucher_redemptions (voucher_id);

comment on table public.vouchers is
  'Discount codes with a configurable maximum number of redemptions.';
comment on column public.vouchers.code is
  'Uppercase, trimmed voucher code. Codes are globally unique.';
comment on column public.vouchers.max_redemptions is
  'Maximum number of subscriptions that may redeem this voucher code.';
comment on table public.voucher_redemptions is
  'Records voucher usage for subscriptions. voucher max_redemptions limits total usage per code.';

create or replace function private.ensure_voucher_redemption_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_redemptions integer;
  voucher_max_redemptions integer;
begin
  select v.max_redemptions
  into voucher_max_redemptions
  from public.vouchers v
  where v.id = new.voucher_id
  for update;

  if voucher_max_redemptions is null then
    raise exception 'voucher must exist';
  end if;

  if tg_op = 'INSERT' then
    select count(*)
    into current_redemptions
    from public.voucher_redemptions vr
    where vr.voucher_id = new.voucher_id;
  else
    select count(*)
    into current_redemptions
    from public.voucher_redemptions vr
    where vr.voucher_id = new.voucher_id
      and vr.id <> old.id;
  end if;

  if current_redemptions >= voucher_max_redemptions then
    raise exception 'voucher redemption limit reached';
  end if;

  return new;
end;
$$;

revoke all on function private.ensure_voucher_redemption_limit() from public;
revoke all on function private.ensure_voucher_redemption_limit() from anon;
revoke all on function private.ensure_voucher_redemption_limit() from authenticated;

drop trigger if exists ensure_voucher_redemption_limit_on_write
  on public.voucher_redemptions;
create trigger ensure_voucher_redemption_limit_on_write
before insert or update of voucher_id on public.voucher_redemptions
for each row
execute function private.ensure_voucher_redemption_limit();

grant select on table
  public.gym_facilities,
  public.facility_managers,
  public.voucher_redemptions
to authenticated;

grant select, insert on table public.vouchers to authenticated;

drop policy if exists "Managers can read managed facilities"
  on public.gym_facilities;
create policy "Managers can read managed facilities"
  on public.gym_facilities
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = gym_facilities.id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read vouchers in managed facilities"
  on public.vouchers;
create policy "Managers can read vouchers in managed facilities"
  on public.vouchers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = vouchers.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can create vouchers in owned facilities"
  on public.vouchers;
create policy "Owners can create vouchers in owned facilities"
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
  );

drop policy if exists "Managers can create vouchers in managed facilities"
  on public.vouchers;
create policy "Managers can create vouchers in managed facilities"
  on public.vouchers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.facility_managers fm
      where fm.facility_id = vouchers.facility_id
        and fm.manager_id = (select auth.uid())
    )
  );

drop policy if exists "Managers can read voucher redemptions in managed facilities"
  on public.voucher_redemptions;
create policy "Managers can read voucher redemptions in managed facilities"
  on public.voucher_redemptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.vouchers v
      join public.facility_managers fm on fm.facility_id = v.facility_id
      where v.id = voucher_redemptions.voucher_id
        and fm.manager_id = (select auth.uid())
    )
  );
