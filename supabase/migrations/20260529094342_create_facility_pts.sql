create schema if not exists private;

create table if not exists public.facility_pts (
  facility_id uuid not null
    references public.gym_facilities(id)
    on delete cascade,
  pt_id uuid not null
    references public.users(id)
    on delete cascade,
  assigned_by_manager_id uuid
    references public.users(id)
    on delete set null,
  created_at timestamptz not null default now(),

  primary key (facility_id, pt_id),
  constraint facility_pts_one_facility_per_pt unique (pt_id)
);

comment on table public.facility_pts is
  'Maps gym facilities to PT login users. One facility can have many PTs; each PT belongs to one facility.';
comment on column public.facility_pts.facility_id is
  'Facility that owns the PT assignment.';
comment on column public.facility_pts.pt_id is
  'User with role pt assigned to the facility.';
comment on column public.facility_pts.assigned_by_manager_id is
  'Manager or owner user who assigned the PT, when available.';

create or replace function private.ensure_facility_pt_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.users
    where id = new.pt_id
      and role = 'pt'
  ) then
    raise exception 'facility_pts.pt_id must reference a user with role pt';
  end if;

  if new.assigned_by_manager_id is not null
    and not exists (
      select 1
      from public.users
      where id = new.assigned_by_manager_id
        and role in ('manager', 'owner')
    )
  then
    raise exception 'facility_pts.assigned_by_manager_id must reference a manager or owner user';
  end if;

  return new;
end;
$$;

revoke all on function private.ensure_facility_pt_roles() from public;
revoke all on function private.ensure_facility_pt_roles() from anon;
revoke all on function private.ensure_facility_pt_roles() from authenticated;

drop trigger if exists ensure_facility_pt_roles_on_write on public.facility_pts;
create trigger ensure_facility_pt_roles_on_write
before insert or update on public.facility_pts
for each row
execute function private.ensure_facility_pt_roles();

alter table public.facility_pts enable row level security;
