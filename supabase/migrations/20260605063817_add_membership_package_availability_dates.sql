alter table public.membership_packages
  add column if not exists release_date date,
  add column if not exists end_date date;

alter table public.membership_packages
  drop constraint if exists membership_packages_availability_dates_valid,
  add constraint membership_packages_availability_dates_valid
    check (
      release_date is null
      or end_date is null
      or release_date <= end_date
    );

comment on column public.membership_packages.release_date is
  'Optional date when this membership package should become available.';

comment on column public.membership_packages.end_date is
  'Optional date when this membership package should stop being available.';
