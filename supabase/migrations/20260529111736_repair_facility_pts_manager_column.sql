alter table public.facility_pts
  add column if not exists assigned_by_manager_id uuid
    references public.users(id)
    on delete set null;

comment on column public.facility_pts.assigned_by_manager_id is
  'Manager or owner user who assigned the PT, when available.';

create index if not exists facility_pts_assigned_by_manager_id_idx
  on public.facility_pts (assigned_by_manager_id);
