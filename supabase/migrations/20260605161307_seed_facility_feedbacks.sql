-- Managers and the owner receive these rows through the facility_feedbacks
-- read policies. No separate recipient table is needed for this flow.
with seed_rows (
  member_email,
  subject,
  message,
  rating,
  status,
  manager_response,
  respondent_email,
  responded_at,
  created_at
) as (
  values
    (
      'member02@gmail.com',
      'Locker room cleanliness',
      'The locker room is usually fine, but the floor near the showers needs more frequent cleaning during evening peak hours.',
      3,
      'open',
      null,
      null,
      null::timestamptz,
      timestamptz '2026-06-01 18:15:00+07'
    ),
    (
      'member05@gmail.com',
      'Front desk support was helpful',
      'The front desk helped me fix my membership check-in issue quickly. Good experience.',
      5,
      'closed',
      'Thanks for the feedback. We shared this with the front desk team.',
      'manager@gmail.com',
      timestamptz '2026-06-02 09:30:00+07',
      timestamptz '2026-06-01 20:05:00+07'
    ),
    (
      'member07@gmail.com',
      'Cardio treadmill issue',
      'The second treadmill in the cardio room stopped twice during my run. Please check it before more members use it.',
      2,
      'in_review',
      null,
      null,
      null::timestamptz,
      timestamptz '2026-06-02 07:45:00+07'
    ),
    (
      'member10@gmail.com',
      'More yoga evening classes',
      'The evening yoga classes are always full. It would be useful to add one more slot after 7 PM.',
      4,
      'responded',
      'We are reviewing the room schedule and will test one extra evening slot next week.',
      'manager02@gmail.com',
      timestamptz '2026-06-03 11:00:00+07',
      timestamptz '2026-06-02 19:20:00+07'
    ),
    (
      'member13@gmail.com',
      'Need more dumbbell pairs',
      'The 12.5kg and 15kg dumbbells are hard to find during peak hours. More pairs would help.',
      3,
      'open',
      null,
      null,
      null::timestamptz,
      timestamptz '2026-06-03 18:40:00+07'
    ),
    (
      'member16@gmail.com',
      'Membership package access is clear',
      'The room access rules for my package were clear at check-in. The staff explained them well.',
      5,
      'responded',
      'Glad to hear that. We will keep the package access explanation consistent at check-in.',
      'owner@gmail.com',
      timestamptz '2026-06-04 10:10:00+07',
      timestamptz '2026-06-03 21:10:00+07'
    ),
    (
      'member18@gmail.com',
      'Peak hour crowding',
      'The weight room gets very crowded after 6 PM. It is hard to use benches without waiting.',
      3,
      'in_review',
      null,
      null,
      null::timestamptz,
      timestamptz '2026-06-04 18:55:00+07'
    ),
    (
      'member20@gmail.com',
      'Shower water pressure',
      'The shower water pressure has been weak for a few days. Please check the facility plumbing.',
      2,
      'closed',
      'Maintenance checked the shower area and adjusted the water pressure this morning.',
      'manager@gmail.com',
      timestamptz '2026-06-05 08:45:00+07',
      timestamptz '2026-06-04 20:30:00+07'
    )
),
resolved_rows as (
  select
    gf.id as facility_id,
    member_user.id as member_id,
    seed_rows.subject,
    seed_rows.message,
    seed_rows.rating,
    seed_rows.status,
    seed_rows.manager_response,
    respondent_user.id as responded_by_manager_id,
    seed_rows.responded_at,
    seed_rows.created_at
  from seed_rows
  join public.gym_facilities gf
    on gf.name = 'Jim Fort Gym'
  join public.accounts member_account
    on member_account.email = seed_rows.member_email
  join public.users member_user
    on member_user.account_id = member_account.id
   and member_user.role = 'member'
  left join public.accounts respondent_account
    on respondent_account.email = seed_rows.respondent_email
  left join public.users respondent_user
    on respondent_user.account_id = respondent_account.id
   and respondent_user.role in ('manager', 'owner')
)
insert into public.facility_feedbacks (
  facility_id,
  member_id,
  subject,
  message,
  rating,
  status,
  manager_response,
  responded_by_manager_id,
  responded_at,
  created_at,
  updated_at
)
select
  resolved_rows.facility_id,
  resolved_rows.member_id,
  resolved_rows.subject,
  resolved_rows.message,
  resolved_rows.rating,
  resolved_rows.status,
  resolved_rows.manager_response,
  resolved_rows.responded_by_manager_id,
  resolved_rows.responded_at,
  resolved_rows.created_at,
  greatest(resolved_rows.created_at, coalesce(resolved_rows.responded_at, resolved_rows.created_at))
from resolved_rows
where not exists (
  select 1
  from public.facility_feedbacks existing
  where existing.facility_id = resolved_rows.facility_id
    and existing.member_id = resolved_rows.member_id
    and existing.subject = resolved_rows.subject
);

do $$
declare
  seeded_feedback_count integer;
begin
  select count(*)
  into seeded_feedback_count
  from public.facility_feedbacks ff
  join public.gym_facilities gf on gf.id = ff.facility_id
  where gf.name = 'Jim Fort Gym'
    and ff.subject in (
      'Locker room cleanliness',
      'Front desk support was helpful',
      'Cardio treadmill issue',
      'More yoga evening classes',
      'Need more dumbbell pairs',
      'Membership package access is clear',
      'Peak hour crowding',
      'Shower water pressure'
    );

  if seeded_feedback_count < 8 then
    raise exception 'expected 8 seeded facility feedback rows, found %',
      seeded_feedback_count;
  end if;

  if exists (
    select 1
    from public.facility_feedbacks ff
    left join public.facility_managers fm
      on fm.facility_id = ff.facility_id
     and fm.manager_id = ff.responded_by_manager_id
    left join public.gym_facilities gf
      on gf.id = ff.facility_id
     and gf.owner_id = ff.responded_by_manager_id
    where ff.manager_response is not null
      and fm.manager_id is null
      and gf.owner_id is null
  ) then
    raise exception 'seeded feedback responses must point to a manager or owner of the facility';
  end if;
end;
$$;
