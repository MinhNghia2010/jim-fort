create schema if not exists private;

create table if not exists public.membership_packages (
  id uuid primary key default extensions.gen_random_uuid(),
  facility_id uuid not null
    references public.gym_facilities(id)
    on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null,
  has_pt boolean not null default false,
  duration_days integer,
  session_count integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_packages_name_not_blank
    check (length(trim(name)) > 0),
  constraint membership_packages_price_nonnegative
    check (price >= 0),
  constraint membership_packages_status_valid
    check (status in ('active', 'inactive', 'archived')),
  constraint membership_packages_duration_or_sessions
    check (
      (
        has_pt = false
        and duration_days is not null
        and duration_days > 0
        and session_count is null
      )
      or
      (
        has_pt = true
        and session_count is not null
        and session_count > 0
        and duration_days is null
      )
    ),
  constraint membership_packages_facility_name_unique
    unique (facility_id, name)
);

comment on table public.membership_packages is
  'Membership packages offered by a gym facility. Non-PT packages use duration_days; PT packages use session_count.';
comment on column public.membership_packages.has_pt is
  'When true, the package is PT-based and uses session_count instead of duration_days.';
comment on column public.membership_packages.duration_days is
  'Required for non-PT packages. Must be null for PT packages.';
comment on column public.membership_packages.session_count is
  'Required for PT packages. Must be null for non-PT packages.';

create table if not exists public.membership_package_rooms (
  package_id uuid not null
    references public.membership_packages(id)
    on delete cascade,
  room_id uuid not null
    references public.rooms(id)
    on delete cascade,
  created_at timestamptz not null default now(),

  primary key (package_id, room_id)
);

comment on table public.membership_package_rooms is
  'Rooms that a membership package can access. Rooms must belong to the same facility as the package.';

create or replace function private.ensure_membership_package_room_facility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  package_facility_id uuid;
  room_facility_id uuid;
begin
  select facility_id
  into package_facility_id
  from public.membership_packages
  where id = new.package_id;

  select facility_id
  into room_facility_id
  from public.rooms
  where id = new.room_id;

  if package_facility_id is null or room_facility_id is null then
    raise exception 'membership package and room must exist';
  end if;

  if package_facility_id <> room_facility_id then
    raise exception 'membership package room must belong to the same facility as the package';
  end if;

  return new;
end;
$$;

revoke all on function private.ensure_membership_package_room_facility() from public;
revoke all on function private.ensure_membership_package_room_facility() from anon;
revoke all on function private.ensure_membership_package_room_facility() from authenticated;

drop trigger if exists ensure_membership_package_room_facility_on_write
  on public.membership_package_rooms;
create trigger ensure_membership_package_room_facility_on_write
before insert or update on public.membership_package_rooms
for each row
execute function private.ensure_membership_package_room_facility();

create index if not exists membership_packages_facility_id_idx
  on public.membership_packages (facility_id);

create index if not exists membership_packages_status_idx
  on public.membership_packages (status);

create index if not exists membership_package_rooms_room_id_idx
  on public.membership_package_rooms (room_id);

alter table public.membership_packages enable row level security;
alter table public.membership_package_rooms enable row level security;
