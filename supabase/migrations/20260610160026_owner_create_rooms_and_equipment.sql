revoke insert on table public.rooms from authenticated;
revoke insert on table public.gym_equipments from authenticated;

grant insert (facility_id, name, description, status)
on table public.rooms
to authenticated;

grant insert (
  facility_id,
  room_id,
  name,
  category,
  equipment_code,
  serial_number,
  brand,
  model,
  description,
  purchase_date,
  purchase_price,
  status,
  note
)
on table public.gym_equipments
to authenticated;

alter table public.rooms enable row level security;
alter table public.gym_equipments enable row level security;

drop policy if exists "Owners can create rooms in owned facilities"
  on public.rooms;
create policy "Owners can create rooms in owned facilities"
  on public.rooms
  for insert
  to authenticated
  with check (
    (select private.is_current_user_facility_owner(facility_id))
  );

drop policy if exists "Owners can create equipments in owned facilities"
  on public.gym_equipments;
create policy "Owners can create equipments in owned facilities"
  on public.gym_equipments
  for insert
  to authenticated
  with check (
    (select private.is_current_user_facility_owner(facility_id))
    and (
      room_id is null
      or exists (
        select 1
        from public.rooms room
        where room.id = gym_equipments.room_id
          and room.facility_id = gym_equipments.facility_id
      )
    )
  );
