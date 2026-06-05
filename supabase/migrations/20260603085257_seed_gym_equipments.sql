with facility as (
  select id
  from public.gym_facilities
  where name = 'Jim Fort Gym'
),
equipment_types as (
  select *
  from (values
    ('TM', 'Treadmill', 'treadmill', 'Cardio Room'::text, 'Life Fitness', 'T5', 12, 2500.00::numeric, 'Commercial treadmill for running and walking workouts.'),
    ('BIKE', 'Exercise Bike', 'bike', 'Cardio Room'::text, 'Technogym', 'Bike 700', 10, 1200.00::numeric, 'Upright exercise bike for low-impact cardio training.'),
    ('ELLIP', 'Elliptical Trainer', 'elliptical', 'Cardio Room'::text, 'Precor', 'EFX 835', 8, 2200.00::numeric, 'Elliptical trainer for full-body cardio workouts.'),
    ('ROW', 'Rowing Machine', 'rowing machine', 'Cardio Room'::text, 'Concept2', 'RowErg', 5, 1100.00::numeric, 'Indoor rowing machine for cardio and endurance training.'),
    ('BENCH', 'Bench Press', 'bench', 'Weight Room'::text, 'Impulse', 'BP-100', 10, 800.00::numeric, 'Flat bench press station for barbell strength training.'),
    ('RACK', 'Squat Rack', 'squat rack', 'Weight Room'::text, 'Rogue', 'RML-390F', 8, 1450.00::numeric, 'Power rack for squats, presses, and compound lifts.'),
    ('CABLE', 'Cable Machine', 'cable machine', 'Weight Room'::text, 'Life Fitness', 'Signature Cable', 6, 3200.00::numeric, 'Adjustable cable machine for resistance exercises.'),
    ('DBSET', 'Dumbbell Set', 'dumbbell', 'Weight Room'::text, 'Rogue', 'Rubber Hex Set', 10, 950.00::numeric, 'Dumbbell set for free-weight strength exercises.'),
    ('BAR', 'Olympic Barbell', 'barbell', 'Weight Room'::text, 'Eleiko', 'Training Bar', 7, 650.00::numeric, 'Olympic barbell for strength and weightlifting exercises.'),
    ('LEGPRESS', 'Leg Press Machine', 'leg press', 'Weight Room'::text, 'Technogym', 'Selection Leg Press', 4, 3600.00::numeric, 'Selectorized leg press machine for lower-body training.'),
    ('YOGAMAT', 'Yoga Mat Set', 'yoga mat', 'Yoga Room'::text, 'Manduka', 'PRO Set', 8, 180.00::numeric, 'Shared yoga mat set for classes and mobility sessions.'),
    ('REFORMER', 'Pilates Reformer', 'pilates reformer', 'Yoga Room'::text, 'Balanced Body', 'Allegro 2', 3, 3100.00::numeric, 'Pilates reformer for guided strength and mobility sessions.'),
    ('BALANCE', 'Balance Trainer', 'balance trainer', 'Yoga Room'::text, 'BOSU', 'Pro Balance', 3, 190.00::numeric, 'Balance trainer for stability and rehabilitation exercises.'),
    ('FOAM', 'Foam Roller Rack', 'foam roller', 'Yoga Room'::text, 'TriggerPoint', 'Grid Rack', 2, 240.00::numeric, 'Foam roller rack for warm-up and recovery work.'),
    ('CAM', 'Security Camera', 'camera', null::text, 'Hikvision', 'DS-2CD', 4, 150.00::numeric, 'Facility-level security camera used for monitoring common areas.')
  ) as seed(
    code_prefix,
    display_name,
    category,
    room_name,
    brand,
    model,
    quantity,
    unit_price,
    description
  )
),
expanded as (
  select
    f.id as facility_id,
    et.code_prefix,
    et.display_name,
    et.category,
    et.room_name,
    et.brand,
    et.model,
    et.unit_price,
    et.description,
    item_no,
    et.code_prefix || '-' || lpad(item_no::text, 3, '0') as equipment_code
  from facility f
  cross join equipment_types et
  cross join lateral generate_series(1, et.quantity) as item_no
),
ranked as (
  select
    expanded.*,
    row_number() over (order by md5(equipment_code)) as status_rank
  from expanded
),
prepared as (
  select
    ranked.facility_id,
    rooms.id as room_id,
    ranked.display_name || ' ' || lpad(ranked.item_no::text, 2, '0') as name,
    ranked.category,
    ranked.equipment_code,
    'JF-' || ranked.equipment_code || '-2026' as serial_number,
    ranked.brand,
    ranked.model,
    ranked.description,
    date '2023-01-01' + (((ranked.status_rank * 11) % 900)::integer) as purchase_date,
    ranked.unit_price as purchase_price,
    case
      when ranked.status_rank <= 68 then 'active'
      when ranked.status_rank <= 85 then 'maintenance'
      when ranked.status_rank <= 95 then 'broken'
      else 'retired'
    end as status,
    case
      when ranked.status_rank <= 68 then 'Jim Fort equipment demo seed: available for daily use.'
      when ranked.status_rank <= 85 then 'Jim Fort equipment demo seed: scheduled preventive maintenance.'
      when ranked.status_rank <= 95 then 'Jim Fort equipment demo seed: out of service and requires repair.'
      else 'Jim Fort equipment demo seed: retired from member use.'
    end as note
  from ranked
  left join public.rooms rooms
    on rooms.facility_id = ranked.facility_id
   and rooms.name = ranked.room_name
)
insert into public.gym_equipments as target (
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
select
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
from prepared
on conflict (facility_id, equipment_code) do update
set
  room_id = excluded.room_id,
  name = excluded.name,
  category = excluded.category,
  serial_number = excluded.serial_number,
  brand = excluded.brand,
  model = excluded.model,
  description = excluded.description,
  purchase_date = excluded.purchase_date,
  purchase_price = excluded.purchase_price,
  status = excluded.status,
  note = excluded.note,
  updated_at = now();

do $$
declare
  v_facility_id uuid;
begin
  select id
  into v_facility_id
  from public.gym_facilities
  where name = 'Jim Fort Gym';

  if v_facility_id is null then
    raise exception 'Jim Fort Gym facility is required for equipment seed';
  end if;

  if (select count(*) from public.gym_equipments where facility_id = v_facility_id) <> 100 then
    raise exception 'expected 100 Jim Fort Gym equipment rows';
  end if;

  if (select count(*) from public.gym_equipments where facility_id = v_facility_id and status = 'active') <> 68 then
    raise exception 'expected 68 active equipment rows';
  end if;

  if (select count(*) from public.gym_equipments where facility_id = v_facility_id and status = 'maintenance') <> 17 then
    raise exception 'expected 17 maintenance equipment rows';
  end if;

  if (select count(*) from public.gym_equipments where facility_id = v_facility_id and status = 'broken') <> 10 then
    raise exception 'expected 10 broken equipment rows';
  end if;

  if (select count(*) from public.gym_equipments where facility_id = v_facility_id and status = 'retired') <> 5 then
    raise exception 'expected 5 retired equipment rows';
  end if;

  if exists (
    select 1
    from public.gym_equipments ge
    join public.rooms r on r.id = ge.room_id
    where ge.facility_id = v_facility_id
      and r.facility_id <> ge.facility_id
  ) then
    raise exception 'equipment room must belong to the same facility';
  end if;

  if exists (
    select 1
    from public.gym_equipments ge
    where ge.facility_id = v_facility_id
      and ge.equipment_code not like 'CAM-%'
      and ge.room_id is null
  ) then
    raise exception 'non-camera equipment must be assigned to a room';
  end if;

  if (select count(*) from public.gym_equipments where facility_id = v_facility_id and room_id is null) <> 4 then
    raise exception 'expected 4 facility-level camera rows without a room';
  end if;
end;
$$;
