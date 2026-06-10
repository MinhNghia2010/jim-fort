grant select on table public.gym_equipments to authenticated;

alter table if exists public.gym_equipments enable row level security;

drop policy if exists "Managers can read equipments in managed facilities"
  on public.gym_equipments;
create policy "Managers can read equipments in managed facilities"
  on public.gym_equipments
  for select
  to authenticated
  using ((select private.is_current_user_facility_manager(facility_id)));
