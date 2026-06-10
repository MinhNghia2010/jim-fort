create or replace function public.report_equipment_issue(
  p_equipment_id uuid,
  p_new_status text,
  p_issue text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_equipment public.gym_equipments%rowtype;
  v_issue text := nullif(trim(p_issue), '');
begin
  if p_new_status not in ('active', 'maintenance', 'broken', 'retired') then
    raise exception 'Invalid equipment status.';
  end if;

  if v_issue is null then
    raise exception 'Issue is required.';
  end if;

  select *
  into v_equipment
  from public.gym_equipments
  where id = p_equipment_id
  for update;

  if not found then
    return false;
  end if;

  update public.gym_equipments
  set
    status = p_new_status,
    note = v_issue,
    updated_at = now()
  where id = v_equipment.id;

  insert into public.equipment_issue_reports (
    facility_id,
    equipment_id,
    reported_by_manager_id,
    previous_status,
    new_status,
    issue
  )
  values (
    v_equipment.facility_id,
    v_equipment.id,
    (select auth.uid()),
    v_equipment.status,
    p_new_status,
    v_issue
  );

  return true;
end;
$$;

revoke all on function public.report_equipment_issue(uuid, text, text)
from public, anon, authenticated, service_role;
grant execute on function public.report_equipment_issue(uuid, text, text)
to authenticated;
