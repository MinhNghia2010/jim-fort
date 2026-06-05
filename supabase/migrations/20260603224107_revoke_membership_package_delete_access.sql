revoke delete on table public.membership_packages from authenticated;

drop policy if exists "Owners can delete packages in owned facilities"
  on public.membership_packages;

drop policy if exists "Managers can delete packages in managed facilities"
  on public.membership_packages;
