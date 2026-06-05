create schema if not exists private;

create table if not exists public.membership_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null
    references public.users(id),
  facility_id uuid not null
    references public.gym_facilities(id),
  package_id uuid not null
    references public.membership_packages(id),
  status text not null default 'pending_payment',
  base_price numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  final_price numeric(12, 2) not null default 0,
  has_pt_snapshot boolean not null default false,
  duration_days_snapshot integer,
  session_count_snapshot integer,
  activated_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_subscriptions_status_valid
    check (status in ('pending_pt_setup', 'pending_payment', 'active', 'expired', 'cancelled')),
  constraint membership_subscriptions_money_valid
    check (
      base_price >= 0
      and discount_amount >= 0
      and discount_amount <= base_price
      and final_price = base_price - discount_amount
    ),
  constraint membership_subscriptions_snapshot_valid
    check (
      (
        has_pt_snapshot = false
        and duration_days_snapshot is not null
        and duration_days_snapshot > 0
        and session_count_snapshot is null
      )
      or
      (
        has_pt_snapshot = true
        and session_count_snapshot is not null
        and session_count_snapshot > 0
        and duration_days_snapshot is null
      )
    )
);

comment on table public.membership_subscriptions is
  'Member package subscriptions. Non-PT subscriptions go directly to payment; PT subscriptions wait for PT setup and member acceptance.';
comment on column public.membership_subscriptions.status is
  'Lifecycle status: pending_pt_setup, pending_payment, active, expired, or cancelled.';
comment on column public.membership_subscriptions.has_pt_snapshot is
  'Snapshot copied from the package when the subscription is created.';
comment on column public.membership_subscriptions.duration_days_snapshot is
  'Copied from a non-PT package at subscription time.';
comment on column public.membership_subscriptions.session_count_snapshot is
  'Copied from a PT package at subscription time.';

create table if not exists public.membership_pt_preferences (
  id uuid primary key default extensions.gen_random_uuid(),
  subscription_id uuid not null
    references public.membership_subscriptions(id)
    on delete cascade,
  preferred_pt_id uuid
    references public.users(id)
    on delete set null,
  preferred_pt_gender text not null default 'no_preference',
  sessions_per_week integer not null,
  training_goal text,
  experience_level text not null default 'no_preference',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_pt_preferences_subscription_unique
    unique (subscription_id),
  constraint membership_pt_preferences_gender_valid
    check (preferred_pt_gender in ('no_preference', 'male', 'female')),
  constraint membership_pt_preferences_sessions_per_week_valid
    check (sessions_per_week between 1 and 7),
  constraint membership_pt_preferences_experience_level_valid
    check (experience_level in ('no_preference', 'beginner', 'intermediate', 'advanced')),
  constraint membership_pt_preferences_training_goal_not_blank
    check (training_goal is null or length(trim(training_goal)) > 0)
);

comment on table public.membership_pt_preferences is
  'Member preferences for PT package setup, such as preferred PT, gender, weekly frequency, and goals.';

create table if not exists public.membership_pt_preference_time_slots (
  id uuid primary key default extensions.gen_random_uuid(),
  pt_preference_id uuid not null
    references public.membership_pt_preferences(id)
    on delete cascade,
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),

  constraint membership_pt_preference_time_slots_day_valid
    check (day_of_week between 0 and 6),
  constraint membership_pt_preference_time_slots_time_valid
    check (start_time < end_time),
  constraint membership_pt_preference_time_slots_unique
    unique (pt_preference_id, day_of_week, start_time, end_time)
);

comment on table public.membership_pt_preference_time_slots is
  'Availability windows submitted by a member for PT assignment. day_of_week uses 0 = Sunday through 6 = Saturday.';

create table if not exists public.membership_pt_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  subscription_id uuid not null
    references public.membership_subscriptions(id)
    on delete cascade,
  pt_id uuid not null
    references public.users(id),
  assigned_by_manager_id uuid
    references public.users(id)
    on delete set null,
  status text not null default 'pending_member_decision',
  member_response_note text,
  assigned_at timestamptz not null default now(),
  member_decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_pt_assignments_status_valid
    check (status in ('pending_member_decision', 'accepted', 'rejected', 'cancelled')),
  constraint membership_pt_assignments_response_note_not_blank
    check (member_response_note is null or length(trim(member_response_note)) > 0)
);

comment on table public.membership_pt_assignments is
  'PT assignment attempts for a PT subscription. Rejected assignments are kept for history.';

create table if not exists public.vouchers (
  id uuid primary key default extensions.gen_random_uuid(),
  facility_id uuid not null
    references public.gym_facilities(id)
    on delete cascade,
  code text not null,
  discount_type text not null,
  percentage numeric(5, 2),
  amount numeric(12, 2),
  status text not null default 'active',
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vouchers_code_unique
    unique (code),
  constraint vouchers_code_format
    check (code = upper(trim(code)) and length(code) > 0),
  constraint vouchers_discount_type_valid
    check (discount_type in ('percentage', 'amount')),
  constraint vouchers_discount_value_valid
    check (
      (
        discount_type = 'percentage'
        and percentage is not null
        and percentage > 0
        and percentage <= 100
        and amount is null
      )
      or
      (
        discount_type = 'amount'
        and amount is not null
        and amount > 0
        and percentage is null
      )
    ),
  constraint vouchers_status_valid
    check (status in ('active', 'disabled', 'expired')),
  constraint vouchers_date_range_valid
    check (starts_at is null or expires_at is null or starts_at < expires_at)
);

comment on table public.vouchers is
  'One-time discount codes. A voucher is considered used when it has one voucher_redemptions row.';
comment on column public.vouchers.code is
  'Uppercase, trimmed voucher code. Codes are globally unique and can be used once.';

create table if not exists public.voucher_redemptions (
  id uuid primary key default extensions.gen_random_uuid(),
  voucher_id uuid not null
    references public.vouchers(id),
  member_id uuid not null
    references public.users(id),
  subscription_id uuid not null
    references public.membership_subscriptions(id),
  discount_amount numeric(12, 2) not null default 0,
  redeemed_at timestamptz not null default now(),

  constraint voucher_redemptions_voucher_unique
    unique (voucher_id),
  constraint voucher_redemptions_subscription_unique
    unique (subscription_id),
  constraint voucher_redemptions_discount_nonnegative
    check (discount_amount >= 0)
);

comment on table public.voucher_redemptions is
  'Records one-time voucher usage for a subscription. unique(voucher_id) enforces one use per code.';

create table if not exists public.membership_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  subscription_id uuid not null
    references public.membership_subscriptions(id),
  member_id uuid not null
    references public.users(id),
  amount numeric(12, 2) not null,
  method text,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_payments_amount_nonnegative
    check (amount >= 0),
  constraint membership_payments_method_valid
    check (method is null or method in ('cash', 'bank_transfer', 'card', 'e_wallet', 'other')),
  constraint membership_payments_status_valid
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  constraint membership_payments_paid_at_required
    check (status <> 'paid' or paid_at is not null)
);

comment on table public.membership_payments is
  'Payment attempts for membership subscriptions. A paid payment activates the subscription.';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.ensure_membership_subscription_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  package_record record;
begin
  if tg_op = 'INSERT' then
    select facility_id, price, has_pt, duration_days, session_count
    into package_record
    from public.membership_packages
    where id = new.package_id;

    if package_record is null then
      raise exception 'membership package must exist';
    end if;

    if not exists (
      select 1
      from public.users
      where id = new.member_id
        and role = 'member'
    ) then
      raise exception 'membership_subscriptions.member_id must reference a member user';
    end if;

    new.facility_id := package_record.facility_id;
    new.base_price := package_record.price;
    new.has_pt_snapshot := package_record.has_pt;
    new.duration_days_snapshot := package_record.duration_days;
    new.session_count_snapshot := package_record.session_count;

    if new.discount_amount is null then
      new.discount_amount := 0;
    end if;

    if new.has_pt_snapshot and new.status = 'pending_payment' then
      new.status := 'pending_pt_setup';
    end if;

    if new.status = 'active' then
      raise exception 'membership subscriptions must be activated by a paid payment';
    end if;
  else
    if new.member_id <> old.member_id
      or new.facility_id <> old.facility_id
      or new.package_id <> old.package_id
      or new.base_price <> old.base_price
      or new.has_pt_snapshot <> old.has_pt_snapshot
      or new.duration_days_snapshot is distinct from old.duration_days_snapshot
      or new.session_count_snapshot is distinct from old.session_count_snapshot
    then
      raise exception 'membership subscription identity and package snapshots cannot be changed';
    end if;
  end if;

  if new.discount_amount is null then
    new.discount_amount := 0;
  end if;

  if new.discount_amount > new.base_price then
    raise exception 'membership subscription discount cannot exceed base price';
  end if;

  new.final_price := new.base_price - new.discount_amount;

  if not new.has_pt_snapshot and new.status = 'pending_pt_setup' then
    raise exception 'non-PT subscriptions cannot use pending_pt_setup status';
  end if;

  if new.has_pt_snapshot and new.status in ('pending_payment', 'active') then
    if not exists (
      select 1
      from public.membership_pt_assignments
      where subscription_id = new.id
        and status = 'accepted'
    ) then
      raise exception 'PT subscriptions require an accepted PT assignment before payment or activation';
    end if;
  end if;

  if new.status = 'active' then
    if not exists (
      select 1
      from public.membership_payments
      where subscription_id = new.id
        and status = 'paid'
    ) then
      raise exception 'membership subscriptions require a paid payment before activation';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.ensure_membership_pt_preference_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_record record;
begin
  select facility_id, has_pt_snapshot
  into subscription_record
  from public.membership_subscriptions
  where id = new.subscription_id;

  if subscription_record is null then
    raise exception 'membership subscription must exist';
  end if;

  if not subscription_record.has_pt_snapshot then
    raise exception 'PT preferences can only be created for PT subscriptions';
  end if;

  if new.preferred_pt_id is not null then
    if not exists (
      select 1
      from public.users
      where id = new.preferred_pt_id
        and role = 'pt'
    ) then
      raise exception 'preferred PT must reference a user with role pt';
    end if;

    if not exists (
      select 1
      from public.facility_pts
      where facility_id = subscription_record.facility_id
        and pt_id = new.preferred_pt_id
    ) then
      raise exception 'preferred PT must belong to the subscription facility';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.ensure_membership_pt_assignment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_record record;
  assigner_role text;
begin
  select facility_id, has_pt_snapshot, status
  into subscription_record
  from public.membership_subscriptions
  where id = new.subscription_id;

  if subscription_record is null then
    raise exception 'membership subscription must exist';
  end if;

  if not subscription_record.has_pt_snapshot then
    raise exception 'PT assignments can only be created for PT subscriptions';
  end if;

  if tg_op = 'INSERT' and subscription_record.status <> 'pending_pt_setup' then
    raise exception 'PT assignments can only be created while subscription is pending_pt_setup';
  end if;

  if not exists (
    select 1
    from public.users
    where id = new.pt_id
      and role = 'pt'
  ) then
    raise exception 'assigned PT must reference a user with role pt';
  end if;

  if not exists (
    select 1
    from public.facility_pts
    where facility_id = subscription_record.facility_id
      and pt_id = new.pt_id
  ) then
    raise exception 'assigned PT must belong to the subscription facility';
  end if;

  if new.assigned_by_manager_id is not null then
    select role
    into assigner_role
    from public.users
    where id = new.assigned_by_manager_id;

    if assigner_role not in ('manager', 'owner') then
      raise exception 'assigned_by_manager_id must reference a manager or owner user';
    end if;

    if assigner_role = 'manager'
      and not exists (
        select 1
        from public.facility_managers
        where facility_id = subscription_record.facility_id
          and manager_id = new.assigned_by_manager_id
      )
    then
      raise exception 'manager must belong to the subscription facility';
    end if;

    if assigner_role = 'owner'
      and not exists (
        select 1
        from public.gym_facilities
        where id = subscription_record.facility_id
          and owner_id = new.assigned_by_manager_id
      )
    then
      raise exception 'owner must own the subscription facility';
    end if;
  end if;

  if new.status in ('accepted', 'rejected') and new.member_decided_at is null then
    new.member_decided_at := now();
  end if;

  return new;
end;
$$;

create or replace function private.apply_membership_pt_assignment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    update public.membership_subscriptions
    set status = 'pending_payment',
        updated_at = now()
    where id = new.subscription_id
      and status = 'pending_pt_setup';
  end if;

  return new;
end;
$$;

create or replace function private.prepare_voucher_redemption()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  voucher_record record;
  subscription_record record;
begin
  select facility_id, discount_type, percentage, amount, status, starts_at, expires_at
  into voucher_record
  from public.vouchers
  where id = new.voucher_id;

  if voucher_record is null then
    raise exception 'voucher must exist';
  end if;

  select member_id, facility_id, base_price, discount_amount, status
  into subscription_record
  from public.membership_subscriptions
  where id = new.subscription_id;

  if subscription_record is null then
    raise exception 'membership subscription must exist';
  end if;

  if subscription_record.member_id <> new.member_id then
    raise exception 'voucher redemption member must match subscription member';
  end if;

  if voucher_record.facility_id <> subscription_record.facility_id then
    raise exception 'voucher must belong to the subscription facility';
  end if;

  if voucher_record.status <> 'active' then
    raise exception 'voucher is not active';
  end if;

  if voucher_record.starts_at is not null and now() < voucher_record.starts_at then
    raise exception 'voucher is not active yet';
  end if;

  if voucher_record.expires_at is not null and now() >= voucher_record.expires_at then
    raise exception 'voucher has expired';
  end if;

  if subscription_record.status <> 'pending_payment' then
    raise exception 'voucher can only be redeemed before payment';
  end if;

  if subscription_record.discount_amount > 0 then
    raise exception 'subscription already has a discount';
  end if;

  if voucher_record.discount_type = 'percentage' then
    new.discount_amount := round(subscription_record.base_price * voucher_record.percentage / 100, 2);
  else
    new.discount_amount := least(voucher_record.amount, subscription_record.base_price);
  end if;

  return new;
end;
$$;

create or replace function private.apply_voucher_redemption()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.membership_subscriptions
  set discount_amount = new.discount_amount,
      updated_at = now()
  where id = new.subscription_id;

  return new;
end;
$$;

create or replace function private.ensure_membership_payment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_record record;
begin
  select member_id, status, final_price
  into subscription_record
  from public.membership_subscriptions
  where id = new.subscription_id;

  if subscription_record is null then
    raise exception 'membership subscription must exist';
  end if;

  if subscription_record.member_id <> new.member_id then
    raise exception 'payment member must match subscription member';
  end if;

  if new.status in ('pending', 'paid') then
    if subscription_record.status <> 'pending_payment'
      and not (
        tg_op = 'UPDATE'
        and old.status = 'paid'
        and new.status = 'paid'
        and subscription_record.status = 'active'
      )
    then
      raise exception 'payments can only be created when subscription is pending_payment';
    end if;
  end if;

  if new.status = 'paid' and new.amount <> subscription_record.final_price then
    raise exception 'paid payment amount must equal subscription final price';
  end if;

  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;

  return new;
end;
$$;

create or replace function private.apply_membership_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  activation_time timestamptz;
begin
  if new.status = 'paid'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    activation_time := coalesce(new.paid_at, now());

    update public.membership_subscriptions
    set status = 'active',
        activated_at = coalesce(activated_at, activation_time),
        starts_at = coalesce(starts_at, activation_time),
        expires_at = case
          when duration_days_snapshot is not null then
            coalesce(starts_at, activation_time) + make_interval(days => duration_days_snapshot)
          else expires_at
        end,
        updated_at = now()
    where id = new.subscription_id
      and status = 'pending_payment';
  end if;

  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.set_updated_at() from anon;
revoke all on function private.set_updated_at() from authenticated;
revoke all on function private.ensure_membership_subscription_integrity() from public;
revoke all on function private.ensure_membership_subscription_integrity() from anon;
revoke all on function private.ensure_membership_subscription_integrity() from authenticated;
revoke all on function private.ensure_membership_pt_preference_integrity() from public;
revoke all on function private.ensure_membership_pt_preference_integrity() from anon;
revoke all on function private.ensure_membership_pt_preference_integrity() from authenticated;
revoke all on function private.ensure_membership_pt_assignment_integrity() from public;
revoke all on function private.ensure_membership_pt_assignment_integrity() from anon;
revoke all on function private.ensure_membership_pt_assignment_integrity() from authenticated;
revoke all on function private.apply_membership_pt_assignment_status() from public;
revoke all on function private.apply_membership_pt_assignment_status() from anon;
revoke all on function private.apply_membership_pt_assignment_status() from authenticated;
revoke all on function private.prepare_voucher_redemption() from public;
revoke all on function private.prepare_voucher_redemption() from anon;
revoke all on function private.prepare_voucher_redemption() from authenticated;
revoke all on function private.apply_voucher_redemption() from public;
revoke all on function private.apply_voucher_redemption() from anon;
revoke all on function private.apply_voucher_redemption() from authenticated;
revoke all on function private.ensure_membership_payment_integrity() from public;
revoke all on function private.ensure_membership_payment_integrity() from anon;
revoke all on function private.ensure_membership_payment_integrity() from authenticated;
revoke all on function private.apply_membership_payment_status() from public;
revoke all on function private.apply_membership_payment_status() from anon;
revoke all on function private.apply_membership_payment_status() from authenticated;

drop trigger if exists set_membership_subscriptions_updated_at
  on public.membership_subscriptions;
create trigger set_membership_subscriptions_updated_at
before update on public.membership_subscriptions
for each row
execute function private.set_updated_at();

drop trigger if exists ensure_membership_subscription_integrity_on_write
  on public.membership_subscriptions;
create trigger ensure_membership_subscription_integrity_on_write
before insert or update on public.membership_subscriptions
for each row
execute function private.ensure_membership_subscription_integrity();

drop trigger if exists set_membership_pt_preferences_updated_at
  on public.membership_pt_preferences;
create trigger set_membership_pt_preferences_updated_at
before update on public.membership_pt_preferences
for each row
execute function private.set_updated_at();

drop trigger if exists ensure_membership_pt_preference_integrity_on_write
  on public.membership_pt_preferences;
create trigger ensure_membership_pt_preference_integrity_on_write
before insert or update on public.membership_pt_preferences
for each row
execute function private.ensure_membership_pt_preference_integrity();

drop trigger if exists set_membership_pt_assignments_updated_at
  on public.membership_pt_assignments;
create trigger set_membership_pt_assignments_updated_at
before update on public.membership_pt_assignments
for each row
execute function private.set_updated_at();

drop trigger if exists ensure_membership_pt_assignment_integrity_on_write
  on public.membership_pt_assignments;
create trigger ensure_membership_pt_assignment_integrity_on_write
before insert or update on public.membership_pt_assignments
for each row
execute function private.ensure_membership_pt_assignment_integrity();

drop trigger if exists apply_membership_pt_assignment_status_on_write
  on public.membership_pt_assignments;
create trigger apply_membership_pt_assignment_status_on_write
after insert or update on public.membership_pt_assignments
for each row
execute function private.apply_membership_pt_assignment_status();

drop trigger if exists set_vouchers_updated_at
  on public.vouchers;
create trigger set_vouchers_updated_at
before update on public.vouchers
for each row
execute function private.set_updated_at();

drop trigger if exists prepare_voucher_redemption_on_write
  on public.voucher_redemptions;
create trigger prepare_voucher_redemption_on_write
before insert on public.voucher_redemptions
for each row
execute function private.prepare_voucher_redemption();

drop trigger if exists apply_voucher_redemption_on_write
  on public.voucher_redemptions;
create trigger apply_voucher_redemption_on_write
after insert on public.voucher_redemptions
for each row
execute function private.apply_voucher_redemption();

drop trigger if exists set_membership_payments_updated_at
  on public.membership_payments;
create trigger set_membership_payments_updated_at
before update on public.membership_payments
for each row
execute function private.set_updated_at();

drop trigger if exists ensure_membership_payment_integrity_on_write
  on public.membership_payments;
create trigger ensure_membership_payment_integrity_on_write
before insert or update on public.membership_payments
for each row
execute function private.ensure_membership_payment_integrity();

drop trigger if exists apply_membership_payment_status_on_write
  on public.membership_payments;
create trigger apply_membership_payment_status_on_write
after insert or update on public.membership_payments
for each row
execute function private.apply_membership_payment_status();

create unique index if not exists membership_pt_assignments_one_pending_idx
  on public.membership_pt_assignments (subscription_id)
  where status = 'pending_member_decision';

create unique index if not exists membership_pt_assignments_one_accepted_idx
  on public.membership_pt_assignments (subscription_id)
  where status = 'accepted';

create unique index if not exists membership_payments_one_paid_idx
  on public.membership_payments (subscription_id)
  where status = 'paid';

create index if not exists membership_subscriptions_member_id_idx
  on public.membership_subscriptions (member_id);

create index if not exists membership_subscriptions_facility_id_idx
  on public.membership_subscriptions (facility_id);

create index if not exists membership_subscriptions_package_id_idx
  on public.membership_subscriptions (package_id);

create index if not exists membership_subscriptions_status_idx
  on public.membership_subscriptions (status);

create index if not exists membership_pt_preferences_preferred_pt_id_idx
  on public.membership_pt_preferences (preferred_pt_id);

create index if not exists membership_pt_preference_time_slots_preference_id_idx
  on public.membership_pt_preference_time_slots (pt_preference_id);

create index if not exists membership_pt_assignments_pt_id_idx
  on public.membership_pt_assignments (pt_id);

create index if not exists membership_pt_assignments_assigned_by_manager_id_idx
  on public.membership_pt_assignments (assigned_by_manager_id);

create index if not exists vouchers_facility_id_idx
  on public.vouchers (facility_id);

create index if not exists vouchers_status_idx
  on public.vouchers (status);

create index if not exists voucher_redemptions_member_id_idx
  on public.voucher_redemptions (member_id);

create index if not exists membership_payments_member_id_idx
  on public.membership_payments (member_id);

create index if not exists membership_payments_subscription_id_idx
  on public.membership_payments (subscription_id);

alter table public.membership_subscriptions enable row level security;
alter table public.membership_pt_preferences enable row level security;
alter table public.membership_pt_preference_time_slots enable row level security;
alter table public.membership_pt_assignments enable row level security;
alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;
alter table public.membership_payments enable row level security;
