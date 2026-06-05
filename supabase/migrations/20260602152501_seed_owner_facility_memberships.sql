create or replace function private.seed_demo_login_user(
  p_email text,
  p_full_name text,
  p_phone text,
  p_app_role text,
  p_seed_password text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_password_hash text;
  v_account_id uuid;
  v_user_id uuid;
begin
  v_password_hash := extensions.crypt(p_seed_password, extensions.gen_salt('bf'));

  insert into public.accounts as target (
    email,
    password_hash,
    status
  ) values (
    lower(trim(p_email)),
    v_password_hash,
    'active'
  )
  on conflict (email) do update
  set
    password_hash = excluded.password_hash,
    status = 'active',
    updated_at = now()
  returning id into v_account_id;

  insert into public.users as target (
    account_id,
    full_name,
    phone,
    role
  ) values (
    v_account_id,
    p_full_name,
    p_phone,
    p_app_role
  )
  on conflict (account_id) do update
  set
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role,
    updated_at = now()
  returning id into v_user_id;

  insert into auth.users as target (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    v_password_hash,
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email'],
      'app_role', p_app_role
    ),
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', lower(trim(p_email)),
      'email_verified', true,
      'phone_verified', false,
      'full_name', p_full_name,
      'role', p_app_role
    ),
    false,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false
  )
  on conflict (id) do update
  set
    instance_id = excluded.instance_id,
    aud = excluded.aud,
    role = excluded.role,
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = coalesce(target.email_confirmed_at, excluded.email_confirmed_at),
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    updated_at = now(),
    is_sso_user = false,
    is_anonymous = false;

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) values (
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', lower(trim(p_email)),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now()
  )
  on conflict (provider_id, provider) do update
  set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();

  return v_user_id;
end;
$$;

create or replace function private.seed_demo_paid_payment(
  p_subscription_id uuid,
  p_paid_at timestamptz,
  p_method text
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_member_id uuid;
  v_status text;
  v_final_price numeric(12, 2);
begin
  select member_id, status, final_price
  into v_member_id, v_status, v_final_price
  from public.membership_subscriptions
  where id = p_subscription_id;

  if v_member_id is null then
    raise exception 'subscription % does not exist', p_subscription_id;
  end if;

  if exists (
    select 1
    from public.membership_payments
    where subscription_id = p_subscription_id
      and status = 'paid'
  ) then
    return;
  end if;

  if v_status <> 'pending_payment' then
    raise exception 'subscription % must be pending_payment before paid seed payment, got %',
      p_subscription_id, v_status;
  end if;

  insert into public.membership_payments (
    subscription_id,
    member_id,
    amount,
    method,
    status,
    paid_at
  ) values (
    p_subscription_id,
    v_member_id,
    v_final_price,
    p_method,
    'paid',
    p_paid_at
  );
end;
$$;

create or replace function private.seed_demo_pt_preference(
  p_subscription_id uuid,
  p_preferred_pt_id uuid,
  p_preferred_pt_gender text,
  p_sessions_per_week integer,
  p_training_goal text,
  p_experience_level text,
  p_notes text,
  p_slots jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_preference_id uuid;
  v_slot record;
begin
  insert into public.membership_pt_preferences as target (
    subscription_id,
    preferred_pt_id,
    preferred_pt_gender,
    sessions_per_week,
    training_goal,
    experience_level,
    notes
  ) values (
    p_subscription_id,
    p_preferred_pt_id,
    p_preferred_pt_gender,
    p_sessions_per_week,
    p_training_goal,
    p_experience_level,
    p_notes
  )
  on conflict (subscription_id) do update
  set
    preferred_pt_id = excluded.preferred_pt_id,
    preferred_pt_gender = excluded.preferred_pt_gender,
    sessions_per_week = excluded.sessions_per_week,
    training_goal = excluded.training_goal,
    experience_level = excluded.experience_level,
    notes = excluded.notes,
    updated_at = now()
  returning id into v_preference_id;

  delete from public.membership_pt_preference_time_slots
  where pt_preference_id = v_preference_id;

  for v_slot in
    select *
    from jsonb_to_recordset(p_slots) as x(
      day_of_week integer,
      start_time text,
      end_time text
    )
  loop
    insert into public.membership_pt_preference_time_slots (
      pt_preference_id,
      day_of_week,
      start_time,
      end_time
    ) values (
      v_preference_id,
      v_slot.day_of_week,
      v_slot.start_time::time,
      v_slot.end_time::time
    );
  end loop;

  return v_preference_id;
end;
$$;

create or replace function private.seed_demo_pt_assignment(
  p_subscription_id uuid,
  p_pt_id uuid,
  p_manager_id uuid,
  p_final_status text,
  p_member_response_note text,
  p_schedule_starts_on date,
  p_schedule_note text,
  p_slots jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_assignment_id uuid;
  v_slot record;
begin
  if p_final_status not in ('accepted', 'rejected') then
    raise exception 'seed assignment final status must be accepted or rejected';
  end if;

  insert into public.membership_pt_assignments (
    subscription_id,
    pt_id,
    assigned_by_manager_id,
    status,
    schedule_starts_on,
    schedule_timezone,
    schedule_note
  ) values (
    p_subscription_id,
    p_pt_id,
    p_manager_id,
    'pending_member_decision',
    p_schedule_starts_on,
    'Asia/Ho_Chi_Minh',
    p_schedule_note
  )
  returning id into v_assignment_id;

  for v_slot in
    select *
    from jsonb_to_recordset(p_slots) as x(
      day_of_week integer,
      start_time text,
      end_time text
    )
  loop
    insert into public.membership_pt_assignment_schedule_slots (
      assignment_id,
      day_of_week,
      start_time,
      end_time
    ) values (
      v_assignment_id,
      v_slot.day_of_week,
      v_slot.start_time::time,
      v_slot.end_time::time
    );
  end loop;

  update public.membership_pt_assignments
  set
    status = p_final_status,
    member_response_note = p_member_response_note,
    member_decided_at = timestamp with time zone '2026-06-02 11:00:00+07'
  where id = v_assignment_id;

  return v_assignment_id;
end;
$$;

do $$
declare
  v_seed_password constant text := '12345678';
  v_facility_id uuid;
  v_manager1_id uuid;
  v_manager2_id uuid;
  v_member_id uuid;
  v_package_id uuid;
  v_subscription_id uuid;
  v_status text;
  v_basic_package_id uuid;
  v_standard_package_id uuid;
  v_plus_package_id uuid;
  v_elite_package_id uuid;
  v_pt20_package_id uuid;
  v_pt40_package_id uuid;
  v_weight_room_id uuid;
  v_cardio_room_id uuid;
  v_yoga_room_id uuid;
  v_pt01_id uuid;
  v_pt02_id uuid;
  v_pt03_id uuid;
  v_pt04_id uuid;
  v_pt05_id uuid;
  v_sub17_id uuid;
  v_sub18_id uuid;
  v_sub19_id uuid;
  v_sub20_id uuid;
  v_n integer;
  v_email text;
  v_name text;
  v_phone text;
  v_staff_role text;
  v_package_name text;
  v_paid_at timestamptz;
  v_package_row record;
begin
  select gf.id
  into v_facility_id
  from public.gym_facilities gf
  where gf.name = 'Jim Fort Gym';

  if v_facility_id is null then
    raise exception 'Jim Fort Gym facility is required before demo seed';
  end if;

  select r.id into v_weight_room_id
  from public.rooms r
  where r.facility_id = v_facility_id
    and r.name = 'Weight Room';

  select r.id into v_cardio_room_id
  from public.rooms r
  where r.facility_id = v_facility_id
    and r.name = 'Cardio Room';

  select r.id into v_yoga_room_id
  from public.rooms r
  where r.facility_id = v_facility_id
    and r.name = 'Yoga Room';

  if v_weight_room_id is null or v_cardio_room_id is null or v_yoga_room_id is null then
    raise exception 'Jim Fort Gym must have Weight Room, Cardio Room, and Yoga Room';
  end if;

  perform private.seed_demo_login_user('owner@gmail.com', 'To Minh Nghia', '0911011011', 'owner', v_seed_password);
  v_manager1_id := private.seed_demo_login_user('manager@gmail.com', 'Huu Minh', '0911011012', 'manager', v_seed_password);
  v_manager2_id := private.seed_demo_login_user('manager02@gmail.com', 'Tran Gia Bao', '0911011022', 'manager', v_seed_password);
  v_pt01_id := private.seed_demo_login_user('pt01@gmail.com', 'Nguyen Van B', '0911011013', 'pt', v_seed_password);

  for v_n in 2..5 loop
    v_email := 'pt' || lpad(v_n::text, 2, '0') || '@gmail.com';
    v_name := 'PT ' || lpad(v_n::text, 2, '0');
    v_phone := '09110110' || (30 + v_n)::text;

    case v_n
      when 2 then v_pt02_id := private.seed_demo_login_user(v_email, v_name, v_phone, 'pt', v_seed_password);
      when 3 then v_pt03_id := private.seed_demo_login_user(v_email, v_name, v_phone, 'pt', v_seed_password);
      when 4 then v_pt04_id := private.seed_demo_login_user(v_email, v_name, v_phone, 'pt', v_seed_password);
      when 5 then v_pt05_id := private.seed_demo_login_user(v_email, v_name, v_phone, 'pt', v_seed_password);
    end case;
  end loop;

  for v_n in 1..20 loop
    if v_n = 1 then
      v_email := 'member@gmail.com';
      v_name := 'Nguyen Van A';
      v_phone := '0987654321';
    else
      v_email := 'member' || lpad(v_n::text, 2, '0') || '@gmail.com';
      v_name := 'Member ' || lpad(v_n::text, 2, '0');
      v_phone := '09876543' || lpad(v_n::text, 2, '0');
    end if;

    perform private.seed_demo_login_user(v_email, v_name, v_phone, 'member', v_seed_password);
  end loop;

  insert into public.facility_managers (facility_id, manager_id) values
    (v_facility_id, v_manager1_id),
    (v_facility_id, v_manager2_id)
  on conflict (facility_id, manager_id) do nothing;

  insert into public.facility_pts (facility_id, pt_id, assigned_by_manager_id) values
    (v_facility_id, v_pt01_id, v_manager1_id),
    (v_facility_id, v_pt02_id, v_manager1_id),
    (v_facility_id, v_pt03_id, v_manager1_id),
    (v_facility_id, v_pt04_id, v_manager1_id),
    (v_facility_id, v_pt05_id, v_manager1_id)
  on conflict (facility_id, pt_id) do update
  set assigned_by_manager_id = excluded.assigned_by_manager_id;

  with numbered_staff as (
    select
      s.id,
      row_number() over (order by s.created_at, s.id) as rn
    from public.staffs s
    where s.facility_id = v_facility_id
  )
  update public.staffs s
  set
    phone = '09129999' || lpad(ns.rn::text, 2, '0'),
    updated_at = now()
  from numbered_staff ns
  where s.id = ns.id
    and ns.rn <= 3;

  with numbered_staff as (
    select
      s.id,
      row_number() over (order by s.created_at, s.id) as rn
    from public.staffs s
    where s.facility_id = v_facility_id
  )
  update public.staffs s
  set
    full_name = 'Staff ' || lpad(ns.rn::text, 2, '0'),
    phone = '09120000' || lpad(ns.rn::text, 2, '0'),
    role = case (ns.rn - 1) % 5
      when 0 then 'front desk'
      when 1 then 'cleaner'
      when 2 then 'security'
      when 3 then 'equipment support'
      else 'customer support'
    end,
    status = 'active',
    hired_at = date '2026-05-27',
    updated_at = now()
  from numbered_staff ns
  where s.id = ns.id
    and ns.rn <= 3;

  for v_n in 1..10 loop
    v_staff_role := case (v_n - 1) % 5
      when 0 then 'front desk'
      when 1 then 'cleaner'
      when 2 then 'security'
      when 3 then 'equipment support'
      else 'customer support'
    end;

    insert into public.staffs (
      facility_id,
      full_name,
      phone,
      role,
      status,
      hired_at,
      note
    )
    select
      v_facility_id,
      'Staff ' || lpad(v_n::text, 2, '0'),
      '09120000' || lpad(v_n::text, 2, '0'),
      v_staff_role,
      'active',
      date '2026-05-30',
      'Demo staff row without login account'
    where not exists (
      select 1
      from public.staffs s
      where s.facility_id = v_facility_id
        and s.full_name = 'Staff ' || lpad(v_n::text, 2, '0')
    );
  end loop;

  for v_package_row in
    select *
    from (values
      ('Basic 1 Month', 'USD package with access to Weight Room only.', 25.00::numeric, false, 30, null::integer),
      ('Standard 3 Months', 'USD package with access to Weight Room and Cardio Room.', 65.00::numeric, false, 90, null::integer),
      ('Plus 6 Months', 'USD package with access to all rooms.', 110.00::numeric, false, 180, null::integer),
      ('Elite 1 Year', 'USD yearly package with access to all rooms.', 199.00::numeric, false, 365, null::integer),
      ('PT 20 Sessions', 'USD PT package with 20 training sessions.', 300.00::numeric, true, null::integer, 20),
      ('PT 40 Sessions', 'USD PT package with 40 training sessions.', 560.00::numeric, true, null::integer, 40)
    ) as seed(name, description, price, has_pt, duration_days, session_count)
  loop
    insert into public.membership_packages (
      facility_id,
      name,
      description,
      price,
      has_pt,
      duration_days,
      session_count,
      status
    ) values (
      v_facility_id,
      v_package_row.name,
      v_package_row.description,
      v_package_row.price,
      v_package_row.has_pt,
      v_package_row.duration_days,
      v_package_row.session_count,
      'active'
    )
    on conflict (facility_id, name) do update
    set
      description = excluded.description,
      price = excluded.price,
      has_pt = excluded.has_pt,
      duration_days = excluded.duration_days,
      session_count = excluded.session_count,
      status = 'active',
      updated_at = now();
  end loop;

  select id into v_basic_package_id from public.membership_packages where facility_id = v_facility_id and name = 'Basic 1 Month';
  select id into v_standard_package_id from public.membership_packages where facility_id = v_facility_id and name = 'Standard 3 Months';
  select id into v_plus_package_id from public.membership_packages where facility_id = v_facility_id and name = 'Plus 6 Months';
  select id into v_elite_package_id from public.membership_packages where facility_id = v_facility_id and name = 'Elite 1 Year';
  select id into v_pt20_package_id from public.membership_packages where facility_id = v_facility_id and name = 'PT 20 Sessions';
  select id into v_pt40_package_id from public.membership_packages where facility_id = v_facility_id and name = 'PT 40 Sessions';

  delete from public.membership_package_rooms
  where package_id in (
    v_basic_package_id,
    v_standard_package_id,
    v_plus_package_id,
    v_elite_package_id,
    v_pt20_package_id,
    v_pt40_package_id
  );

  insert into public.membership_package_rooms (package_id, room_id) values
    (v_basic_package_id, v_weight_room_id),
    (v_standard_package_id, v_weight_room_id),
    (v_standard_package_id, v_cardio_room_id),
    (v_plus_package_id, v_weight_room_id),
    (v_plus_package_id, v_cardio_room_id),
    (v_plus_package_id, v_yoga_room_id),
    (v_elite_package_id, v_weight_room_id),
    (v_elite_package_id, v_cardio_room_id),
    (v_elite_package_id, v_yoga_room_id),
    (v_pt20_package_id, v_weight_room_id),
    (v_pt20_package_id, v_cardio_room_id),
    (v_pt20_package_id, v_yoga_room_id),
    (v_pt40_package_id, v_weight_room_id),
    (v_pt40_package_id, v_cardio_room_id),
    (v_pt40_package_id, v_yoga_room_id);

  for v_n in 1..20 loop
    if v_n = 1 then
      v_email := 'member@gmail.com';
    else
      v_email := 'member' || lpad(v_n::text, 2, '0') || '@gmail.com';
    end if;

    v_package_name := case
      when v_n between 1 and 4 then 'Basic 1 Month'
      when v_n between 5 and 8 then 'Standard 3 Months'
      when v_n between 9 and 12 then 'Plus 6 Months'
      when v_n between 13 and 16 then 'Elite 1 Year'
      when v_n between 17 and 18 then 'PT 20 Sessions'
      else 'PT 40 Sessions'
    end;

    v_paid_at := timestamp with time zone '2026-06-02 09:00:00+07'
      + make_interval(mins => v_n * 5);

    select u.id
    into v_member_id
    from public.users u
    join public.accounts a on a.id = u.account_id
    where a.email = v_email
      and u.role = 'member';

    select mp.id
    into v_package_id
    from public.membership_packages mp
    where mp.facility_id = v_facility_id
      and mp.name = v_package_name;

    select ms.id
    into v_subscription_id
    from public.membership_subscriptions ms
    where ms.member_id = v_member_id
      and ms.package_id = v_package_id
    limit 1;

    if v_subscription_id is null then
      insert into public.membership_subscriptions (
        member_id,
        facility_id,
        package_id
      ) values (
        v_member_id,
        v_facility_id,
        v_package_id
      )
      returning id into v_subscription_id;
    end if;

    select status into v_status
    from public.membership_subscriptions
    where id = v_subscription_id;

    if v_package_name not in ('PT 20 Sessions', 'PT 40 Sessions') then
      perform private.seed_demo_paid_payment(v_subscription_id, v_paid_at, 'card');
    elsif v_status <> 'pending_pt_setup'
      and not exists (
        select 1
        from public.membership_pt_assignments
        where subscription_id = v_subscription_id
      )
    then
      raise exception 'PT subscription % must be pending_pt_setup before PT assignment seed',
        v_subscription_id;
    end if;
  end loop;

  select ms.id into v_sub17_id from public.membership_subscriptions ms join public.users u on u.id = ms.member_id join public.accounts a on a.id = u.account_id where a.email = 'member17@gmail.com';
  select ms.id into v_sub18_id from public.membership_subscriptions ms join public.users u on u.id = ms.member_id join public.accounts a on a.id = u.account_id where a.email = 'member18@gmail.com';
  select ms.id into v_sub19_id from public.membership_subscriptions ms join public.users u on u.id = ms.member_id join public.accounts a on a.id = u.account_id where a.email = 'member19@gmail.com';
  select ms.id into v_sub20_id from public.membership_subscriptions ms join public.users u on u.id = ms.member_id join public.accounts a on a.id = u.account_id where a.email = 'member20@gmail.com';

  perform private.seed_demo_pt_preference(
    v_sub17_id,
    v_pt02_id,
    'male',
    3,
    'Build strength and improve posture',
    'beginner',
    'Prefers morning sessions before class.',
    '[{"day_of_week":1,"start_time":"07:30","end_time":"08:30"},{"day_of_week":3,"start_time":"07:30","end_time":"08:30"},{"day_of_week":5,"start_time":"07:30","end_time":"08:30"}]'::jsonb
  );

  perform private.seed_demo_pt_preference(
    v_sub18_id,
    v_pt04_id,
    'no_preference',
    2,
    'Lose fat and improve cardio endurance',
    'intermediate',
    'Prefers evening sessions after work.',
    '[{"day_of_week":2,"start_time":"18:00","end_time":"19:00"},{"day_of_week":4,"start_time":"18:00","end_time":"19:00"}]'::jsonb
  );

  perform private.seed_demo_pt_preference(
    v_sub19_id,
    v_pt01_id,
    'male',
    3,
    'Strength training with stable weekly routine',
    'intermediate',
    'Wants three sessions per week after office hours.',
    '[{"day_of_week":1,"start_time":"18:00","end_time":"21:00"},{"day_of_week":3,"start_time":"19:00","end_time":"20:00"},{"day_of_week":5,"start_time":"20:00","end_time":"21:00"}]'::jsonb
  );

  perform private.seed_demo_pt_preference(
    v_sub20_id,
    v_pt05_id,
    'no_preference',
    3,
    'Full body conditioning and mobility',
    'advanced',
    'Can train on weekdays and weekends.',
    '[{"day_of_week":2,"start_time":"08:30","end_time":"09:30"},{"day_of_week":4,"start_time":"08:30","end_time":"09:30"},{"day_of_week":6,"start_time":"08:30","end_time":"09:30"}]'::jsonb
  );

  perform private.seed_demo_pt_assignment(
    v_sub17_id,
    v_pt01_id,
    v_manager1_id,
    'rejected',
    'I prefer a later morning slot.',
    date '2026-06-08',
    'Initial manager proposal.',
    '[{"day_of_week":1,"start_time":"06:00","end_time":"07:00"},{"day_of_week":3,"start_time":"06:00","end_time":"07:00"}]'::jsonb
  );

  perform private.seed_demo_pt_assignment(
    v_sub17_id,
    v_pt02_id,
    v_manager1_id,
    'accepted',
    'Accepted.',
    date '2026-06-08',
    'Accepted morning schedule.',
    '[{"day_of_week":1,"start_time":"07:30","end_time":"08:30"},{"day_of_week":3,"start_time":"07:30","end_time":"08:30"},{"day_of_week":5,"start_time":"07:30","end_time":"08:30"}]'::jsonb
  );

  perform private.seed_demo_paid_payment(v_sub17_id, timestamp with time zone '2026-06-02 10:10:00+07', 'card');

  perform private.seed_demo_pt_assignment(
    v_sub18_id,
    v_pt03_id,
    v_manager2_id,
    'rejected',
    'The proposed time is too late.',
    date '2026-06-08',
    'Initial evening proposal.',
    '[{"day_of_week":2,"start_time":"20:00","end_time":"21:00"},{"day_of_week":4,"start_time":"20:00","end_time":"21:00"}]'::jsonb
  );

  perform private.seed_demo_pt_assignment(
    v_sub18_id,
    v_pt04_id,
    v_manager2_id,
    'accepted',
    'Accepted.',
    date '2026-06-08',
    'Accepted evening schedule.',
    '[{"day_of_week":2,"start_time":"18:00","end_time":"19:00"},{"day_of_week":4,"start_time":"18:00","end_time":"19:00"}]'::jsonb
  );

  perform private.seed_demo_paid_payment(v_sub18_id, timestamp with time zone '2026-06-02 10:35:00+07', 'card');

  perform private.seed_demo_pt_assignment(
    v_sub19_id,
    v_pt05_id,
    v_manager1_id,
    'rejected',
    'Weekend schedule does not fit.',
    date '2026-06-08',
    'Weekend-heavy first proposal.',
    '[{"day_of_week":0,"start_time":"08:00","end_time":"09:00"},{"day_of_week":6,"start_time":"08:00","end_time":"09:00"}]'::jsonb
  );

  perform private.seed_demo_pt_assignment(
    v_sub19_id,
    v_pt01_id,
    v_manager1_id,
    'accepted',
    'Accepted.',
    date '2026-06-08',
    'Accepted evening strength schedule.',
    '[{"day_of_week":1,"start_time":"18:00","end_time":"19:00"},{"day_of_week":3,"start_time":"18:00","end_time":"19:00"},{"day_of_week":5,"start_time":"18:00","end_time":"19:00"}]'::jsonb
  );

  perform private.seed_demo_paid_payment(v_sub19_id, timestamp with time zone '2026-06-02 10:40:00+07', 'card');

  perform private.seed_demo_pt_assignment(
    v_sub20_id,
    v_pt05_id,
    v_manager2_id,
    'accepted',
    'Accepted.',
    date '2026-06-08',
    'Accepted full body schedule.',
    '[{"day_of_week":2,"start_time":"08:30","end_time":"09:30"},{"day_of_week":4,"start_time":"08:30","end_time":"09:30"},{"day_of_week":6,"start_time":"08:30","end_time":"09:30"}]'::jsonb
  );

  perform private.seed_demo_paid_payment(v_sub20_id, timestamp with time zone '2026-06-02 10:45:00+07', 'card');
end;
$$;

do $$
declare
  v_basic_package_id uuid;
  v_weight_room_id uuid;
begin
  select mp.id
  into v_basic_package_id
  from public.membership_packages mp
  where mp.name = 'Basic 1 Month';

  select r.id
  into v_weight_room_id
  from public.rooms r
  where r.name = 'Weight Room';

  if (select count(*) from public.accounts) <> 28 then
    raise exception 'expected 28 login accounts';
  end if;

  if (select count(*) from public.users where role = 'owner') <> 1 then
    raise exception 'expected 1 owner user';
  end if;

  if (select count(*) from public.users where role = 'manager') <> 2 then
    raise exception 'expected 2 manager users';
  end if;

  if (select count(*) from public.users where role = 'pt') <> 5 then
    raise exception 'expected 5 PT users';
  end if;

  if (select count(*) from public.users where role = 'member') <> 20 then
    raise exception 'expected 20 member users';
  end if;

  if (select count(*) from auth.users) <> 28 then
    raise exception 'expected 28 auth users';
  end if;

  if (select count(*) from auth.identities where provider = 'email') <> 28 then
    raise exception 'expected 28 email identities';
  end if;

  if exists (select 1 from public.accounts where email not like '%@gmail.com') then
    raise exception 'all demo login emails must use gmail.com';
  end if;

  if (select count(*) from public.gym_facilities) <> 1 then
    raise exception 'expected 1 gym facility';
  end if;

  if (select count(*) from public.rooms) <> 3 then
    raise exception 'expected 3 rooms';
  end if;

  if (select count(*) from public.facility_managers) <> 2 then
    raise exception 'expected 2 facility managers';
  end if;

  if (select count(*) from public.facility_pts) <> 5 then
    raise exception 'expected 5 facility PT mappings';
  end if;

  if (select count(*) from public.staffs) <> 10 then
    raise exception 'expected 10 staff rows';
  end if;

  if (select count(*) from public.membership_packages) <> 6 then
    raise exception 'expected 6 membership packages';
  end if;

  if (select count(*) from public.membership_package_rooms) <> 15 then
    raise exception 'expected 15 package-room rows';
  end if;

  if (select count(*) from public.membership_package_rooms where package_id = v_basic_package_id) <> 1
    or not exists (
      select 1
      from public.membership_package_rooms
      where package_id = v_basic_package_id
        and room_id = v_weight_room_id
    )
  then
    raise exception 'Basic 1 Month must access only Weight Room';
  end if;

  if (select count(*) from public.membership_subscriptions) <> 20 then
    raise exception 'expected 20 subscriptions';
  end if;

  if (select count(*) from public.membership_subscriptions where status = 'active') <> 20 then
    raise exception 'expected 20 active subscriptions';
  end if;

  if (select count(*) from public.membership_subscriptions where has_pt_snapshot) <> 4 then
    raise exception 'expected 4 PT subscriptions';
  end if;

  if (select count(*) from public.membership_payments where status = 'paid') <> 20 then
    raise exception 'expected 20 paid payments';
  end if;

  if (select count(*) from public.membership_pt_preferences) <> 4 then
    raise exception 'expected 4 PT preferences';
  end if;

  if (select count(*) from public.membership_pt_preference_time_slots) <> 11 then
    raise exception 'expected 11 PT preference time slots';
  end if;

  if (select count(*) from public.membership_pt_assignments where status = 'rejected') <> 3 then
    raise exception 'expected 3 rejected PT assignment proposals';
  end if;

  if (select count(*) from public.membership_pt_assignments where status = 'accepted') <> 4 then
    raise exception 'expected 4 accepted PT assignment proposals';
  end if;

  if (select count(*) from public.membership_pt_assignment_schedule_slots) <> 17 then
    raise exception 'expected 17 manager assignment schedule slots';
  end if;

  if (select count(*) from public.membership_pt_sessions) <> 120 then
    raise exception 'expected 120 generated PT sessions';
  end if;

  if exists (
    select 1
    from public.membership_pt_sessions s
    join public.membership_pt_assignments a on a.id = s.assignment_id
    join public.membership_subscriptions ms on ms.id = s.subscription_id
    where a.status <> 'accepted'
      or a.subscription_id <> s.subscription_id
      or ms.member_id <> s.member_id
      or a.pt_id <> s.pt_id
  ) then
    raise exception 'PT sessions must link to accepted assignment, subscription member, and assignment PT';
  end if;

  if (select count(*) from public.vouchers) <> 0 then
    raise exception 'expected no vouchers';
  end if;
end;
$$;

drop function private.seed_demo_pt_assignment(uuid, uuid, uuid, text, text, date, text, jsonb);
drop function private.seed_demo_pt_preference(uuid, uuid, text, integer, text, text, text, jsonb);
drop function private.seed_demo_paid_payment(uuid, timestamptz, text);
drop function private.seed_demo_login_user(text, text, text, text, text);
