create schema if not exists private;

create or replace function private.seed_status_demo_login_user(
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
  set password_hash = excluded.password_hash,
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
  set full_name = excluded.full_name,
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
  set instance_id = excluded.instance_id,
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
  set user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      updated_at = now();

  return v_user_id;
end;
$$;

create or replace function private.seed_status_demo_paid_payment(
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

do $$
declare
  v_facility_id uuid;
  v_weight_room_id uuid;
  v_cardio_room_id uuid;
  v_yoga_room_id uuid;
  v_manager_id uuid;
  v_pt_1_id uuid;
  v_pt_2_id uuid;
  v_basic_package_id uuid;
  v_standard_package_id uuid;
  v_pt20_package_id uuid;
  v_inactive_package_id uuid;
  v_archived_package_id uuid;
  v_pending_member_id uuid;
  v_cancelled_member_id uuid;
  v_expired_member_id uuid;
  v_voucher_member_id uuid;
  v_pt_pending_member_id uuid;
  v_pt_cancelled_member_id uuid;
  v_disabled_member_id uuid;
  v_locked_member_id uuid;
  v_pending_subscription_id uuid;
  v_cancelled_subscription_id uuid;
  v_expired_subscription_id uuid;
  v_voucher_subscription_id uuid;
  v_pt_pending_subscription_id uuid;
  v_pt_cancelled_subscription_id uuid;
  v_pending_assignment_id uuid;
  v_cancelled_assignment_id uuid;
  v_cancelled_assignment_status text;
  v_preference_id uuid;
  v_welcome_voucher_id uuid;
  v_active_subscription_id uuid;
  v_active_subscription_member_id uuid;
begin
  select id
  into v_facility_id
  from public.gym_facilities
  where name = 'Jim Fort Gym'
  order by created_at
  limit 1;

  if v_facility_id is null then
    raise exception 'Jim Fort Gym facility must exist before seeding status variants';
  end if;

  select id into v_weight_room_id
  from public.rooms
  where facility_id = v_facility_id
    and name = 'Weight Room'
  limit 1;

  select id into v_cardio_room_id
  from public.rooms
  where facility_id = v_facility_id
    and name = 'Cardio Room'
  limit 1;

  select id into v_yoga_room_id
  from public.rooms
  where facility_id = v_facility_id
    and name = 'Yoga Room'
  limit 1;

  if v_weight_room_id is null or v_cardio_room_id is null or v_yoga_room_id is null then
    raise exception 'Weight Room, Cardio Room, and Yoga Room must exist before seeding status variants';
  end if;

  select u.id into v_manager_id
  from public.users u
  join public.accounts a on a.id = u.account_id
  where a.email = 'manager@gmail.com'
    and u.role = 'manager'
  limit 1;

  select u.id into v_pt_1_id
  from public.users u
  join public.accounts a on a.id = u.account_id
  where a.email = 'pt01@gmail.com'
    and u.role = 'pt'
  limit 1;

  select u.id into v_pt_2_id
  from public.users u
  join public.accounts a on a.id = u.account_id
  where a.email = 'pt02@gmail.com'
    and u.role = 'pt'
  limit 1;

  if v_manager_id is null or v_pt_1_id is null or v_pt_2_id is null then
    raise exception 'Seed manager and PT users must exist before seeding status variants';
  end if;

  select id into v_basic_package_id
  from public.membership_packages
  where facility_id = v_facility_id
    and name = 'Basic 1 Month'
  limit 1;

  select id into v_standard_package_id
  from public.membership_packages
  where facility_id = v_facility_id
    and name = 'Standard 3 Months'
  limit 1;

  select id into v_pt20_package_id
  from public.membership_packages
  where facility_id = v_facility_id
    and name = 'PT 20 Sessions'
  limit 1;

  if v_basic_package_id is null
    or v_standard_package_id is null
    or v_pt20_package_id is null
  then
    raise exception 'Core membership packages must exist before seeding status variants';
  end if;

  v_disabled_member_id := private.seed_status_demo_login_user(
    'status.disabled.member@gmail.com',
    'Status Disabled Member',
    '0923000001',
    'member',
    '12345678'
  );

  v_locked_member_id := private.seed_status_demo_login_user(
    'status.locked.member@gmail.com',
    'Status Locked Member',
    '0923000002',
    'member',
    '12345678'
  );

  v_pending_member_id := private.seed_status_demo_login_user(
    'status.pending.member@gmail.com',
    'Status Pending Payment Member',
    '0923000003',
    'member',
    '12345678'
  );

  v_cancelled_member_id := private.seed_status_demo_login_user(
    'status.cancelled.member@gmail.com',
    'Status Cancelled Member',
    '0923000004',
    'member',
    '12345678'
  );

  v_expired_member_id := private.seed_status_demo_login_user(
    'status.expired.member@gmail.com',
    'Status Expired Member',
    '0923000005',
    'member',
    '12345678'
  );

  v_voucher_member_id := private.seed_status_demo_login_user(
    'status.voucher.member@gmail.com',
    'Status Voucher Member',
    '0923000006',
    'member',
    '12345678'
  );

  v_pt_pending_member_id := private.seed_status_demo_login_user(
    'status.pt.pending.member@gmail.com',
    'Status PT Pending Member',
    '0923000007',
    'member',
    '12345678'
  );

  v_pt_cancelled_member_id := private.seed_status_demo_login_user(
    'status.pt.cancelled.member@gmail.com',
    'Status PT Cancelled Member',
    '0923000008',
    'member',
    '12345678'
  );

  update public.accounts
  set status = 'disabled',
      updated_at = now()
  where id = (
    select account_id
    from public.users
    where id = v_disabled_member_id
  );

  update public.accounts
  set status = 'locked',
      updated_at = now()
  where id = (
    select account_id
    from public.users
    where id = v_locked_member_id
  );

  update public.rooms
  set status = case name
      when 'Weight Room' then 'active'
      when 'Cardio Room' then 'maintenance'
      when 'Yoga Room' then 'closed'
      else status
    end,
    updated_at = now()
  where facility_id = v_facility_id
    and name in ('Weight Room', 'Cardio Room', 'Yoga Room');

  update public.staffs
  set status = case full_name
      when 'Staff 01' then 'active'
      when 'Staff 02' then 'active'
      when 'Staff 03' then 'active'
      when 'Staff 04' then 'active'
      when 'Staff 05' then 'inactive'
      when 'Staff 06' then 'inactive'
      when 'Staff 07' then 'on_leave'
      when 'Staff 08' then 'on_leave'
      when 'Staff 09' then 'terminated'
      when 'Staff 10' then 'terminated'
      else status
    end,
    note = case full_name
      when 'Staff 05' then 'Demo status seed: inactive staff record.'
      when 'Staff 06' then 'Demo status seed: inactive staff record.'
      when 'Staff 07' then 'Demo status seed: on leave this month.'
      when 'Staff 08' then 'Demo status seed: on leave this month.'
      when 'Staff 09' then 'Demo status seed: terminated historical record.'
      when 'Staff 10' then 'Demo status seed: terminated historical record.'
      else note
    end,
    updated_at = now()
  where facility_id = v_facility_id
    and full_name in (
      'Staff 01',
      'Staff 02',
      'Staff 03',
      'Staff 04',
      'Staff 05',
      'Staff 06',
      'Staff 07',
      'Staff 08',
      'Staff 09',
      'Staff 10'
    );

  insert into public.membership_packages as target (
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
    'Trial Inactive Package',
    'Demo package for testing inactive package visibility.',
    10.00,
    false,
    14,
    null,
    'inactive'
  )
  on conflict (facility_id, name) do update
  set description = excluded.description,
      price = excluded.price,
      has_pt = excluded.has_pt,
      duration_days = excluded.duration_days,
      session_count = excluded.session_count,
      status = excluded.status,
      updated_at = now()
  returning id into v_inactive_package_id;

  insert into public.membership_packages as target (
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
    'Legacy Archived Package',
    'Demo package for testing archived package history.',
    15.00,
    false,
    30,
    null,
    'archived'
  )
  on conflict (facility_id, name) do update
  set description = excluded.description,
      price = excluded.price,
      has_pt = excluded.has_pt,
      duration_days = excluded.duration_days,
      session_count = excluded.session_count,
      status = excluded.status,
      updated_at = now()
  returning id into v_archived_package_id;

  insert into public.membership_package_rooms (package_id, room_id)
  values
    (v_inactive_package_id, v_weight_room_id),
    (v_archived_package_id, v_weight_room_id)
  on conflict do nothing;

  select id into v_pending_subscription_id
  from public.membership_subscriptions
  where member_id = v_pending_member_id
    and package_id = v_basic_package_id
  order by created_at
  limit 1;

  if v_pending_subscription_id is null then
    insert into public.membership_subscriptions (
      member_id,
      facility_id,
      package_id
    ) values (
      v_pending_member_id,
      v_facility_id,
      v_basic_package_id
    )
    returning id into v_pending_subscription_id;
  end if;

  update public.membership_subscriptions
  set status = 'pending_payment',
      discount_amount = 0,
      activated_at = null,
      starts_at = null,
      expires_at = null,
      cancelled_at = null,
      cancelled_reason = null,
      updated_at = now()
  where id = v_pending_subscription_id;

  insert into public.membership_payments (
    subscription_id,
    member_id,
    amount,
    method,
    status
  )
  select id, member_id, final_price, 'card', 'pending'
  from public.membership_subscriptions
  where id = v_pending_subscription_id
    and not exists (
      select 1
      from public.membership_payments
      where subscription_id = v_pending_subscription_id
        and status = 'pending'
    );

  insert into public.membership_payments (
    subscription_id,
    member_id,
    amount,
    method,
    status
  )
  select id, member_id, final_price, 'card', 'failed'
  from public.membership_subscriptions
  where id = v_pending_subscription_id
    and not exists (
      select 1
      from public.membership_payments
      where subscription_id = v_pending_subscription_id
        and status = 'failed'
    );

  select id into v_cancelled_subscription_id
  from public.membership_subscriptions
  where member_id = v_cancelled_member_id
    and package_id = v_basic_package_id
  order by created_at
  limit 1;

  if v_cancelled_subscription_id is null then
    insert into public.membership_subscriptions (
      member_id,
      facility_id,
      package_id
    ) values (
      v_cancelled_member_id,
      v_facility_id,
      v_basic_package_id
    )
    returning id into v_cancelled_subscription_id;
  end if;

  update public.membership_subscriptions
  set status = 'cancelled',
      discount_amount = 0,
      activated_at = null,
      starts_at = null,
      expires_at = null,
      cancelled_at = timestamptz '2026-05-20 10:00:00+07',
      cancelled_reason = 'Demo status seed: member cancelled before payment.',
      updated_at = now()
  where id = v_cancelled_subscription_id;

  insert into public.membership_payments (
    subscription_id,
    member_id,
    amount,
    method,
    status
  )
  select id, member_id, final_price, 'bank_transfer', 'cancelled'
  from public.membership_subscriptions
  where id = v_cancelled_subscription_id
    and not exists (
      select 1
      from public.membership_payments
      where subscription_id = v_cancelled_subscription_id
        and status = 'cancelled'
    );

  select id into v_expired_subscription_id
  from public.membership_subscriptions
  where member_id = v_expired_member_id
    and package_id = v_basic_package_id
  order by created_at
  limit 1;

  if v_expired_subscription_id is null then
    insert into public.membership_subscriptions (
      member_id,
      facility_id,
      package_id
    ) values (
      v_expired_member_id,
      v_facility_id,
      v_basic_package_id
    )
    returning id into v_expired_subscription_id;
  end if;

  if not exists (
    select 1
    from public.membership_payments
    where subscription_id = v_expired_subscription_id
      and status = 'paid'
  ) then
    update public.membership_subscriptions
    set status = 'pending_payment',
        discount_amount = 0,
        cancelled_at = null,
        cancelled_reason = null,
        updated_at = now()
    where id = v_expired_subscription_id;

    perform private.seed_status_demo_paid_payment(
      v_expired_subscription_id,
      timestamptz '2025-01-01 09:00:00+07',
      'cash'
    );
  end if;

  update public.membership_subscriptions
  set status = 'expired',
      activated_at = timestamptz '2025-01-01 09:00:00+07',
      starts_at = timestamptz '2025-01-01 09:00:00+07',
      expires_at = timestamptz '2025-01-31 09:00:00+07',
      cancelled_at = null,
      cancelled_reason = null,
      updated_at = now()
  where id = v_expired_subscription_id;

  select id into v_voucher_subscription_id
  from public.membership_subscriptions
  where member_id = v_voucher_member_id
    and package_id = v_standard_package_id
  order by created_at
  limit 1;

  if v_voucher_subscription_id is null then
    insert into public.membership_subscriptions (
      member_id,
      facility_id,
      package_id
    ) values (
      v_voucher_member_id,
      v_facility_id,
      v_standard_package_id
    )
    returning id into v_voucher_subscription_id;
  end if;

  if not exists (
    select 1
    from public.voucher_redemptions
    where subscription_id = v_voucher_subscription_id
  ) then
    update public.membership_subscriptions
    set status = 'pending_payment',
        discount_amount = 0,
        activated_at = null,
        starts_at = null,
        expires_at = null,
        cancelled_at = null,
        cancelled_reason = null,
        updated_at = now()
    where id = v_voucher_subscription_id;
  end if;

  insert into public.vouchers as target (
    facility_id,
    code,
    discount_type,
    percentage,
    amount,
    status,
    starts_at,
    expires_at
  ) values
    (
      v_facility_id,
      'WELCOME10',
      'percentage',
      10.00,
      null,
      'active',
      timestamptz '2026-01-01 00:00:00+07',
      timestamptz '2030-01-01 00:00:00+07'
    ),
    (
      v_facility_id,
      'FIVEUSD',
      'amount',
      null,
      5.00,
      'active',
      timestamptz '2026-01-01 00:00:00+07',
      timestamptz '2030-01-01 00:00:00+07'
    ),
    (
      v_facility_id,
      'PAUSED20',
      'percentage',
      20.00,
      null,
      'disabled',
      timestamptz '2026-01-01 00:00:00+07',
      timestamptz '2030-01-01 00:00:00+07'
    ),
    (
      v_facility_id,
      'OLD50',
      'percentage',
      50.00,
      null,
      'expired',
      timestamptz '2025-01-01 00:00:00+07',
      timestamptz '2025-12-31 23:59:59+07'
    )
  on conflict (code) do update
  set facility_id = excluded.facility_id,
      discount_type = excluded.discount_type,
      percentage = excluded.percentage,
      amount = excluded.amount,
      status = excluded.status,
      starts_at = excluded.starts_at,
      expires_at = excluded.expires_at,
      updated_at = now();

  select id into v_welcome_voucher_id
  from public.vouchers
  where code = 'WELCOME10';

  insert into public.voucher_redemptions (
    voucher_id,
    member_id,
    subscription_id
  )
  select v_welcome_voucher_id, v_voucher_member_id, v_voucher_subscription_id
  where not exists (
      select 1
      from public.voucher_redemptions
      where voucher_id = v_welcome_voucher_id
         or subscription_id = v_voucher_subscription_id
    );

  select id into v_pt_pending_subscription_id
  from public.membership_subscriptions
  where member_id = v_pt_pending_member_id
    and package_id = v_pt20_package_id
  order by created_at
  limit 1;

  if v_pt_pending_subscription_id is null then
    insert into public.membership_subscriptions (
      member_id,
      facility_id,
      package_id
    ) values (
      v_pt_pending_member_id,
      v_facility_id,
      v_pt20_package_id
    )
    returning id into v_pt_pending_subscription_id;
  end if;

  update public.membership_subscriptions
  set status = 'pending_pt_setup',
      discount_amount = 0,
      activated_at = null,
      starts_at = null,
      expires_at = null,
      cancelled_at = null,
      cancelled_reason = null,
      updated_at = now()
  where id = v_pt_pending_subscription_id;

  insert into public.membership_pt_preferences as target (
    subscription_id,
    preferred_pt_id,
    preferred_pt_gender,
    sessions_per_week,
    training_goal,
    experience_level,
    notes
  ) values (
    v_pt_pending_subscription_id,
    v_pt_1_id,
    'male',
    3,
    'Build strength and improve posture.',
    'beginner',
    'Demo status seed: prefers weekday evening PT sessions.'
  )
  on conflict (subscription_id) do update
  set preferred_pt_id = excluded.preferred_pt_id,
      preferred_pt_gender = excluded.preferred_pt_gender,
      sessions_per_week = excluded.sessions_per_week,
      training_goal = excluded.training_goal,
      experience_level = excluded.experience_level,
      notes = excluded.notes,
      updated_at = now()
  returning id into v_preference_id;

  insert into public.membership_pt_preference_time_slots (
    pt_preference_id,
    day_of_week,
    start_time,
    end_time
  ) values
    (v_preference_id, 1, time '18:00', time '19:00'),
    (v_preference_id, 3, time '18:00', time '19:00'),
    (v_preference_id, 5, time '18:00', time '19:00')
  on conflict do nothing;

  select id into v_pending_assignment_id
  from public.membership_pt_assignments
  where subscription_id = v_pt_pending_subscription_id
    and status = 'pending_member_decision'
  order by created_at
  limit 1;

  if v_pending_assignment_id is null then
    insert into public.membership_pt_assignments (
      subscription_id,
      pt_id,
      assigned_by_manager_id,
      status,
      schedule_starts_on,
      schedule_timezone,
      schedule_note
    ) values (
      v_pt_pending_subscription_id,
      v_pt_1_id,
      v_manager_id,
      'pending_member_decision',
      date '2026-06-08',
      'Asia/Ho_Chi_Minh',
      'Demo pending proposal: Monday, Wednesday, and Friday evenings.'
    )
    returning id into v_pending_assignment_id;
  else
    update public.membership_pt_assignments
    set pt_id = v_pt_1_id,
        assigned_by_manager_id = v_manager_id,
        schedule_starts_on = date '2026-06-08',
        schedule_timezone = 'Asia/Ho_Chi_Minh',
        schedule_note = 'Demo pending proposal: Monday, Wednesday, and Friday evenings.',
        updated_at = now()
    where id = v_pending_assignment_id;
  end if;

  insert into public.membership_pt_assignment_schedule_slots (
    assignment_id,
    day_of_week,
    start_time,
    end_time
  ) values
    (v_pending_assignment_id, 1, time '18:00', time '19:00'),
    (v_pending_assignment_id, 3, time '18:00', time '19:00'),
    (v_pending_assignment_id, 5, time '18:00', time '19:00')
  on conflict do nothing;

  select id into v_pt_cancelled_subscription_id
  from public.membership_subscriptions
  where member_id = v_pt_cancelled_member_id
    and package_id = v_pt20_package_id
  order by created_at
  limit 1;

  if v_pt_cancelled_subscription_id is null then
    insert into public.membership_subscriptions (
      member_id,
      facility_id,
      package_id
    ) values (
      v_pt_cancelled_member_id,
      v_facility_id,
      v_pt20_package_id
    )
    returning id into v_pt_cancelled_subscription_id;
  end if;

  update public.membership_subscriptions
  set status = 'pending_pt_setup',
      discount_amount = 0,
      activated_at = null,
      starts_at = null,
      expires_at = null,
      cancelled_at = null,
      cancelled_reason = null,
      updated_at = now()
  where id = v_pt_cancelled_subscription_id;

  insert into public.membership_pt_preferences as target (
    subscription_id,
    preferred_pt_id,
    preferred_pt_gender,
    sessions_per_week,
    training_goal,
    experience_level,
    notes
  ) values (
    v_pt_cancelled_subscription_id,
    v_pt_2_id,
    'no_preference',
    2,
    'Lose fat and improve general fitness.',
    'intermediate',
    'Demo status seed: flexible weekend schedule.'
  )
  on conflict (subscription_id) do update
  set preferred_pt_id = excluded.preferred_pt_id,
      preferred_pt_gender = excluded.preferred_pt_gender,
      sessions_per_week = excluded.sessions_per_week,
      training_goal = excluded.training_goal,
      experience_level = excluded.experience_level,
      notes = excluded.notes,
      updated_at = now()
  returning id into v_preference_id;

  insert into public.membership_pt_preference_time_slots (
    pt_preference_id,
    day_of_week,
    start_time,
    end_time
  ) values
    (v_preference_id, 0, time '09:00', time '10:00'),
    (v_preference_id, 6, time '09:00', time '10:00')
  on conflict do nothing;

  select id, status
  into v_cancelled_assignment_id, v_cancelled_assignment_status
  from public.membership_pt_assignments
  where subscription_id = v_pt_cancelled_subscription_id
    and status in ('pending_member_decision', 'cancelled')
  order by case status when 'pending_member_decision' then 0 else 1 end, created_at
  limit 1;

  if v_cancelled_assignment_id is null then
    insert into public.membership_pt_assignments (
      subscription_id,
      pt_id,
      assigned_by_manager_id,
      status,
      schedule_starts_on,
      schedule_timezone,
      schedule_note
    ) values (
      v_pt_cancelled_subscription_id,
      v_pt_2_id,
      v_manager_id,
      'pending_member_decision',
      date '2026-06-07',
      'Asia/Ho_Chi_Minh',
      'Demo cancelled proposal: weekend morning schedule.'
    )
    returning id into v_cancelled_assignment_id;

    v_cancelled_assignment_status := 'pending_member_decision';
  end if;

  if v_cancelled_assignment_status = 'pending_member_decision' then
    update public.membership_pt_assignments
    set pt_id = v_pt_2_id,
        assigned_by_manager_id = v_manager_id,
        schedule_starts_on = date '2026-06-07',
        schedule_timezone = 'Asia/Ho_Chi_Minh',
        schedule_note = 'Demo cancelled proposal: weekend morning schedule.',
        updated_at = now()
    where id = v_cancelled_assignment_id;

    insert into public.membership_pt_assignment_schedule_slots (
      assignment_id,
      day_of_week,
      start_time,
      end_time
    ) values
      (v_cancelled_assignment_id, 0, time '09:00', time '10:00'),
      (v_cancelled_assignment_id, 6, time '09:00', time '10:00')
    on conflict do nothing;

    update public.membership_pt_assignments
    set status = 'cancelled',
        member_response_note = 'Demo status seed: manager cancelled this proposal before member decision.',
        updated_at = now()
    where id = v_cancelled_assignment_id;
  end if;

  with ranked_sessions as (
    select
      id,
      row_number() over (order by starts_at, id) as session_rank
    from public.membership_pt_sessions
  )
  update public.membership_pt_sessions as target
  set status = case
      when ranked_sessions.session_rank <= 20 then 'completed'
      when ranked_sessions.session_rank <= 28 then 'cancelled'
      when ranked_sessions.session_rank <= 35 then 'missed'
      when ranked_sessions.session_rank <= 40 then 'rescheduled'
      else 'scheduled'
    end,
    updated_at = now()
  from ranked_sessions
  where target.id = ranked_sessions.id;

  select ms.id, ms.member_id
  into v_active_subscription_id, v_active_subscription_member_id
  from public.membership_subscriptions ms
  where ms.facility_id = v_facility_id
    and ms.status = 'active'
    and ms.has_pt_snapshot = false
  order by ms.created_at
  limit 1;

  if v_active_subscription_id is not null
    and not exists (
      select 1
      from public.membership_payments
      where subscription_id = v_active_subscription_id
        and status = 'refunded'
    )
  then
    insert into public.membership_payments (
      subscription_id,
      member_id,
      amount,
      method,
      status
    ) values (
      v_active_subscription_id,
      v_active_subscription_member_id,
      10.00,
      'cash',
      'refunded'
    );
  end if;

  if not exists (select 1 from public.accounts where status = 'active') then
    raise exception 'status seed expected at least one active account';
  end if;

  if not exists (select 1 from public.accounts where status = 'disabled') then
    raise exception 'status seed expected at least one disabled account';
  end if;

  if not exists (select 1 from public.accounts where status = 'locked') then
    raise exception 'status seed expected at least one locked account';
  end if;

  if not exists (select 1 from public.rooms where facility_id = v_facility_id and status = 'active') then
    raise exception 'status seed expected at least one active room';
  end if;

  if not exists (select 1 from public.rooms where facility_id = v_facility_id and status = 'maintenance') then
    raise exception 'status seed expected at least one maintenance room';
  end if;

  if not exists (select 1 from public.rooms where facility_id = v_facility_id and status = 'closed') then
    raise exception 'status seed expected at least one closed room';
  end if;

  if not exists (select 1 from public.staffs where facility_id = v_facility_id and status = 'active') then
    raise exception 'status seed expected at least one active staff';
  end if;

  if not exists (select 1 from public.staffs where facility_id = v_facility_id and status = 'inactive') then
    raise exception 'status seed expected at least one inactive staff';
  end if;

  if not exists (select 1 from public.staffs where facility_id = v_facility_id and status = 'on_leave') then
    raise exception 'status seed expected at least one on_leave staff';
  end if;

  if not exists (select 1 from public.staffs where facility_id = v_facility_id and status = 'terminated') then
    raise exception 'status seed expected at least one terminated staff';
  end if;

  if not exists (select 1 from public.membership_packages where facility_id = v_facility_id and status = 'active') then
    raise exception 'status seed expected at least one active package';
  end if;

  if not exists (select 1 from public.membership_packages where facility_id = v_facility_id and status = 'inactive') then
    raise exception 'status seed expected at least one inactive package';
  end if;

  if not exists (select 1 from public.membership_packages where facility_id = v_facility_id and status = 'archived') then
    raise exception 'status seed expected at least one archived package';
  end if;

  if not exists (select 1 from public.membership_subscriptions where facility_id = v_facility_id and status = 'pending_pt_setup') then
    raise exception 'status seed expected at least one pending_pt_setup subscription';
  end if;

  if not exists (select 1 from public.membership_subscriptions where facility_id = v_facility_id and status = 'pending_payment') then
    raise exception 'status seed expected at least one pending_payment subscription';
  end if;

  if not exists (select 1 from public.membership_subscriptions where facility_id = v_facility_id and status = 'active') then
    raise exception 'status seed expected at least one active subscription';
  end if;

  if not exists (select 1 from public.membership_subscriptions where facility_id = v_facility_id and status = 'expired') then
    raise exception 'status seed expected at least one expired subscription';
  end if;

  if not exists (select 1 from public.membership_subscriptions where facility_id = v_facility_id and status = 'cancelled') then
    raise exception 'status seed expected at least one cancelled subscription';
  end if;

  if not exists (select 1 from public.membership_pt_assignments where status = 'pending_member_decision') then
    raise exception 'status seed expected at least one pending_member_decision PT assignment';
  end if;

  if not exists (select 1 from public.membership_pt_assignments where status = 'accepted') then
    raise exception 'status seed expected at least one accepted PT assignment';
  end if;

  if not exists (select 1 from public.membership_pt_assignments where status = 'rejected') then
    raise exception 'status seed expected at least one rejected PT assignment';
  end if;

  if not exists (select 1 from public.membership_pt_assignments where status = 'cancelled') then
    raise exception 'status seed expected at least one cancelled PT assignment';
  end if;

  if not exists (select 1 from public.membership_payments where status = 'pending') then
    raise exception 'status seed expected at least one pending payment';
  end if;

  if not exists (select 1 from public.membership_payments where status = 'paid') then
    raise exception 'status seed expected at least one paid payment';
  end if;

  if not exists (select 1 from public.membership_payments where status = 'failed') then
    raise exception 'status seed expected at least one failed payment';
  end if;

  if not exists (select 1 from public.membership_payments where status = 'cancelled') then
    raise exception 'status seed expected at least one cancelled payment';
  end if;

  if not exists (select 1 from public.membership_payments where status = 'refunded') then
    raise exception 'status seed expected at least one refunded payment';
  end if;

  if not exists (select 1 from public.membership_pt_sessions where status = 'scheduled') then
    raise exception 'status seed expected at least one scheduled PT session';
  end if;

  if not exists (select 1 from public.membership_pt_sessions where status = 'completed') then
    raise exception 'status seed expected at least one completed PT session';
  end if;

  if not exists (select 1 from public.membership_pt_sessions where status = 'cancelled') then
    raise exception 'status seed expected at least one cancelled PT session';
  end if;

  if not exists (select 1 from public.membership_pt_sessions where status = 'missed') then
    raise exception 'status seed expected at least one missed PT session';
  end if;

  if not exists (select 1 from public.membership_pt_sessions where status = 'rescheduled') then
    raise exception 'status seed expected at least one rescheduled PT session';
  end if;

  if not exists (select 1 from public.vouchers where facility_id = v_facility_id and status = 'active') then
    raise exception 'status seed expected at least one active voucher';
  end if;

  if not exists (select 1 from public.vouchers where facility_id = v_facility_id and status = 'disabled') then
    raise exception 'status seed expected at least one disabled voucher';
  end if;

  if not exists (select 1 from public.vouchers where facility_id = v_facility_id and status = 'expired') then
    raise exception 'status seed expected at least one expired voucher';
  end if;

  if not exists (
    select 1
    from public.voucher_redemptions vr
    join public.membership_subscriptions ms on ms.id = vr.subscription_id
    where ms.facility_id = v_facility_id
  ) then
    raise exception 'status seed expected at least one voucher redemption';
  end if;
end;
$$;

do $$
declare
  v_missing_tables text;
begin
  select string_agg(table_name, ', ' order by table_name)
  into v_missing_tables
  from (
    values
      ('accounts'),
      ('facility_managers'),
      ('facility_pts'),
      ('gym_equipments'),
      ('gym_facilities'),
      ('membership_package_rooms'),
      ('membership_packages'),
      ('membership_payments'),
      ('membership_pt_assignment_schedule_slots'),
      ('membership_pt_assignments'),
      ('membership_pt_preference_time_slots'),
      ('membership_pt_preferences'),
      ('membership_pt_sessions'),
      ('membership_subscriptions'),
      ('rooms'),
      ('staffs'),
      ('users'),
      ('voucher_redemptions'),
      ('vouchers')
  ) as expected_tables(table_name)
  where case expected_tables.table_name
    when 'accounts' then not exists (select 1 from public.accounts)
    when 'facility_managers' then not exists (select 1 from public.facility_managers)
    when 'facility_pts' then not exists (select 1 from public.facility_pts)
    when 'gym_equipments' then not exists (select 1 from public.gym_equipments)
    when 'gym_facilities' then not exists (select 1 from public.gym_facilities)
    when 'membership_package_rooms' then not exists (select 1 from public.membership_package_rooms)
    when 'membership_packages' then not exists (select 1 from public.membership_packages)
    when 'membership_payments' then not exists (select 1 from public.membership_payments)
    when 'membership_pt_assignment_schedule_slots' then not exists (select 1 from public.membership_pt_assignment_schedule_slots)
    when 'membership_pt_assignments' then not exists (select 1 from public.membership_pt_assignments)
    when 'membership_pt_preference_time_slots' then not exists (select 1 from public.membership_pt_preference_time_slots)
    when 'membership_pt_preferences' then not exists (select 1 from public.membership_pt_preferences)
    when 'membership_pt_sessions' then not exists (select 1 from public.membership_pt_sessions)
    when 'membership_subscriptions' then not exists (select 1 from public.membership_subscriptions)
    when 'rooms' then not exists (select 1 from public.rooms)
    when 'staffs' then not exists (select 1 from public.staffs)
    when 'users' then not exists (select 1 from public.users)
    when 'voucher_redemptions' then not exists (select 1 from public.voucher_redemptions)
    when 'vouchers' then not exists (select 1 from public.vouchers)
    else true
  end;

  if v_missing_tables is not null then
    raise exception 'status seed expected every public app table to have data, missing: %',
      v_missing_tables;
  end if;
end;
$$;

drop function private.seed_status_demo_paid_payment(uuid, timestamptz, text);
drop function private.seed_status_demo_login_user(text, text, text, text, text);
