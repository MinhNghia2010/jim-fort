alter table public.membership_pt_assignments
  add column if not exists schedule_starts_on date,
  add column if not exists schedule_timezone text not null default 'Asia/Ho_Chi_Minh',
  add column if not exists schedule_note text;

alter table public.membership_pt_assignments
  add constraint membership_pt_assignments_schedule_timezone_not_blank
    check (length(trim(schedule_timezone)) > 0),
  add constraint membership_pt_assignments_schedule_note_not_blank
    check (schedule_note is null or length(trim(schedule_note)) > 0);

comment on column public.membership_pt_assignments.schedule_starts_on is
  'Local calendar date from which generated PT sessions may start after payment.';
comment on column public.membership_pt_assignments.schedule_timezone is
  'Timezone used to convert manager schedule days and times into generated session timestamps.';
comment on column public.membership_pt_assignments.schedule_note is
  'Optional manager note shown with the proposed PT schedule.';

create table if not exists public.membership_pt_assignment_schedule_slots (
  id uuid primary key default extensions.gen_random_uuid(),
  assignment_id uuid not null
    references public.membership_pt_assignments(id)
    on delete cascade,
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),

  constraint membership_pt_assignment_schedule_slots_day_valid
    check (day_of_week between 0 and 6),
  constraint membership_pt_assignment_schedule_slots_time_valid
    check (start_time < end_time),
  constraint membership_pt_assignment_schedule_slots_unique
    unique (assignment_id, day_of_week, start_time, end_time)
);

comment on table public.membership_pt_assignment_schedule_slots is
  'Manager-proposed weekly schedule for a PT assignment before the member pays. day_of_week uses 0 = Sunday through 6 = Saturday.';

create table if not exists public.membership_pt_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  subscription_id uuid not null
    references public.membership_subscriptions(id)
    on delete cascade,
  assignment_id uuid not null
    references public.membership_pt_assignments(id)
    on delete cascade,
  member_id uuid not null
    references public.users(id),
  pt_id uuid not null
    references public.users(id),
  session_number integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_pt_sessions_session_number_positive
    check (session_number > 0),
  constraint membership_pt_sessions_time_valid
    check (starts_at < ends_at),
  constraint membership_pt_sessions_status_valid
    check (status in ('scheduled', 'completed', 'cancelled', 'missed', 'rescheduled')),
  constraint membership_pt_sessions_assignment_session_unique
    unique (assignment_id, session_number),
  constraint membership_pt_sessions_assignment_time_unique
    unique (assignment_id, starts_at, ends_at)
);

comment on table public.membership_pt_sessions is
  'Actual dated PT sessions generated only after a PT subscription is active.';
comment on column public.membership_pt_sessions.session_number is
  'Sequential session number within the accepted PT assignment.';

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

  if not exists (
    select 1
    from pg_timezone_names
    where name = new.schedule_timezone
  ) then
    raise exception 'schedule_timezone must be a valid Postgres timezone name';
  end if;

  if new.status = 'accepted' then
    if new.schedule_starts_on is null then
      raise exception 'accepted PT assignments require schedule_starts_on';
    end if;

    if not exists (
      select 1
      from public.membership_pt_assignment_schedule_slots
      where assignment_id = new.id
    ) then
      raise exception 'accepted PT assignments require at least one schedule slot';
    end if;

    if tg_op = 'UPDATE'
      and old.status = 'accepted'
      and (
        new.subscription_id <> old.subscription_id
        or new.pt_id <> old.pt_id
        or new.assigned_by_manager_id is distinct from old.assigned_by_manager_id
        or new.schedule_starts_on is distinct from old.schedule_starts_on
        or new.schedule_timezone is distinct from old.schedule_timezone
      )
    then
      raise exception 'accepted PT assignment identity and schedule cannot be changed';
    end if;
  end if;

  if new.status in ('accepted', 'rejected') and new.member_decided_at is null then
    new.member_decided_at := now();
  end if;

  return new;
end;
$$;

create or replace function private.ensure_membership_pt_assignment_schedule_slot_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_status text;
begin
  select status
  into assignment_status
  from public.membership_pt_assignments
  where id = new.assignment_id;

  if assignment_status is null then
    raise exception 'PT assignment must exist';
  end if;

  if assignment_status <> 'pending_member_decision' then
    raise exception 'PT assignment schedule slots can only be changed before member decision';
  end if;

  return new;
end;
$$;

create or replace function private.ensure_membership_pt_session_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_record record;
  assignment_record record;
begin
  select member_id, status, has_pt_snapshot, session_count_snapshot
  into subscription_record
  from public.membership_subscriptions
  where id = new.subscription_id;

  if subscription_record is null then
    raise exception 'membership subscription must exist';
  end if;

  if subscription_record.status <> 'active' then
    raise exception 'PT sessions can only be created for active subscriptions';
  end if;

  if not subscription_record.has_pt_snapshot then
    raise exception 'PT sessions can only be created for PT subscriptions';
  end if;

  if new.session_number > subscription_record.session_count_snapshot then
    raise exception 'session_number cannot exceed subscription session count';
  end if;

  select subscription_id, pt_id, status
  into assignment_record
  from public.membership_pt_assignments
  where id = new.assignment_id;

  if assignment_record is null then
    raise exception 'PT assignment must exist';
  end if;

  if assignment_record.subscription_id <> new.subscription_id then
    raise exception 'PT session assignment must belong to the subscription';
  end if;

  if assignment_record.status <> 'accepted' then
    raise exception 'PT sessions require an accepted PT assignment';
  end if;

  new.member_id := subscription_record.member_id;
  new.pt_id := assignment_record.pt_id;

  return new;
end;
$$;

create or replace function private.generate_membership_pt_sessions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_record record;
  slot_record record;
  session_date date;
  generated_count integer := 0;
  target_count integer;
  days_checked integer := 0;
  generation_start_date date;
  session_start timestamptz;
  session_end timestamptz;
begin
  if new.status <> 'active'
    or old.status is not distinct from new.status
    or not new.has_pt_snapshot
  then
    return new;
  end if;

  if exists (
    select 1
    from public.membership_pt_sessions
    where subscription_id = new.id
  ) then
    return new;
  end if;

  select id, pt_id, schedule_starts_on, schedule_timezone
  into assignment_record
  from public.membership_pt_assignments
  where subscription_id = new.id
    and status = 'accepted'
  order by member_decided_at desc nulls last, assigned_at desc
  limit 1;

  if assignment_record is null then
    raise exception 'active PT subscriptions require an accepted PT assignment';
  end if;

  if assignment_record.schedule_starts_on is null then
    raise exception 'accepted PT assignment requires schedule_starts_on before generating sessions';
  end if;

  if not exists (
    select 1
    from public.membership_pt_assignment_schedule_slots
    where assignment_id = assignment_record.id
  ) then
    raise exception 'accepted PT assignment requires schedule slots before generating sessions';
  end if;

  target_count := new.session_count_snapshot;

  if target_count is null or target_count <= 0 then
    raise exception 'PT subscription session count must be positive';
  end if;

  generation_start_date := greatest(
    assignment_record.schedule_starts_on,
    (coalesce(new.activated_at, now()) at time zone assignment_record.schedule_timezone)::date
  );
  session_date := generation_start_date;

  while generated_count < target_count loop
    if days_checked > target_count * 14 + 366 then
      raise exception 'unable to generate PT sessions from assignment schedule';
    end if;

    for slot_record in
      select day_of_week, start_time, end_time
      from public.membership_pt_assignment_schedule_slots
      where assignment_id = assignment_record.id
        and day_of_week = extract(dow from session_date)::integer
      order by start_time, end_time
    loop
      exit when generated_count >= target_count;

      generated_count := generated_count + 1;
      session_start := ((session_date + slot_record.start_time) at time zone assignment_record.schedule_timezone);
      session_end := ((session_date + slot_record.end_time) at time zone assignment_record.schedule_timezone);

      insert into public.membership_pt_sessions (
        subscription_id,
        assignment_id,
        member_id,
        pt_id,
        session_number,
        starts_at,
        ends_at
      ) values (
        new.id,
        assignment_record.id,
        new.member_id,
        assignment_record.pt_id,
        generated_count,
        session_start,
        session_end
      );
    end loop;

    session_date := session_date + 1;
    days_checked := days_checked + 1;
  end loop;

  return new;
end;
$$;

revoke all on function private.ensure_membership_pt_assignment_integrity() from public;
revoke all on function private.ensure_membership_pt_assignment_integrity() from anon;
revoke all on function private.ensure_membership_pt_assignment_integrity() from authenticated;
revoke all on function private.ensure_membership_pt_assignment_schedule_slot_integrity() from public;
revoke all on function private.ensure_membership_pt_assignment_schedule_slot_integrity() from anon;
revoke all on function private.ensure_membership_pt_assignment_schedule_slot_integrity() from authenticated;
revoke all on function private.ensure_membership_pt_session_integrity() from public;
revoke all on function private.ensure_membership_pt_session_integrity() from anon;
revoke all on function private.ensure_membership_pt_session_integrity() from authenticated;
revoke all on function private.generate_membership_pt_sessions() from public;
revoke all on function private.generate_membership_pt_sessions() from anon;
revoke all on function private.generate_membership_pt_sessions() from authenticated;

drop trigger if exists ensure_membership_pt_assignment_schedule_slot_integrity_on_write
  on public.membership_pt_assignment_schedule_slots;
create trigger ensure_membership_pt_assignment_schedule_slot_integrity_on_write
before insert or update on public.membership_pt_assignment_schedule_slots
for each row
execute function private.ensure_membership_pt_assignment_schedule_slot_integrity();

drop trigger if exists set_membership_pt_sessions_updated_at
  on public.membership_pt_sessions;
create trigger set_membership_pt_sessions_updated_at
before update on public.membership_pt_sessions
for each row
execute function private.set_updated_at();

drop trigger if exists ensure_membership_pt_session_integrity_on_write
  on public.membership_pt_sessions;
create trigger ensure_membership_pt_session_integrity_on_write
before insert or update on public.membership_pt_sessions
for each row
execute function private.ensure_membership_pt_session_integrity();

drop trigger if exists generate_membership_pt_sessions_on_activation
  on public.membership_subscriptions;
create trigger generate_membership_pt_sessions_on_activation
after update of status on public.membership_subscriptions
for each row
when (new.status = 'active' and old.status is distinct from new.status and new.has_pt_snapshot = true)
execute function private.generate_membership_pt_sessions();

create index if not exists membership_pt_assignment_schedule_slots_assignment_id_idx
  on public.membership_pt_assignment_schedule_slots (assignment_id);

create index if not exists membership_pt_sessions_subscription_id_idx
  on public.membership_pt_sessions (subscription_id);

create index if not exists membership_pt_sessions_assignment_id_idx
  on public.membership_pt_sessions (assignment_id);

create index if not exists membership_pt_sessions_member_id_idx
  on public.membership_pt_sessions (member_id);

create index if not exists membership_pt_sessions_pt_id_idx
  on public.membership_pt_sessions (pt_id);

create index if not exists membership_pt_sessions_starts_at_idx
  on public.membership_pt_sessions (starts_at);

create index if not exists membership_pt_sessions_status_idx
  on public.membership_pt_sessions (status);

alter table public.membership_pt_assignment_schedule_slots enable row level security;
alter table public.membership_pt_sessions enable row level security;
