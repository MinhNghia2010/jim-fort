grant usage on schema public to service_role;

grant select, update on table
  public.membership_subscriptions,
  public.membership_payments,
  public.membership_pt_sessions
to service_role;
