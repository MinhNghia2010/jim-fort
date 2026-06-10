drop policy if exists "Managers can read PT preferences in managed facilities"
  on public.membership_pt_preferences;

drop policy if exists "Managers can read PT preference slots in managed facilities"
  on public.membership_pt_preference_time_slots;

drop policy if exists "Managers can read PT assignments in managed facilities"
  on public.membership_pt_assignments;

drop policy if exists "Managers can create PT assignments in managed facilities"
  on public.membership_pt_assignments;

drop policy if exists "Managers can read PT assignment slots in managed facilities"
  on public.membership_pt_assignment_schedule_slots;

drop policy if exists "Managers can create PT assignment slots in managed facilities"
  on public.membership_pt_assignment_schedule_slots;
