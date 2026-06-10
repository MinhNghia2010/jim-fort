grant usage on schema public to service_role;

grant select on table public.staffs to service_role;
grant update (
  full_name,
  phone,
  role,
  status,
  hired_at,
  note,
  updated_at
) on table public.staffs to service_role;
