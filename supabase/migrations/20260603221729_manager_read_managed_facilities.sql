create schema if not exists private;

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

revoke execute on function private.is_current_user_facility_manager(uuid)
from public, anon, authenticated, service_role;

drop policy if exists "Managers can read managed facilities"
  on public.gym_facilities;
create policy "Managers can read managed facilities"
  on public.gym_facilities
  for select
  to authenticated
  using ((select private.is_current_user_facility_manager(id)));
