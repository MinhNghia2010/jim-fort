grant select on table
  public.facility_feedbacks,
  public.pt_session_feedbacks,
  public.membership_pt_sessions,
  public.membership_pt_assignments
to service_role;

grant select, delete on table
  public.membership_packages,
  public.staffs,
  public.facility_managers,
  public.facility_pts
to service_role;

alter table public.membership_subscriptions
  drop constraint if exists membership_subscriptions_member_id_fkey;
alter table public.membership_subscriptions
  add constraint membership_subscriptions_member_id_fkey
  foreign key (member_id)
  references public.users(id)
  on delete cascade;

alter table public.membership_payments
  drop constraint if exists membership_payments_subscription_id_fkey;
alter table public.membership_payments
  add constraint membership_payments_subscription_id_fkey
  foreign key (subscription_id)
  references public.membership_subscriptions(id)
  on delete cascade;

alter table public.membership_payments
  drop constraint if exists membership_payments_member_id_fkey;
alter table public.membership_payments
  add constraint membership_payments_member_id_fkey
  foreign key (member_id)
  references public.users(id)
  on delete cascade;

alter table public.voucher_redemptions
  drop constraint if exists voucher_redemptions_subscription_id_fkey;
alter table public.voucher_redemptions
  add constraint voucher_redemptions_subscription_id_fkey
  foreign key (subscription_id)
  references public.membership_subscriptions(id)
  on delete cascade;

alter table public.voucher_redemptions
  drop constraint if exists voucher_redemptions_member_id_fkey;
alter table public.voucher_redemptions
  add constraint voucher_redemptions_member_id_fkey
  foreign key (member_id)
  references public.users(id)
  on delete cascade;

alter table public.facility_feedbacks
  drop constraint if exists facility_feedbacks_member_id_fkey;
alter table public.facility_feedbacks
  add constraint facility_feedbacks_member_id_fkey
  foreign key (member_id)
  references public.users(id)
  on delete cascade;

alter table public.membership_pt_sessions
  drop constraint if exists membership_pt_sessions_member_id_fkey;
alter table public.membership_pt_sessions
  add constraint membership_pt_sessions_member_id_fkey
  foreign key (member_id)
  references public.users(id)
  on delete cascade;

alter table public.pt_session_feedbacks
  drop constraint if exists pt_session_feedbacks_member_id_fkey;
alter table public.pt_session_feedbacks
  add constraint pt_session_feedbacks_member_id_fkey
  foreign key (member_id)
  references public.users(id)
  on delete cascade;
